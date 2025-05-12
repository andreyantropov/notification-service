#!/bin/bash
set -e

echo "🏗️ Сборка Docker-образа..."
docker build -t isplanar-notification ..