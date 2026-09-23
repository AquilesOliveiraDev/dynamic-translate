import fs from 'fs'
import path from 'path'
import { extractTexts, scanDirectoryFiles } from '../src/core/extractor'

describe('Extractor Module', () => {
  const testDir = path.resolve(__dirname, 'mock-app')
  const testSrc = path.join(testDir, 'src')
  const testIgnored = path.join(testSrc, 'ignored-subfolder')
  const testI18n = path.join(testDir, 'i18n')

  beforeAll(() => {
    fs.mkdirSync(testSrc, { recursive: true })
    fs.mkdirSync(testIgnored, { recursive: true })
    fs.mkdirSync(testI18n, { recursive: true })

    fs.writeFileSync(
      path.join(testSrc, 'ComponentA.tsx'),
      `
      import React from 'react'
      export const ComponentA = () => {
        return (
          <div>
            <h1>{t('Título Principal')}</h1>
            <button>{t('Salvar Registro')}</button>
          </div>
        )
      }
      `,
      'utf-8',
    )

    fs.writeFileSync(
      path.join(testSrc, 'ComponentB.ts'),
      `
      const msg = t('Operação concluída com sucesso')
      const duplicate = t('Salvar Registro')
      `,
      'utf-8',
    )

    fs.writeFileSync(
      path.join(testIgnored, 'IgnoredComponent.tsx'),
      `
      const secret = t('Este texto deve ser ignorado')
      `,
      'utf-8',
    )
  })

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true })
  })

  test('scanDirectoryFiles finds ts and tsx files while skipping ignoreFolders', () => {
    const files = scanDirectoryFiles(
      testSrc,
      ['.ts', '.tsx'],
      ['tests/mock-app/src/ignored-subfolder'],
      path.resolve(__dirname, '..'),
    )
    expect(files.length).toBe(2)
  })

  test('extractTexts correctly captures regex groups and respects ignoreFolders', async () => {
    const result = await extractTexts(
      {
        rule: "/\\bt\\('([^']+)'\\)/g",
        scanFolders: ['tests/mock-app/src'],
        ignoreFolders: ['tests/mock-app/src/ignored-subfolder'],
        outputDir: 'tests/mock-app/i18n',
        baseLang: 'pt-br',
      },
      path.resolve(__dirname, '..'),
    )

    expect(result.totalExtracted).toBe(3)
    expect(result.keys).toEqual([
      'Operação concluída com sucesso',
      'Salvar Registro',
      'Título Principal',
    ])
    expect(result.keys).not.toContain('Este texto deve ser ignorado')

    const generatedFile = path.join(testI18n, 'pt-br.json')
    expect(fs.existsSync(generatedFile)).toBe(true)

    const parsed = JSON.parse(fs.readFileSync(generatedFile, 'utf-8'))
    expect(parsed).toEqual({
      'Operação concluída com sucesso': 'Operação concluída com sucesso',
      'Salvar Registro': 'Salvar Registro',
      'Título Principal': 'Título Principal',
    })
  })
})
