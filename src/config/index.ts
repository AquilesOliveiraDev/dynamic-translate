import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { DynamicTranslateConfig, TranslationProvider } from '../types'

/**
 * Converte uma string de regex (ex: '/\\bt\\(\'([^\']+)\'\\)/g') para uma instância nativa RegExp
 */
export function parseRegexRule(ruleStr: string | RegExp): RegExp {
  if (ruleStr instanceof RegExp) {
    return ruleStr
  }

  const trimmed = ruleStr.trim()
  const match = trimmed.match(/^\/(.*)\/([a-z]*)$/)
  if (match) {
    const [, pattern, flags] = match
    return new RegExp(pattern, flags || 'g')
  }

  return new RegExp(trimmed, 'g')
}

/**
 * Normaliza códigos de idioma para o padrão de APIs de tradução
 */
export function normalizeLangCode(lang: string): string {
  const lower = lang.toLowerCase().trim()
  if (lower === 'br' || lower === 'pt-br') return 'pt-BR'
  if (lower === 'en-us') return 'en'
  if (lower === 'zh-cn' || lower === 'zh') return 'zh'
  return lang
}

/**
 * Converte qualquer código de idioma para o padrão ISO 639-1 aceito pelo LibreTranslate
 */
export function toLibreTranslateCode(lang: string): string {
  const lower = lang.toLowerCase().trim()
  if (lower === 'br' || lower.startsWith('pt')) return 'pt'
  if (lower.startsWith('en')) return 'en'
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('es')) return 'es'
  if (lower.startsWith('it')) return 'it'
  if (lower.startsWith('fr')) return 'fr'
  if (lower.startsWith('de')) return 'de'
  if (lower.startsWith('ja')) return 'ja'
  if (lower.startsWith('ru')) return 'ru'
  if (lower.startsWith('ar')) return 'ar'
  if (lower.startsWith('hi')) return 'hi'
  return lower.split('-')[0].split('_')[0]
}

/**
 * Carrega a configuração a partir de variáveis de ambiente (.env) ou opções fornecidas
 */
export function loadConfig(
  cwd: string = process.cwd(),
  customConfig?: Partial<DynamicTranslateConfig>,
): DynamicTranslateConfig {
  // Tenta carregar .env do diretório atual, subpasta dynamic-translate e caminhos relativos
  const envCandidates = [
    path.resolve(cwd, 'dynamic-translate/.env'),
    path.resolve(cwd, '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(cwd, '.env.local'),
    path.resolve(cwd, '.env.dev'),
  ]

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false })
    }
  }

  const envRule = process.env.RULE || process.env.TRANSLATE_RULE || "/\\bt\\('([^']+)'\\)/g"
  const envLangs = process.env.LANGS || process.env.TRANSLATE_LANGS || 'pt,en,es,it,zh,fr'
  const envBaseLang = process.env.BASE_LANG || 'pt-br'
  const envScanFolders = process.env.SCAN_FOLDERS || 'src'
  const envIgnoreFolders = process.env.IGNORE_FOLDERS || process.env.EXCLUDE_FOLDERS || ''
  const envFileExtensions = process.env.FILE_EXTENSIONS || '.ts,.tsx,.js,.jsx,.vue,.svelte,.html'
  const envOutputDir = process.env.OUTPUT_DIR || 'src/i18n'
  const envLibreUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000'
  const envLibrePort = Number(process.env.LIBRETRANSLATE_PORT) || 5000
  const envApiKey = process.env.LIBRETRANSLATE_API_KEY || ''
  const envGoogleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY || ''
  const envProvider = (process.env.TRANSLATE_PROVIDER as TranslationProvider) || 'libretranslate'
  const targetProvider = customConfig?.provider || envProvider
  const targetLibreUrl = customConfig?.libretranslateUrl || envLibreUrl
  const isLocalLibre =
    targetProvider === 'libretranslate' &&
    (targetLibreUrl.includes('localhost') || targetLibreUrl.includes('127.0.0.1'))

  // Para LibreTranslate local no Docker, lotes menores e concorrência menor evitam gargalo de CPU
  const defaultBatchSize = isLocalLibre ? 10 : 25
  const defaultConcurrency = isLocalLibre ? 2 : 6
  const defaultTimeout = isLocalLibre ? 120000 : 30000

  const envBatchSize = Number(process.env.TRANSLATE_BATCH_SIZE) || defaultBatchSize
  const envConcurrency = Number(process.env.TRANSLATE_CONCURRENCY) || defaultConcurrency
  const envTimeout = Number(process.env.TRANSLATE_TIMEOUT) || defaultTimeout

  const langs = customConfig?.langs || envLangs.split(',').map((l) => l.trim()).filter(Boolean)
  const rule = parseRegexRule(customConfig?.rule || envRule)
  const baseLang = customConfig?.baseLang || envBaseLang
  const scanFolders = customConfig?.scanFolders || envScanFolders.split(',').map((f) => f.trim()).filter(Boolean)
  const ignoreFolders =
    customConfig?.ignoreFolders ||
    envIgnoreFolders
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
  const fileExtensions = customConfig?.fileExtensions || envFileExtensions.split(',').map((e) => e.trim()).filter(Boolean)
  const outputDir = customConfig?.outputDir || envOutputDir
  const libretranslateUrl = targetLibreUrl
  const libretranslateApiKey = customConfig?.libretranslateApiKey || envApiKey
  const libretranslatePort = customConfig?.libretranslatePort || envLibrePort
  const googleApiKey = customConfig?.googleApiKey || envGoogleApiKey
  const batchSize = customConfig?.batchSize || envBatchSize
  const concurrency = customConfig?.concurrency || envConcurrency
  const provider = targetProvider
  const timeoutMs = customConfig?.timeoutMs || envTimeout

  return {
    rule,
    langs,
    baseLang,
    scanFolders,
    ignoreFolders,
    fileExtensions,
    outputDir,
    libretranslateUrl,
    libretranslateApiKey,
    libretranslatePort,
    googleApiKey,
    batchSize,
    concurrency,
    provider,
    timeoutMs,
  }
}
