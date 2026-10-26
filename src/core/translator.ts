import fs from 'fs'
import path from 'path'
import * as translateModule from '@vitalets/google-translate-api'
import {
  DynamicTranslateConfig,
  TranslationOptions,
  TranslationStats,
  TranslateItemParams,
  TranslateBatchParams,
} from '../types'
import { loadConfig, normalizeLangCode, toLibreTranslateCode } from '../config'

/**
 * Utilitário para dividir um array em blocos menores (chunks)
 */
export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Utilitário de pool assíncrono para limitar concorrência de Promises
 */
export async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const ret: Promise<R>[] = []
  const executing: Set<Promise<any>> = new Set()

  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    const p = Promise.resolve().then(() => iteratorFn(item, i))
    ret.push(p)
    executing.add(p)

    const clean = () => executing.delete(p)
    p.then(clean, clean)

    if (executing.size >= poolLimit) {
      await Promise.race(executing)
    }
  }

  return Promise.all(ret)
}

/**
 * Verifica se o serviço do LibreTranslate está ativo e respondendo
 */
export async function checkProviderHealth(apiUrl: string): Promise<boolean> {
  try {
    const endpoint = `${apiUrl.replace(/\/+$/, '')}/languages`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(endpoint, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Traduz um lote de textos (Batch Translation)
 */
async function callGoogleTranslate(text: string, from: string, to: string): Promise<string> {
  const fn: any =
    (translateModule as any).translate ||
    (translateModule as any).default?.translate ||
    (translateModule as any).default ||
    translateModule
  if (typeof fn !== 'function') {
    return text
  }
  const target = to.toLowerCase() === 'zh' ? 'zh-CN' : to
  const resp = await fn(text, {
    from,
    to: target,
  })
  return resp?.text || text
}

export async function translateBatch({
  texts,
  from,
  to,
  provider = 'libretranslate',
  apiUrl = 'http://localhost:5000',
  apiKey = '',
  googleApiKey = '',
  timeoutMs,
}: TranslateBatchParams): Promise<string[]> {
  if (texts.length === 0) return []

  const normalizedFrom = normalizeLangCode(from)
  const normalizedTo = normalizeLangCode(to)

  const isSame =
    normalizedFrom.toLowerCase() === normalizedTo.toLowerCase() ||
    toLibreTranslateCode(from) === toLibreTranslateCode(to)

  if (isSame) {
    return texts
  }

  const effectiveTimeout =
    timeoutMs ||
    (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1') ? 120000 : 30000)

  if (provider === 'google') {
    const gKey = googleApiKey || apiKey
    if (gKey) {
      try {
        const endpoint = `https://translation.googleapis.com/language/translate/v2?key=${gKey}`
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), effectiveTimeout)

        const response = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: texts,
            source: normalizedFrom,
            target: normalizedTo,
            format: 'text',
          }),
        })
        clearTimeout(timer)

        if (response.ok) {
          const data = (await response.json()) as {
            data?: { translations?: Array<{ translatedText?: string }> }
          }
          const results = data?.data?.translations?.map((t) => t.translatedText || '') || []
          if (results.length === texts.length) {
            return results
          }
        }
      } catch {
        // Fallback para scraping
      }
    }

    // Google scraping concorrente com pool para evitar rate-limit
    return await asyncPool(5, texts, async (text) => {
      try {
        return await callGoogleTranslate(text, normalizedFrom, normalizedTo)
      } catch {
        return text
      }
    })
  }

  // LibreTranslate API com suporte nativo a array no campo 'q'
  const endpoint = `${apiUrl.replace(/\/+$/, '')}/translate`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), effectiveTimeout)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source: toLibreTranslateCode(from),
        target: toLibreTranslateCode(to),
        format: 'text',
        alternatives: 1,
        api_key: apiKey,
      }),
    })
    clearTimeout(timer)

    if (response.ok) {
      const data = (await response.json()) as { translatedText?: string | string[] }
      if (Array.isArray(data.translatedText) && data.translatedText.length === texts.length) {
        return data.translatedText
      } else if (typeof data.translatedText === 'string') {
        return [data.translatedText]
      }
    }
  } catch {
    clearTimeout(timer)
  }

  // Fallback individual item a item se a resposta em lote falhar ou der timeout
  const fallbackResults: string[] = []
  for (const text of texts) {
    const res = await translateText({
      text,
      from,
      to,
      provider,
      apiUrl,
      apiKey,
      googleApiKey,
      timeoutMs: Math.min(30000, effectiveTimeout),
    })
    fallbackResults.push(res || text)
  }
  return fallbackResults
}

/**
 * Traduz um texto único utilizando o provedor escolhido
 */
export async function translateText({
  text,
  from,
  to,
  provider = 'libretranslate',
  apiUrl = 'http://localhost:5000',
  apiKey = '',
  googleApiKey = '',
  timeoutMs = 30000,
}: TranslateItemParams): Promise<string> {
  const normalizedFrom = normalizeLangCode(from)
  const normalizedTo = normalizeLangCode(to)

  const isSame =
    normalizedFrom.toLowerCase() === normalizedTo.toLowerCase() ||
    toLibreTranslateCode(from) === toLibreTranslateCode(to)

  if (isSame) {
    return text
  }

  try {
    if (provider === 'google') {
      const gKey = googleApiKey || apiKey
      if (gKey) {
        const endpoint = `https://translation.googleapis.com/language/translate/v2?key=${gKey}`
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        const response = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: [text],
            source: normalizedFrom,
            target: normalizedTo,
            format: 'text',
          }),
        })
        clearTimeout(timer)

        if (response.ok) {
          const data = (await response.json()) as {
            data?: { translations?: Array<{ translatedText?: string }> }
          }
          return data?.data?.translations?.[0]?.translatedText || ''
        }
      }

      return await callGoogleTranslate(text, normalizedFrom, normalizedTo)
    }

    const endpoint = `${apiUrl.replace(/\/+$/, '')}/translate`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: toLibreTranslateCode(from),
        target: toLibreTranslateCode(to),
        format: 'text',
        alternatives: 1,
        api_key: apiKey,
      }),
    })
    clearTimeout(timer)

    if (response.ok) {
      const data = (await response.json()) as { translatedText?: string }
      return data.translatedText || ''
    }
    return ''
  } catch {
    return ''
  }
}

/**
 * Executa o fluxo otimizado de tradução com Lotes (Batch) e Concorrência Paralela
 */
export async function translateAll(
  options?: TranslationOptions & Partial<DynamicTranslateConfig>,
  cwd: string = process.cwd(),
): Promise<TranslationStats[]> {
  const config = loadConfig(cwd, options)
  const baseLang = (config.baseLang || 'pt-br').toLowerCase()
  const outputDir = path.resolve(cwd, config.outputDir || 'src/i18n')
  const baseFile = path.join(outputDir, `${baseLang}.json`)

  if (!fs.existsSync(baseFile)) {
    throw new Error(
      `[dynamic-translate] Arquivo base não encontrado em "${baseFile}". Execute dynamic-translate extract primeiro.`,
    )
  }

  const baseRaw = fs.readFileSync(baseFile, 'utf-8').trim()
  const baseObject: Record<string, string> = JSON.parse(baseRaw || '{}')
  const baseKeys = Object.keys(baseObject)

  const targetLangs = options?.languages || config.langs
  const provider = options?.provider || config.provider || 'libretranslate'
  const override = options?.override ?? false
  const apiUrl = config.libretranslateUrl || 'http://localhost:5000'
  const apiKey = config.libretranslateApiKey || ''
  const googleApiKey = config.googleApiKey || ''
  const batchSize = options?.batchSize || config.batchSize || 25
  const concurrency = options?.concurrency || config.concurrency || 6

  console.info(
    `🚀 [dynamic-translate] Iniciando tradução de ${baseKeys.length} chaves de "${baseLang}" para [${targetLangs.join(
      ', ',
    )}]`,
  )
  console.info(
    `⚡ [dynamic-translate] Modo Turbo: provider=${provider}, batchSize=${batchSize}, concurrency=${concurrency}, override=${override}`,
  )

  if (provider === 'libretranslate') {
    const isHealthy = await checkProviderHealth(apiUrl)
    if (!isHealthy) {
      console.warn(`\n⚠️  [dynamic-translate] O serviço LibreTranslate não respondeu em ${apiUrl}.`)
      console.warn(`👉 Certifique-se de que o Docker está iniciado:`)
      console.warn(`   node dynamic-translate/dist/cli.js docker\n`)
    }
  }

  console.info('')

  const statsList: TranslationStats[] = []
  const isTTY = Boolean(process.stdout.isTTY)

  for (const lang of targetLangs) {
    const langFileCode = lang.toLowerCase()
    const outPath = path.join(outputDir, `${langFileCode}.json`)

    // Carrega traduções existentes
    let existingTranslations: Record<string, string> = {}
    if (fs.existsSync(outPath)) {
      try {
        const existingRaw = fs.readFileSync(outPath, 'utf-8').trim()
        if (existingRaw && existingRaw !== '{}') {
          existingTranslations = JSON.parse(existingRaw)
        }
      } catch (err: any) {
        console.warn(`⚠️ [dynamic-translate] Erro ao ler arquivo existente ${outPath}:`, err.message)
      }
    }

    // Carrega exceções
    let exceptionObject: Record<string, string> = {}
    const exceptionFileCandidates = [
      path.join(outputDir, `exceptions.${langFileCode}.json`),
      path.join(outputDir, `exceptions.${lang}.json`),
    ]
    for (const excPath of exceptionFileCandidates) {
      if (fs.existsSync(excPath)) {
        try {
          const excRaw = fs.readFileSync(excPath, 'utf-8').trim()
          if (excRaw && excRaw !== '{}') {
            exceptionObject = { ...exceptionObject, ...JSON.parse(excRaw) }
          }
        } catch (err: any) {
          console.warn(`⚠️ [dynamic-translate] Erro ao ler exceções de ${excPath}:`, err.message)
        }
      }
    }

    const output: Record<string, string> = {}
    const keysToTranslate: string[] = []
    let reusedCount = 0
    let exceptionCount = 0

    const isBaseLangMatch =
      normalizeLangCode(baseLang).toLowerCase() === normalizeLangCode(lang).toLowerCase() ||
      toLibreTranslateCode(baseLang) === toLibreTranslateCode(lang)

    // Separa o que já está resolvido do que precisa ir para a API
    for (const key of baseKeys) {
      const existing = existingTranslations[key]
      // Considera reutilizado se existe e não está vazio.
      // Se a língua de destino for diferente da língua base, mas o valor existente for IDÊNTICO
      // à chave em português, consideramos que foi um fallback não traduzido anterior (erro/timeout)
      // e colocamos na fila para re-traduzir, a menos que conste explicitamente no arquivo de exceções.
      const isActuallyTranslated =
        existing &&
        existing.trim() !== '' &&
        (isBaseLangMatch || existing !== key)

      if (exceptionObject[key]) {
        output[key] = exceptionObject[key]
        exceptionCount++
      } else if (!override && isActuallyTranslated) {
        output[key] = existing
        reusedCount++
      } else {
        keysToTranslate.push(key)
      }
    }

    let translatedCount = 0
    let processedTotal = reusedCount + exceptionCount

    if (isTTY) {
      const initialPercent = Math.round((processedTotal / baseKeys.length) * 100)
      process.stdout.write(
        `\r⏳ [dynamic-translate] [${lang}] ${processedTotal}/${baseKeys.length} (${initialPercent}%) | Pendentes: ${keysToTranslate.length} | Reutilizadas: ${reusedCount} | Exceções: ${exceptionCount}`,
      )
    }

    // Se houver chaves para traduzir, processa em lotes concorrentes
    if (keysToTranslate.length > 0) {
      const batches = chunkArray(keysToTranslate, batchSize)

      await asyncPool(concurrency, batches, async (batch) => {
        const translations = await translateBatch({
          texts: batch,
          from: baseLang,
          to: lang,
          provider,
          apiUrl,
          apiKey,
          googleApiKey,
          timeoutMs: config.timeoutMs,
        })

        batch.forEach((key, index) => {
          const translated = translations[index]
          output[key] = translated || key
          if (translated && (isBaseLangMatch || translated !== key)) {
            translatedCount++
          }
          processedTotal++
        })

        if (isTTY) {
          const percent = Math.round((processedTotal / baseKeys.length) * 100)
          process.stdout.write(
            `\r⏳ [dynamic-translate] [${lang}] ${processedTotal}/${baseKeys.length} (${percent}%) | Traduzidas: ${translatedCount} | Reutilizadas: ${reusedCount} | Exceções: ${exceptionCount}`,
          )
        }
      })
    }

    if (isTTY) {
      process.stdout.write('\n')
    }

    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')

    const stat: TranslationStats = {
      lang,
      totalKeys: baseKeys.length,
      translatedCount,
      reusedCount,
      exceptionCount,
      outputFile: outPath,
    }

    statsList.push(stat)

    console.info(
      `✅ [dynamic-translate] ${lang}: ${baseKeys.length} total | ${translatedCount} traduzidas | ${reusedCount} reutilizadas | ${exceptionCount} exceções`,
    )
    console.info(`📁 [dynamic-translate] Salvo em: ${outPath}\n`)
  }

  return statsList
}
