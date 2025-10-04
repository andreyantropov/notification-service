#!/bin/bash
set -e

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SERVICE_NAME=${SERVICE_NAME:-notification-service}

echo "📄 Логи контейнера '$SERVICE_NAME':"
docker logs -f "$SERVICE_NAME"