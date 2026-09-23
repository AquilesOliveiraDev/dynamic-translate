# dynamic-translate 🌐

[![npm version](https://img.shields.io/npm/v/dynamic-translate.svg)](https://www.npmjs.com/package/dynamic-translate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-green.svg)](https://pt.libretranslate.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**English** | [Português](README.pt-BR.md) | [Español](README.es.md) | [中文](README.zh.md)

**dynamic-translate** is a universal, zero-lockin, and fully typed **TypeScript** toolkit designed for modern JavaScript and TypeScript projects:

1. 🔍 **Automated Source Text Extraction**: Scans your codebase using configurable regular expressions with capture groups.
2. 🤖 **Automated Translation Pipeline**: Powered by [LibreTranslate](https://pt.libretranslate.com/) (with built-in Docker support) or official **Google Cloud Translation API** (with API key or free scraper fallback), with built-in cache and exception dictionary support (`exceptions.<lang>.json`).
3. ⚡ **Universal Client Integration**: Lightweight framework-agnostic store and pre-built adapters for `i18next` and `react-i18next` (compatible with React, Next.js, Vue, Angular, Svelte, Node.js, and Vanilla JS).

---

## 📦 Installation & Setup

### As an NPM Package

```bash
npm install dynamic-translate
# or
yarn add dynamic-translate
# or
pnpm add dynamic-translate
```

### In Monorepos / Local Folder

In your root `package.json`:

```json
{
  "dependencies": {
    "dynamic-translate": "file:./dynamic-translate"
  }
}
```

---

## ⚙️ Configuration (`.env`)

Create a `.env` file in the root of your project:

```env
# Regular expression rule to capture translation keys from source code
# Supports /pattern/flags or plain regex strings. The first capture group () will be extracted.
RULE=/\bt\('([^']+)'\)/g

# Comma-separated list of target languages
LANGS=pt,pt-BR,en,es,it,zh,fr

# Base language for extraction (source of truth JSON)
BASE_LANG=pt-br

# Folders to scan recursively
SCAN_FOLDERS=src

# Folders to ignore / exclude from extraction (comma-separated)
IGNORE_FOLDERS=src/i18n-old

# File extensions to scan
FILE_EXTENSIONS=.ts,.tsx,.js,.jsx,.vue,.svelte,.html

# Output directory for translation JSON files
OUTPUT_DIR=src/i18n

# LibreTranslate Configuration
LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_PORT=5000
LIBRETRANSLATE_API_KEY=

# Google Cloud Translation API Key (optional for official Google provider)
GOOGLE_TRANSLATE_API_KEY=

# Default Provider: libretranslate | google
TRANSLATE_PROVIDER=libretranslate

# Performance & Turbo Mode (batch size & concurrent workers)
TRANSLATE_BATCH_SIZE=25
TRANSLATE_CONCURRENCY=6
```

---

## 🐳 Docker: Automated LibreTranslate

The library automatically reads `LANGS` from your `.env` to load only the required language models (`LT_LOAD_ONLY`).

### Option A: Via CLI

```bash
npx dynamic-translate docker
```

### Option B: Via Docker Compose

```bash
docker compose -f dynamic-translate/docker-compose.yml up -d
```

### Option C: Via Shell Script

```bash
bash dynamic-translate/docker-run.sh
```

---

## 💻 CLI Commands

Run via `npx` or add scripts to your `package.json`:

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

### 1. Text Extraction (`extract`)

Scans source files and generates the sorted base translation file (`src/i18n/pt-br.json`):

```bash
npx dynamic-translate extract
```

### 2. Language Translation (`translate`)

Translates missing keys to all configured languages:

```bash
npx dynamic-translate translate
```

#### CLI Options

- `--override`: Forces re-translation of existing keys.
- `--provider=google` or `--provider=libretranslate`: Selects translation provider.
- `--langs=en,es`: Targets specific languages only.

### 3. Full Sync (`sync`)

Extracts keys from source code and translates all pending keys in one step:

```bash
npx dynamic-translate sync
```

---

## 🛡️ Exception Files (`exceptions.<lang>.json`)

To lock in custom or business-specific terms and prevent machine translation from overriding them, create exception files in your i18n directory (e.g., `src/i18n/exceptions.en.json`):

```json
{
  "Usuário": "Custom User Label",
  "Salvar": "Save Changes"
}
```

The translator will always give highest priority to exceptions!

---

## 🔌 Frontend Integration (Client)

### Example 1: React with `i18next` & `react-i18next`

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

### Example 2: Framework-Agnostic / Vanilla JS / Vue / Svelte / Node.js

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
console.log(i18n.t('Olá {name}', { name: 'Alice' })) // "Hello Alice"
```

---

## 🛠️ Programmatic Node.js API

You can import and run functions directly in custom scripts or CI/CD pipelines:

```typescript
import { extractTexts, translateAll } from 'dynamic-translate'

async function runPipeline() {
  // 1. Extract
  await extractTexts({
    scanFolders: ['src'],
    rule: /\bt\('([^']+)'\)/g,
  })

  // 2. Translate
  await translateAll({
    provider: 'libretranslate',
    override: false,
  })
}

runPipeline()
```

---

## 🙏 Acknowledgements & Credits

This project proudly uses and integrates **[LibreTranslate](https://pt.libretranslate.com/)** ([libretranslate.com](https://libretranslate.com/)), a 100% self-hosted, open-source and free machine translation engine.

- Website: [https://pt.libretranslate.com/](https://pt.libretranslate.com/)
- Global Website: [https://libretranslate.com/](https://libretranslate.com/)
- GitHub Repository: [https://github.com/LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)

---

## 🤝 Contributing

Contributions are warmly welcomed! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
