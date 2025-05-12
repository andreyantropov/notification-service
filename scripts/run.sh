#!/bin/bash
set -e

if [ ! -f ../.env ]; then
  echo "❌ Файл .env не найден. Используйте .env.dev как шаблон."
  exit 1
fi

echo "🚀 Запуск контейнера..."
docker run -d \
  --name isplanar-notification \
  --env-file ../.env \
  isplanar-notification