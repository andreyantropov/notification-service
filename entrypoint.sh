#!/bin/sh

echo "Выполняется скрипт миграции..."
npm run migrate:prod

echo "Приложение запускается..."
npm run start