# dynamic-translate 🌐

[![npm version](https://img.shields.io/npm/v/dynamic-translate.svg)](https://www.npmjs.com/package/dynamic-translate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-green.svg)](https://pt.libretranslate.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[English](README.md) | **Português** | [Español](README.es.md) | [中文](README.zh.md)

Pacote universal, tipado em **TypeScript** e totalmente desacoplado para:

1. **Extração automatizada de textos** a partir de regex customizada diretamente do código-fonte.
2. **Tradução automatizada de JSONs** via [LibreTranslate](https://pt.libretranslate.com/) (Docker integrado) ou **Google Cloud Translation API** (oficial com API Key ou fallback gratuito) com suporte a arquivos de exceções e cache de traduções existentes.
3. **Integração fácil com qualquer framework** (React, Vue, Angular, Svelte, Next.js, Node ou Vanilla JS).

---

## 🚀 Instalação & Acoplamento

### Como pacote NPM

```bash
npm install dynamic-translate
# ou
yarn add dynamic-translate
# ou
pnpm add dynamic-translate
```

### Como módulo local (Monorepo ou subpasta)

No seu `package.json` raiz:

```json
{
  "dependencies": {
    "dynamic-translate": "file:./dynamic-translate"
  }
}
```

---

## ⚙️ Configuração (.env)

Crie um arquivo `.env` na raiz do seu projeto:

```env
# Regra de Regex para capturar chaves de tradução no código
# Suporta /regex/flags ou regex pura. O primeiro grupo de captura () será o texto extraído.
RULE=/\bt\('([^']+)'\)/g

# Lista de idiomas desejados separados por vírgula
LANGS=pt,pt-BR,en,es,it,zh,fr

# Idioma base para extração inicial (arquivo base gerado)
BASE_LANG=pt-br

# Diretórios a serem escaneados (separados por vírgula)
SCAN_FOLDERS=src

# Pastas a serem ignoradas/excluídas da busca (separadas por vírgula)
IGNORE_FOLDERS=src/i18n-old

# Extensões de arquivos para buscar textos
FILE_EXTENSIONS=.ts,.tsx,.js,.jsx,.vue,.svelte,.html

# Pasta de saída dos arquivos .json
OUTPUT_DIR=src/i18n

# Configurações do LibreTranslate
LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_PORT=5000
LIBRETRANSLATE_API_KEY=

# Chave da API oficial do Google Cloud Translation (opcional para o provedor google)
GOOGLE_TRANSLATE_API_KEY=

# Provedor padrão: libretranslate | google
TRANSLATE_PROVIDER=libretranslate

# Modo Turbo de Performance (tamanho do lote e concorrência)
TRANSLATE_BATCH_SIZE=25
TRANSLATE_CONCURRENCY=6
```

---

## 🐳 Docker: LibreTranslate Integrado

A biblioteca lê automaticamente a variável `LANGS` do seu `.env` para carregar apenas os modelos de idioma configurados (`LT_LOAD_ONLY`).

### Opção A: Via CLI da lib

```bash
npx dynamic-translate docker
```

### Opção B: Via Docker Compose

```bash
docker compose -f dynamic-translate/docker-compose.yml up -d
```

### Opção C: Via Script Shell

```bash
bash dynamic-translate/docker-run.sh
```

---

## 💻 Comandos da CLI

Você pode executar diretamente via `npx` ou configurar scripts no seu `package.json`:

```json
{
  "scripts": {
    "translate:docker": "dynamic-translate docker",
    "translate:extract": "dynamic-translate extract",
    "translate:build": "dynamic-translate translate",
    "translate:sync": "dynamic-translate sync"
  }
}
```

### 1. Extração de textos (`extract`)

Varre as pastas configuradas e gera o arquivo base (`src/i18n/pt-br.json`):

```bash
npx dynamic-translate extract
```

### 2. Tradução dos idiomas (`translate`)

Lê o arquivo base e gera/atualiza as traduções para os idiomas do `.env`:

```bash
npx dynamic-translate translate
```

#### Opções da CLI

- `--override`: Força a retradução de chaves já existentes no JSON.
- `--provider=google` ou `--provider=libretranslate`: Alterna o provedor de tradução.
- `--langs=en,es`: Executa apenas para idiomas específicos.

### 3. Extração + Tradução em 1 comando (`sync`)

Executa a extração do código e em seguida a tradução automática das chaves pendentes:

```bash
npx dynamic-translate sync
```

---

## 🛡️ Arquivos de Exceções (`exceptions.<lang>.json`)

Caso queira fixar ou personalizar termos específicos sem que a tradução automática os sobrescreva, crie arquivos com o padrão `exceptions.<lang>.json` na pasta de traduções (ex: `src/i18n/exceptions.en.json`):

```json
{
  "Usuário": "Custom User Label",
  "Salvar": "Save Changes"
}
```

O tradutor priorizará sempre o arquivo de exceções!

---

## 🔌 Integração no Frontend (Client)

### Exemplo 1: React com `i18next` e `react-i18next`

```typescript
// src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { createI18nextLoader } from 'dynamic-translate'

i18n.use(initReactI18next)

export const { loadLocale, changeLanguage, ensureReady } = createI18nextLoader({
  i18n,
  defaultLocale: 'br',
  fallbackLocale: 'br',
  loaders: {
    br: () => import('./i18n/pt-br.json'),
    pt: () => import('./i18n/pt.json'),
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
    it: () => import('./i18n/it.json'),
    zh: () => import('./i18n/zh.json'),
    fr: () => import('./i18n/fr.json'),
  },
})

export default i18n
```

### Exemplo 2: Agnóstico / Vanilla JS / Vue / Svelte / Node

```typescript
import { createDynamicI18n } from 'dynamic-translate'

const i18n = createDynamicI18n({
  defaultLocale: 'pt',
  fallbackLocale: 'en',
  loaders: {
    pt: () => import('./i18n/pt-br.json'),
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
})

await i18n.setLocale('en')
console.log(i18n.t('Salvar')) // "Save"
console.log(i18n.t('Olá {name}', { name: 'João' })) // "Hello João"
```

---

## 🛠️ API Programática em Node.js

Você pode importar e rodar tudo via código em scripts customizados ou pipelines de CI/CD:

```typescript
import { extractTexts, translateAll, loadConfig } from 'dynamic-translate'

async function runPipeline() {
  // 1. Extração
  await extractTexts({
    scanFolders: ['src'],
    rule: /\bt\('([^']+)'\)/g,
  })

  // 2. Tradução
  await translateAll({
    provider: 'libretranslate',
    override: false,
  })
}

runPipeline()
```

---

## 🙏 Agradecimentos & Créditos

Este projeto utiliza e recomenda com orgulho o **[LibreTranslate](https://pt.libretranslate.com/)** ([libretranslate.com](https://libretranslate.com/)), um mecanismo de tradução automática 100% livre e de código aberto (*open-source*), auto-hospedável e baseado no Argos Translate.

- Site em Português: [https://pt.libretranslate.com/](https://pt.libretranslate.com/)
- Site Global: [https://libretranslate.com/](https://libretranslate.com/)
- Repositório no GitHub: [https://github.com/LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)

---

## 🤝 Contribuição e Licença

Contribuições são muito bem-vindas! Veja o guia em [CONTRIBUTING.md](CONTRIBUTING.md).

Distribuído sob a licença [MIT](LICENSE).
