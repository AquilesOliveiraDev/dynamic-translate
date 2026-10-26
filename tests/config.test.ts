import { parseRegexRule, normalizeLangCode, toLibreTranslateCode, loadConfig } from '../src/config'

describe('Config Module', () => {
  test('parseRegexRule properly converts string regex with flags', () => {
    const parsed = parseRegexRule("/\\bt\\('([^']+)'\\)/g")
    expect(parsed).toBeInstanceOf(RegExp)
    expect(parsed.source).toBe("\\bt\\('([^']+)'\\)")
    expect(parsed.flags).toBe('g')
  })

  test('parseRegexRule preserves RegExp instances', () => {
    const original = /test/i
    const parsed = parseRegexRule(original)
    expect(parsed).toBe(original)
  })

  test('normalizeLangCode normalizes pt-br to pt-BR', () => {
    expect(normalizeLangCode('pt-br')).toBe('pt-BR')
    expect(normalizeLangCode('br')).toBe('pt-BR')
    expect(normalizeLangCode('en')).toBe('en')
    expect(normalizeLangCode('zh-CN')).toBe('zh')
  })

  test('toLibreTranslateCode normalizes codes to 2-letter ISO standards', () => {
    expect(toLibreTranslateCode('pt-BR')).toBe('pt')
    expect(toLibreTranslateCode('pt')).toBe('pt')
    expect(toLibreTranslateCode('zh-CN')).toBe('zh')
    expect(toLibreTranslateCode('zh')).toBe('zh')
    expect(toLibreTranslateCode('en-US')).toBe('en')
    expect(toLibreTranslateCode('es')).toBe('es')
  })

  test('loadConfig loads custom options and fallback defaults', () => {
    const config = loadConfig(process.cwd(), {
      baseLang: 'pt-br',
      langs: ['en', 'es'],
    })

    expect(config.baseLang).toBe('pt-br')
    expect(config.langs).toEqual(['en', 'es'])
    expect(config.rule).toBeInstanceOf(RegExp)
  })
})
