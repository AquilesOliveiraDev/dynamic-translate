import type { i18n as I18nInstance } from 'i18next'
import { LocaleDictionary, LocaleLoaderFn } from './index'

export interface I18nextAdapterOptions<TLang extends string = string> {
  i18n: I18nInstance
  loaders: Record<TLang, LocaleLoaderFn>
  defaultLocale: TLang
  fallbackLocale?: TLang
  ns?: string
  storageKey?: string
}

/**
 * Cria um gerenciador otimizado para integração com i18next e react-i18next
 */
export function createI18nextLoader<TLang extends string = string>(
  options: I18nextAdapterOptions<TLang>,
) {
  const {
    i18n,
    loaders,
    defaultLocale,
    fallbackLocale = defaultLocale,
    ns = 'translation',
    storageKey = 'locale',
  } = options

  const loadedLocales = new Set<string>()
  let initPromise: Promise<void> | null = null

  const loadLocale = async (lng: string): Promise<void> => {
    if (loadedLocales.has(lng)) {
      return
    }

    const loader = loaders[lng as TLang]
    if (!loader) {
      return
    }

    const mod = await loader()
    const dict: LocaleDictionary =
      typeof mod === 'object' && mod !== null && 'default' in mod
        ? (mod.default as LocaleDictionary)
        : (mod as LocaleDictionary)
    i18n.addResourceBundle(lng, ns, dict, true, true)
    loadedLocales.add(lng)
  }

  const changeLanguage = async (lng: string): Promise<void> => {
    await ensureReady()
    await loadLocale(lng)
    await i18n.changeLanguage(lng)
    if (typeof localStorage !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, lng)
    }
  }

  const ensureReady = (): Promise<void> => {
    if (!initPromise) {
      const storedLocale =
        typeof localStorage !== 'undefined' && storageKey
          ? (localStorage.getItem(storageKey) as TLang | null)
          : null
      const initialLng = storedLocale || defaultLocale

      initPromise = i18n
        .init({
          lng: initialLng,
          fallbackLng: fallbackLocale,
          interpolation: {
            escapeValue: false,
          },
          resources: {},
        })
        .then(() =>
          Promise.all([
            loadLocale(initialLng),
            initialLng !== fallbackLocale ? loadLocale(fallbackLocale) : Promise.resolve(),
          ]).then(() => undefined),
        )
    }

    return initPromise
  }

  return {
    loadLocale,
    changeLanguage,
    ensureReady,
    getI18n: () => i18n,
  }
}
