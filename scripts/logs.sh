#!/bin/bash
set -e

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SERVICE_NAME=${SERVICE_NAME:-notification-service}
SERVICE_VERSION=${SERVICE_VERSION:-latest}
CONTAINER_NAME="${SERVICE_NAME}-${SERVICE_VERSION}"

echo "📄 Логи контейнера '$CONTAINER_NAME':"
docker logs -f "$CONTAINER_NAME"