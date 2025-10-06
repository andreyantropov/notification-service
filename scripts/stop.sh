#!/bin/bash

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SERVICE_NAME=${SERVICE_NAME:-notification-service}
SERVICE_VERSION=${SERVICE_VERSION:-latest}
CONTAINER_NAME="${SERVICE_NAME}-${SERVICE_VERSION}"

echo "🛑 Остановка и удаление контейнера '$CONTAINER_NAME'..."

if [ "$(docker ps -a -f name="^/${CONTAINER_NAME}$" --format '{{.Names}}')" ]; then
  docker stop "$CONTAINER_NAME" > /dev/null 2>&1 && echo "✅ Контейнер остановлен"
  docker rm "$CONTAINER_NAME" > /dev/null 2>&1 && echo "✅ Контейнер удалён"
else
  echo "ℹ️ Контейнер '$CONTAINER_NAME' не найден."
fi