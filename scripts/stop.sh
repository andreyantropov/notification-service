#!/bin/bash

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SERVICE_NAME=${SERVICE_NAME:-notification-service}

echo "🛑 Остановка и удаление контейнера '$SERVICE_NAME'..."

if [ "$(docker ps -a -f name="^/${SERVICE_NAME}$" --format '{{.Names}}')" ]; then
  docker stop "$SERVICE_NAME" > /dev/null 2>&1 && echo "✅ Контейнер остановлен"
  docker rm "$SERVICE_NAME" > /dev/null 2>&1 && echo "✅ Контейнер удалён"
else
  echo "ℹ️ Контейнер '$SERVICE_NAME' не найден."
fi