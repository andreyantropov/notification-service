#!/bin/bash

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SERVICE_NAME=${SERVICE_NAME:-notification-service}

echo "🔍 Статус контейнера '$SERVICE_NAME':"
docker ps -a --filter "name=^/${SERVICE_NAME}$"