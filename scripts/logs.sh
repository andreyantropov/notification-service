#!/bin/bash
set -e

echo "📄 Логи контейнера:"
docker logs -f notification-service