import { spawn } from 'child_process'
import { loadConfig, toLibreTranslateCode } from '../config'
import { DynamicTranslateConfig } from '../types'

/**
 * Inicia o container Docker do LibreTranslate utilizando a lista de idiomas e configurações do .env
 */
export function startDockerLibreTranslate(
  options?: Partial<DynamicTranslateConfig>,
  cwd: string = process.cwd(),
): Promise<void> {
  const config = loadConfig(cwd, options)
  const port = config.libretranslatePort || 5000
  // Normaliza os códigos para o padrão aceito pelo LibreTranslate no Docker (sem sufixos regionais) e remove duplicatas
  const ltLangs = Array.from(new Set(config.langs.map((l) => toLibreTranslateCode(l)))).join(',')

  console.info('🚀 [dynamic-translate] Iniciando LibreTranslate no Docker...')
  console.info('✨ [dynamic-translate] Powered by LibreTranslate (https://pt.libretranslate.com/)')
  console.info(`🌐 [dynamic-translate] Porta: ${port}`)
  console.info(`🗣️  [dynamic-translate] Idiomas carregados (LT_LOAD_ONLY): ${ltLangs}\n`)

  const args = [
    'run',
    '-ti',
    '--rm',
    '-p',
    `${port}:5000`,
    '-e',
    `LT_LOAD_ONLY=${ltLangs}`,
    '-e',
    'LT_UPDATE_MODELS=true',
    '-e',
    'PYTHONWARNINGS=ignore',
    'libretranslate/libretranslate',
  ]

  return new Promise((resolve, reject) => {
    const proc = spawn('docker', args, {
      stdio: 'inherit',
      cwd,
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`[dynamic-translate] Docker finalizado com código ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`[dynamic-translate] Falha ao iniciar docker: ${err.message}`))
    })
  })
}
