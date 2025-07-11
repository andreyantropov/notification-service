#!/bin/bash
set -e

if [ ! -f ../.env ]; then
  echo "❌ Файл .env не найден. Используйте .env.dev как шаблон."
  exit 1
fi

export $(grep -v '^#' ../.env | xargs)

if [ -z "$PORT" ]; then
  echo "❌ Переменная PORT не установлена в .env"
  exit 1
fi

echo "🚀 Запуск контейнера..."
docker run -d \
  --name notification-service \
  --env-file ../.env \
  -p "$PORT:$PORT" \
  notification-service