/**
 * Armazenamento e loader universal de traduções para qualquer framework
 */
export type LocaleDictionary = Record<string, string>

export type LocaleLoaderFn = () => Promise<{ default: LocaleDictionary } | LocaleDictionary>

export interface CreateI18nOptions<TLang extends string = string> {
  defaultLocale: TLang
  fallbackLocale?: TLang
  loaders: Record<TLang, LocaleLoaderFn>
  onLocaleChange?: (locale: TLang) => void
}

export class DynamicTranslateStore<TLang extends string = string> {
  private currentLocale: TLang
  private fallbackLocale: TLang
  private loaders: Record<TLang, LocaleLoaderFn>
  private dictionaries: Map<string, LocaleDictionary> = new Map()
  private loadedLocales: Set<string> = new Set()
  private listeners: Set<(locale: TLang) => void> = new Set()

  constructor(options: CreateI18nOptions<TLang>) {
    this.currentLocale = options.defaultLocale
    this.fallbackLocale = options.fallbackLocale || options.defaultLocale
    this.loaders = options.loaders
    if (options.onLocaleChange) {
      this.listeners.add(options.onLocaleChange)
    }
  }

  public async loadLocale(locale: TLang): Promise<LocaleDictionary> {
    if (this.dictionaries.has(locale)) {
      return this.dictionaries.get(locale)!
    }

    const loader = this.loaders[locale]
    if (!loader) {
      console.warn(`[dynamic-translate] Nenhum loader configurado para o idioma: "${locale}"`)
      return {}
    }

    const mod = await loader()
    const dict: LocaleDictionary =
      typeof mod === 'object' && mod !== null && 'default' in mod
        ? (mod.default as LocaleDictionary)
        : (mod as LocaleDictionary)
    this.dictionaries.set(locale, dict)
    this.loadedLocales.add(locale)
    return dict
  }

  public async setLocale(locale: TLang): Promise<void> {
    await this.loadLocale(locale)
    if (this.fallbackLocale && !this.dictionaries.has(this.fallbackLocale)) {
      await this.loadLocale(this.fallbackLocale)
    }
    this.currentLocale = locale
    this.listeners.forEach((listener) => listener(locale))
  }

  public getLocale(): TLang {
    return this.currentLocale
  }

  public t(key: string, params?: Record<string, string | number>): string {
    const currentDict = this.dictionaries.get(this.currentLocale)
    const fallbackDict = this.dictionaries.get(this.fallbackLocale)

    let text = currentDict?.[key] || fallbackDict?.[key] || key

    if (params) {
      for (const [paramKey, val] of Object.entries(params)) {
        text = text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(val))
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(val))
      }
    }

    return text
  }

  public subscribe(listener: (locale: TLang) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

/**
 * Cria uma instância de i18n universal e agnóstica de framework
 */
export function createDynamicI18n<TLang extends string = string>(
  options: CreateI18nOptions<TLang>,
): DynamicTranslateStore<TLang> {
  return new DynamicTranslateStore<TLang>(options)
}

export * from './i18next-adapter'
