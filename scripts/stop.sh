#!/bin/bash

echo "🛑 Остановка и удаление контейнера..."

if [ "$(docker ps -a -f "name=isplanar-notification" --format "{{.Status}}")" ]; then
  docker stop isplanar-notification > /dev/null 2>&1 && echo "✅ Контейнер остановлен"
  docker rm isplanar-notification > /dev/null 2>&1 && echo "✅ Контейнер удалён"
else
  echo "ℹ️ Контейнер не найден."
fi