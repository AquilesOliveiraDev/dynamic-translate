#!/usr/bin/env bash

# Carrega variáveis do .env se existir
ENV_FILE="${1:-.env}"

if [ -f "$ENV_FILE" ]; then
  echo "📄 Carregando configurações de $ENV_FILE"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

PORT="${LIBRETRANSLATE_PORT:-5000}"
LANGS="${LANGS:-pt,pt-BR,en,es,it,zh,fr}"

echo "🚀 Iniciando LibreTranslate no Docker..."
echo "🌐 Porta: $PORT"
echo "🗣️  Idiomas: $LANGS"

docker run -ti --rm \
  -p "${PORT}:5000" \
  -e "LT_LOAD_ONLY=${LANGS}" \
  -e "LT_UPDATE_MODELS=true" \
  libretranslate/libretranslate
