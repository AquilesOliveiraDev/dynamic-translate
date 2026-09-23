export type TranslationProvider = 'libretranslate' | 'google'

export interface DynamicTranslateConfig {
  /**
   * Expressão regular para encontrar as chaves de texto.
   * Exemplo: /\bt\('([^']+)'\)/g
   */
  rule: RegExp | string
  /**
   * Lista de códigos de idioma para tradução.
   * Exemplo: ['pt', 'pt-BR', 'en', 'es', 'it', 'zh', 'fr']
   */
  langs: string[]
  /**
   * Idioma base / fonte das extrações.
   * Padrão: 'pt-br'
   */
  baseLang?: string
  /**
   * Diretórios a serem escaneados recursivamente.
   * Padrão: ['src']
   */
  scanFolders?: string[]
  /**
   * Diretórios a serem ignorados/excluídos da busca.
   * Exemplo: ['src/i18n-old']
   */
  ignoreFolders?: string[]
  /**
   * Extensões de arquivos para escanear.
   * Padrão: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.html']
   */
  fileExtensions?: string[]
  /**
   * Diretório onde os arquivos JSON de tradução residem.
   * Padrão: 'src/i18n'
   */
  outputDir?: string
  /**
   * URL do endpoint do LibreTranslate.
   * Padrão: 'http://localhost:5000'
   */
  libretranslateUrl?: string
  /**
   * Chave de API opcional para o LibreTranslate.
   */
  libretranslateApiKey?: string
  /**
   * Porta para execução do Docker do LibreTranslate.
   * Padrão: 5000
   */
  libretranslatePort?: number
  /**
   * Chave de API opcional para o Google Cloud Translation API (oficial).
   */
  googleApiKey?: string
  /**
   * Quantidade de textos por lote (batch).
   * Padrão: 25
   */
  batchSize?: number
  /**
   * Quantidade de requisições concorrentes simultâneas.
   * Padrão: 6
   */
  concurrency?: number
  /**
   * Provedor de tradução padrão.
   * Padrão: 'libretranslate'
   */
  provider?: TranslationProvider
}

export interface ExtractionResult {
  totalExtracted: number
  keys: string[]
  outputFile: string
  scannedFilesCount: number
}

export interface TranslationStats {
  lang: string
  totalKeys: number
  translatedCount: number
  reusedCount: number
  exceptionCount: number
  outputFile: string
}

export interface TranslationOptions {
  override?: boolean
  provider?: TranslationProvider
  languages?: string[]
  batchSize?: number
  concurrency?: number
}

export interface TranslateItemParams {
  text: string
  from: string
  to: string
  provider?: TranslationProvider
  apiUrl?: string
  apiKey?: string
  googleApiKey?: string
}

export interface TranslateBatchParams {
  texts: string[]
  from: string
  to: string
  provider?: TranslationProvider
  apiUrl?: string
  apiKey?: string
  googleApiKey?: string
}
