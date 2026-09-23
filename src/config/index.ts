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
  const lower = lang.toLowerCase()
  if (lower === 'br' || lower === 'pt-br') return 'pt-BR'
  if (lower === 'en-us') return 'en'
  if (lower === 'zh-cn' || lower === 'zh') return 'zh'
  return lang
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
  const envLangs = process.env.LANGS || process.env.TRANSLATE_LANGS || 'pt,pt-BR,en,es,it,zh,fr'
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
  const envBatchSize = Number(process.env.TRANSLATE_BATCH_SIZE) || 25
  const envConcurrency = Number(process.env.TRANSLATE_CONCURRENCY) || 6

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
  const libretranslateUrl = customConfig?.libretranslateUrl || envLibreUrl
  const libretranslateApiKey = customConfig?.libretranslateApiKey || envApiKey
  const libretranslatePort = customConfig?.libretranslatePort || envLibrePort
  const googleApiKey = customConfig?.googleApiKey || envGoogleApiKey
  const batchSize = customConfig?.batchSize || envBatchSize
  const concurrency = customConfig?.concurrency || envConcurrency
  const provider = customConfig?.provider || envProvider

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
  }
}
