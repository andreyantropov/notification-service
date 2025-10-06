#!/bin/bash

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SERVICE_NAME=${SERVICE_NAME:-notification-service}
SERVICE_VERSION=${SERVICE_VERSION:-latest}
CONTAINER_NAME="${SERVICE_NAME}-${SERVICE_VERSION}"

echo "🔍 Статус контейнера '$CONTAINER_NAME':"
docker ps -a --filter "name=^/${CONTAINER_NAME}$"