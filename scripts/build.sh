#!/bin/bash
set -e

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SERVICE_NAME=${SERVICE_NAME:-notification-service}
SERVICE_VERSION=${SERVICE_VERSION:-latest}
IMAGE_NAME="${SERVICE_NAME}:${SERVICE_VERSION}"

echo "🏗️ Сборка Docker-образа: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" ..