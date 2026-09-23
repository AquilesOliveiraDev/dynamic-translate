import { createDynamicI18n } from '../src/client'

describe('Client Module', () => {
  test('createDynamicI18n loads locale and translates with parameters', async () => {
    const i18n = createDynamicI18n({
      defaultLocale: 'pt',
      fallbackLocale: 'en',
      loaders: {
        pt: async () => ({ default: { 'Salvar': 'Salvar', 'Bem-vindo {name}': 'Bem-vindo {name}' } }),
        en: async () => ({ default: { 'Salvar': 'Save', 'Bem-vindo {name}': 'Welcome {name}' } }),
      },
    })

    await i18n.setLocale('pt')
    expect(i18n.t('Salvar')).toBe('Salvar')
    expect(i18n.t('Bem-vindo {name}', { name: 'Maria' })).toBe('Bem-vindo Maria')

    await i18n.setLocale('en')
    expect(i18n.t('Salvar')).toBe('Save')
    expect(i18n.t('Bem-vindo {name}', { name: 'Maria' })).toBe('Welcome Maria')
  })
})
