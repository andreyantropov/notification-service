#!/bin/bash

echo "🛑 Остановка и удаление контейнера..."

if [ "$(docker ps -a -f "name=notification-service" --format "{{.Status}}")" ]; then
  docker stop notification-service > /dev/null 2>&1 && echo "✅ Контейнер остановлен"
  docker rm notification-service > /dev/null 2>&1 && echo "✅ Контейнер удалён"
else
  echo "ℹ️ Контейнер не найден."
fi