# dynamic-translate 🌐

[![npm version](https://img.shields.io/npm/v/dynamic-translate.svg)](https://www.npmjs.com/package/dynamic-translate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-green.svg)](https://pt.libretranslate.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[English](README.md) | [Português](README.pt-BR.md) | **Español** | [中文](README.zh.md)

**dynamic-translate** es un conjunto de herramientas universal, desacoplado y completamente tipado en **TypeScript** para proyectos modernos en JavaScript y TypeScript:

1. 🔍 **Extracción automatizada de textos**: Escanea tu código fuente usando expresiones regulares personalizadas con grupos de captura.
2. 🤖 **Traducción automatizada de JSONs**: Impulsado por [LibreTranslate](https://pt.libretranslate.com/) (con soporte Docker integrado) o la **API oficial de Google Cloud Translation** (con API Key o fallback gratuito), con soporte para archivos de excepciones (`exceptions.<lang>.json`) y caché de traducciones existentes.
3. ⚡ **Integración universal en el frontend**: Almacén ligero e independiente del framework y adaptadores listos para `i18next` y `react-i18next` (compatible con React, Next.js, Vue, Angular, Svelte, Node.js y Vanilla JS).

---

## 📦 Instalación y Acoplamiento

### Como paquete NPM

```bash
npm install dynamic-translate
# o
yarn add dynamic-translate
# o
pnpm add dynamic-translate
```

### En Monorepos o carpeta local

En tu `package.json` raíz:

```json
{
  "dependencies": {
    "dynamic-translate": "file:./dynamic-translate"
  }
}
```

---

## ⚙️ Configuración (`.env`)

Crea un archivo `.env` en la raíz de tu proyecto:

```env
# Regla de Regex para capturar claves de traducción en el código
# Admite /patrón/flags o regex en texto plano. El primer grupo de captura () será extraído.
RULE=/\bt\('([^']+)'\)/g

# Lista de idiomas deseados separados por comas
LANGS=pt,pt-BR,en,es,it,zh,fr

# Idioma base para la extracción inicial (archivo base generado)
BASE_LANG=pt-br

# Carpetas a escanear recursivamente
SCAN_FOLDERS=src

# Carpetas a ignorar / excluir de la búsqueda (separadas por comas)
IGNORE_FOLDERS=src/i18n-old

# Extensiones de archivos para buscar textos
FILE_EXTENSIONS=.ts,.tsx,.js,.jsx,.vue,.svelte,.html

# Carpeta de salida de los archivos .json
OUTPUT_DIR=src/i18n

# Configuración de LibreTranslate
LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_PORT=5000
LIBRETRANSLATE_API_KEY=

# Clave de la API oficial de Google Cloud Translation (opcional para el proveedor google)
GOOGLE_TRANSLATE_API_KEY=

# Proveedor predeterminado: libretranslate | google
TRANSLATE_PROVIDER=libretranslate

# Modo Turbo de Rendimiento (tamaño del lote y concurrencia)
TRANSLATE_BATCH_SIZE=25
TRANSLATE_CONCURRENCY=6
```

---

## 🐳 Docker: LibreTranslate Integrado

La biblioteca lee automáticamente la variable `LANGS` de tu `.env` para cargar únicamente los modelos de idiomas configurados (`LT_LOAD_ONLY`).

### Opción A: A través del CLI de la librería

```bash
npx dynamic-translate docker
```

### Opción B: A través de Docker Compose

```bash
docker compose -f dynamic-translate/docker-compose.yml up -d
```

### Opción C: A través del Script Shell

```bash
bash dynamic-translate/docker-run.sh
```

---

## 💻 Comandos del CLI

Puedes ejecutar directamente mediante `npx` o configurar scripts en tu `package.json`:

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

### 1. Extracción de textos (`extract`)

Escanea los archivos configurados y genera el archivo base (`src/i18n/pt-br.json`):

```bash
npx dynamic-translate extract
```

### 2. Traducción de idiomas (`translate`)

Lee el archivo base y genera/actualiza las traducciones para los idiomas del `.env`:

```bash
npx dynamic-translate translate
```

#### Opciones del CLI

- `--override`: Fuerza la retraducción de claves ya existentes en el JSON.
- `--provider=google` o `--provider=libretranslate`: Cambia el proveedor de traducción.
- `--langs=en,es`: Ejecuta únicamente para idiomas específicos.

### 3. Sincronización completa (`sync`)

Extrae las claves del código y traduce automáticamente las claves pendientes en un solo paso:

```bash
npx dynamic-translate sync
```

---

## 🛡️ Archivos de Excepciones (`exceptions.<lang>.json`)

Para fijar o personalizar términos específicos sin que la traducción automática los sobrescriba, crea archivos con el formato `exceptions.<lang>.json` en tu carpeta de traducciones (ej.: `src/i18n/exceptions.es.json`):

```json
{
  "Usuário": "Usuario del Sistema",
  "Salvar": "Guardar Cambios"
}
```

¡El motor de traducción siempre dará máxima prioridad al archivo de excepciones!

---

## 🔌 Integración en el Frontend (Cliente)

### Ejemplo 1: React con `i18next` y `react-i18next`

```typescript
// src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { createI18nextLoader } from 'dynamic-translate'

i18n.use(initReactI18next)

export const { loadLocale, changeLanguage, ensureReady } = createI18nextLoader({
  i18n,
  defaultLocale: 'es',
  fallbackLocale: 'es',
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

### Ejemplo 2: Agnóstico / Vanilla JS / Vue / Svelte / Node.js

```typescript
import { createDynamicI18n } from 'dynamic-translate'

const i18n = createDynamicI18n({
  defaultLocale: 'es',
  fallbackLocale: 'en',
  loaders: {
    es: () => import('./i18n/es.json'),
    en: () => import('./i18n/en.json'),
    pt: () => import('./i18n/pt-br.json'),
  },
})

await i18n.setLocale('es')
console.log(i18n.t('Salvar')) // "Guardar"
console.log(i18n.t('Hola {name}', { name: 'Carlos' })) // "Hola Carlos"
```

---

## 🛠️ API Programática en Node.js

Puedes importar y ejecutar funciones directamente en scripts personalizados o pipelines de CI/CD:

```typescript
import { extractTexts, translateAll } from 'dynamic-translate'

async function runPipeline() {
  // 1. Extracción
  await extractTexts({
    scanFolders: ['src'],
    rule: /\bt\('([^']+)'\)/g,
  })

  // 2. Traducción
  await translateAll({
    provider: 'libretranslate',
    override: false,
  })
}

runPipeline()
```

---

## 🙏 Agradecimientos y Créditos

Este proyecto utiliza e integra con orgullo **[LibreTranslate](https://pt.libretranslate.com/)** ([libretranslate.com](https://libretranslate.com/)), un motor de traducción automática 100% libre, de código abierto y auto-hospedable.

- Sitio web: [https://pt.libretranslate.com/](https://pt.libretranslate.com/)
- Sitio global: [https://libretranslate.com/](https://libretranslate.com/)
- Repositorio en GitHub: [https://github.com/LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)

---

## 🤝 Contribución y Licencia

¡Las contribuciones son muy bienvenidas! Consulta nuestra guía en [CONTRIBUTING.md](CONTRIBUTING.md).

Distribuido bajo la licencia [MIT](LICENSE).
