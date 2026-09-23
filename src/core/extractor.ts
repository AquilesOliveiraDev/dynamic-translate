import fs from 'fs'
import path from 'path'
import { DynamicTranslateConfig, ExtractionResult } from '../types'
import { loadConfig } from '../config'

/**
 * Remove comentários de bloco e linha única para não extrair código comentado
 */
export function stripCodeComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

/**
 * Lê arquivos recursivamente em um diretório filtrando por extensões e ignorando pastas excluídas
 */
export function scanDirectoryFiles(
  directory: string,
  fileExtensions: string[],
  ignoreFolders: string[] = [],
  cwd: string = process.cwd(),
): string[] {
  let filesFound: string[] = []

  const absDirectory = path.resolve(cwd, directory)
  if (!fs.existsSync(absDirectory)) {
    return filesFound
  }

  const items = fs.readdirSync(absDirectory)

  // Normaliza caminhos absolutos das pastas ignoradas
  const normalizedIgnores = ignoreFolders.map((f) =>
    path.resolve(cwd, f).replace(/\\/g, '/').toLowerCase(),
  )

  for (const item of items) {
    const fullPath = path.join(absDirectory, item)
    const normalizedAbsPath = fullPath.replace(/\\/g, '/').toLowerCase()
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Pastas padrão ignoradas
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
        continue
      }

      // Verifica se o diretório atual corresponde ou está contido em alguma pasta ignorada
      const isIgnored = normalizedIgnores.some(
        (ignored) =>
          normalizedAbsPath === ignored ||
          normalizedAbsPath.startsWith(`${ignored}/`) ||
          item.toLowerCase() === ignored,
      )

      if (isIgnored) {
        continue
      }

      filesFound = filesFound.concat(
        scanDirectoryFiles(fullPath, fileExtensions, ignoreFolders, cwd),
      )
    } else {
      const ext = path.extname(item)
      if (fileExtensions.includes(ext)) {
        filesFound.push(fullPath)
      }
    }
  }

  return filesFound
}

/**
 * Extrai strings a partir do código-fonte e grava o arquivo base de traduções
 */
export async function extractTexts(
  options?: Partial<DynamicTranslateConfig>,
  cwd: string = process.cwd(),
): Promise<ExtractionResult> {
  const config = loadConfig(cwd, options)
  const regex = typeof config.rule === 'string' ? new RegExp(config.rule, 'g') : config.rule

  const scanFolders = config.scanFolders || ['src']
  const ignoreFolders = config.ignoreFolders || []
  const fileExtensions = config.fileExtensions || ['.ts', '.tsx', '.js', '.jsx']
  const baseLang = (config.baseLang || 'pt-br').toLowerCase()
  const outputDir = path.resolve(cwd, config.outputDir || 'src/i18n')

  const texts = new Set<string>()
  let scannedFilesCount = 0

  for (const folder of scanFolders) {
    const folderPath = path.resolve(cwd, folder)
    const files = scanDirectoryFiles(folderPath, fileExtensions, ignoreFolders, cwd)
    scannedFilesCount += files.length

    for (const file of files) {
      const rawContent = fs.readFileSync(file, 'utf-8')
      // Remove comentários para não extrair chaves de código desativado
      const content = stripCodeComments(rawContent)

      const matcher = new RegExp(
        regex.source,
        regex.flags.includes('g') ? regex.flags : `${regex.flags}g`,
      )
      const matches = [...content.matchAll(matcher)]
      for (const match of matches) {
        const extracted = match[1] !== undefined ? match[1] : match[0]
        if (extracted && extracted.trim()) {
          texts.add(extracted.trim())
        }
      }
    }
  }

  const sortedTexts = [...texts].sort((a, b) => a.localeCompare(b))
  const outputObject: Record<string, string> = {}

  for (const text of sortedTexts) {
    outputObject[text] = text
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outPath = path.join(outputDir, `${baseLang}.json`)
  fs.writeFileSync(outPath, JSON.stringify(outputObject, null, 2), 'utf-8')

  console.info(
    `✅ [dynamic-translate] ${sortedTexts.length} chaves extraídas de ${scannedFilesCount} arquivos.`,
  )
  if (ignoreFolders.length > 0) {
    console.info(`🚫 [dynamic-translate] Pastas ignoradas: ${ignoreFolders.join(', ')}`)
  }
  console.info(`📁 [dynamic-translate] Arquivo base salvo em: ${outPath}`)

  return {
    totalExtracted: sortedTexts.length,
    keys: sortedTexts,
    outputFile: outPath,
    scannedFilesCount,
  }
}
