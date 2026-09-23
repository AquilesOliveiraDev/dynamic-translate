# dynamic-translate 🌐

[![npm version](https://img.shields.io/npm/v/dynamic-translate.svg)](https://www.npmjs.com/package/dynamic-translate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-green.svg)](https://pt.libretranslate.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[English](README.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | **中文**

**dynamic-translate** 是一个通用、无框架绑定且完全由 **TypeScript** 强类型支持的国际化 (i18n) 自动化工具库：

1. 🔍 **自动源代码文本提取**：使用带有捕获组的自定义正则表达式快速扫描代码库中的多语言文本键。
2. 🤖 **自动化翻译流水线**：由 [LibreTranslate](https://pt.libretranslate.com/)（内置 Docker 自动化支持）或 **Google Cloud Translation 官方 API**（支持 API Key 或免费兜底）驱动，支持多语言例外字典 (`exceptions.<lang>.json`) 与已翻译内容智能缓存。
3. ⚡ **通用前端客户端集成**：轻量级、无框架绑定的客户端 Store，并内置针对 `i18next` 与 `react-i18next` 的即开即用适配器（全面支持 React、Next.js、Vue、Angular、Svelte、Node.js 与原生 JavaScript）。

---

## 📦 安装与配置

### 作为 NPM 包安装

```bash
npm install dynamic-translate
# 或
yarn add dynamic-translate
# 或
pnpm add dynamic-translate
```

### 在 Monorepo 或本地子目录中使用

在项目根目录的 `package.json` 中添加：

```json
{
  "dependencies": {
    "dynamic-translate": "file:./dynamic-translate"
  }
}
```

---

## ⚙️ 环境变量配置 (`.env`)

在项目根目录下创建 `.env` 文件：

```env
# 用于从源代码中捕获翻译键的正则表达式规则
# 支持 /pattern/flags 或纯字符串形式。将自动提取第一个捕获组 () 内的内容。
RULE=/\bt\('([^']+)'\)/g

# 目标翻译语言列表（以逗号分隔）
LANGS=pt,pt-BR,en,es,it,zh,fr

# 用于初始提取的基础语言（源 JSON 模板文件）
BASE_LANG=pt-br

# 需要递归扫描的文件夹路径（以逗号分隔）
SCAN_FOLDERS=src

# 需要忽略/排除扫描的文件夹路径（以逗号分隔）
IGNORE_FOLDERS=src/i18n-old

# 需要扫描的文件后缀名
FILE_EXTENSIONS=.ts,.tsx,.js,.jsx,.vue,.svelte,.html

# 输出 JSON 文件的目录路径
OUTPUT_DIR=src/i18n

# LibreTranslate 配置
LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_PORT=5000
LIBRETRANSLATE_API_KEY=

# Google Cloud Translation 官方 API Key（使用 google 翻译提供商时可选）
GOOGLE_TRANSLATE_API_KEY=

# 默认翻译服务商：libretranslate | google
TRANSLATE_PROVIDER=libretranslate

# 极速 Turbo 模式性能设置（批次大小与并发请求数）
TRANSLATE_BATCH_SIZE=25
TRANSLATE_CONCURRENCY=6
```

---

## 🐳 Docker：内置 LibreTranslate 支持

工具库将自动从 `.env` 中读取 `LANGS` 变量，仅加载所配置的语言模型 (`LT_LOAD_ONLY`)。

### 方式 A：通过 CLI 命令行运行

```bash
npx dynamic-translate docker
```

### 方式 B：通过 Docker Compose

```bash
docker compose -f dynamic-translate/docker-compose.yml up -d
```

### 方式 C：通过 Shell 脚本运行

```bash
bash dynamic-translate/docker-run.sh
```

---

## 💻 CLI 命令行工具

你可以通过 `npx` 直接运行，或在 `package.json` 中配置脚本：

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

### 1. 文本提取 (`extract`)

扫描指定源码文件并生成按字母排序的基础翻译文件 (`src/i18n/pt-br.json`)：

```bash
npx dynamic-translate extract
```

### 2. 语言翻译 (`translate`)

读取基础文件并自动补全所有目标语言中尚未翻译的键：

```bash
npx dynamic-translate translate
```

#### CLI 常用选项

- `--override`：强制重新翻译已存在于 JSON 中的键。
- `--provider=google` 或 `--provider=libretranslate`：切换翻译服务提供商。
- `--langs=en,zh`：仅处理指定的语言代码。

### 3. 一键完整同步 (`sync`)

先提取源码中的新增文本，然后立即自动翻译所有未翻译的键：

```bash
npx dynamic-translate sync
```

---

## 🛡️ 例外文件 (`exceptions.<lang>.json`)

若需为某些专业术语固定翻译以防止机器翻译覆盖，可在翻译目录下创建 `exceptions.<lang>.json`（例如 `src/i18n/exceptions.zh.json`）：

```json
{
  "Usuário": "系统用户",
  "Salvar": "保存变更"
}
```

翻译引擎将始终优先应用例外文件中的词汇！

---

## 🔌 前端集成 (客户端)

### 示例 1：React 与 `i18next` / `react-i18next`

```typescript
// src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { createI18nextLoader } from 'dynamic-translate'

i18n.use(initReactI18next)

export const { loadLocale, changeLanguage, ensureReady } = createI18nextLoader({
  i18n,
  defaultLocale: 'zh',
  fallbackLocale: 'en',
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

### 示例 2：通用独立模式 / Vue / Svelte / Node.js

```typescript
import { createDynamicI18n } from 'dynamic-translate'

const i18n = createDynamicI18n({
  defaultLocale: 'zh',
  fallbackLocale: 'en',
  loaders: {
    zh: () => import('./i18n/zh.json'),
    en: () => import('./i18n/en.json'),
    pt: () => import('./i18n/pt-br.json'),
  },
})

await i18n.setLocale('zh')
console.log(i18n.t('Salvar')) // "保存变更"
console.log(i18n.t('你好 {name}', { name: '小明' })) // "你好 小明"
```

---

## 🛠️ Node.js 编程接口 (API)

可在自定义脚本或 CI/CD 自动化流水线中直接调用：

```typescript
import { extractTexts, translateAll } from 'dynamic-translate'

async function runPipeline() {
  // 1. 提取
  await extractTexts({
    scanFolders: ['src'],
    rule: /\bt\('([^']+)'\)/g,
  })

  // 2. 翻译
  await translateAll({
    provider: 'libretranslate',
    override: false,
  })
}

runPipeline()
```

---

## 🙏 致谢与署名

本项目自豪地集成并推荐开源的 **[LibreTranslate](https://pt.libretranslate.com/)** ([libretranslate.com](https://libretranslate.com/))，这是一个 100% 自由开源、支持本地私有化部署的机器翻译引擎。

- 官方中文/多语言站点：[https://pt.libretranslate.com/](https://pt.libretranslate.com/)
- 全球站点：[https://libretranslate.com/](https://libretranslate.com/)
- GitHub 开源仓库：[https://github.com/LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)

---

## 🤝 贡献与开源协议

热烈欢迎社区贡献！请查阅 [CONTRIBUTING.md](CONTRIBUTING.md) 获取贡献指引。

本项目基于 [MIT](LICENSE) 开源协议发布。
