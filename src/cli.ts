#!/usr/bin/env node
import { extractTexts } from './core/extractor'
import { translateAll } from './core/translator'
import { startDockerLibreTranslate } from './core/docker'
import { TranslationProvider } from './types'

const args = process.argv.slice(2)
const command = args[0]

function printHelp() {
  console.log(`
🌐 dynamic-translate CLI

Uso:
  npx dynamic-translate <comando> [opções]

Comandos:
  extract                 Extrai chaves do código-fonte e atualiza o arquivo JSON base
  translate               Traduz as chaves pendentes para os idiomas configurados
  sync                    Executa 'extract' e 'translate' sequencialmente
  docker                  Inicia o container Docker do LibreTranslate com as línguas do .env
  help                    Exibe este menu de ajuda

Opções para translate/sync:
  --override              Força a re-tradução mesmo se a chave já existir no JSON
  --provider=<provider>   Provedor de tradução: 'libretranslate' (padrão) ou 'google'
  --langs=<l1,l2,...>     Lista de idiomas específicos a processar (sobrescreve o .env)

Exemplos:
  npx dynamic-translate extract
  npx dynamic-translate translate --provider=google
  npx dynamic-translate sync --override
  npx dynamic-translate docker
`)
}

async function run() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    process.exit(0)
  }

  // Parse flags
  const override = args.includes('--override') || args.includes('-o')
  const providerArg = args.find((a) => a.startsWith('--provider='))
  const provider = (providerArg ? providerArg.split('=')[1] : undefined) as
    | TranslationProvider
    | undefined

  const langsArg = args.find((a) => a.startsWith('--langs='))
  const languages = langsArg
    ? langsArg
        .split('=')[1]
        .split(',')
        .map((l) => l.trim())
    : undefined

  try {
    switch (command) {
      case 'extract':
        await extractTexts()
        break

      case 'translate':
        await translateAll({ override, provider, languages })
        break

      case 'sync':
        await extractTexts()
        console.log('\n----------------------------------------\n')
        await translateAll({ override, provider, languages })
        break

      case 'docker':
        await startDockerLibreTranslate()
        break

      default:
        console.error(`❌ Comando desconhecido: "${command}"\n`)
        printHelp()
        process.exit(1)
    }
  } catch (error: any) {
    console.error(`❌ [dynamic-translate] Erro:`, error?.message || error)
    process.exit(1)
  }
}

run()
