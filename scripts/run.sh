#!/bin/bash
set -e

if [ ! -f ../.env ]; then
  echo "❌ Файл .env не найден. Используйте .env.example как шаблон."
  exit 1
fi

export $(grep -v '^#' ../.env | xargs)

SERVICE_NAME=${SERVICE_NAME:-notification-service}
SERVICE_VERSION=${SERVICE_VERSION:-latest}
IMAGE_NAME="${SERVICE_NAME}:${SERVICE_VERSION}"
PORT=${PORT:-3000}

echo "🚀 Запуск контейнера '$SERVICE_NAME' из образа '$IMAGE_NAME' на порту $PORT..."

docker run -d \
  --name "$SERVICE_NAME" \
  --env-file ../.env \
  -p "$PORT:$PORT" \
  "$IMAGE_NAME"