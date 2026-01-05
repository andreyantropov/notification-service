#!/bin/sh
set -e

: "${RABBIT_HOST:?RABBIT_HOST is required}"
: "${RABBIT_PORT:?RABBIT_PORT is required}"
: "${RABBIT_USER:?RABBIT_USER is required}"
: "${RABBIT_PASS:?RABBIT_PASS is required}"

for queue in $(jq -c '.queues[]' /config/queues.json); do
  echo "Declaring queue: $(echo "$queue" | jq -r '.name')"
  echo "$queue" | rabbitmqadmin \
    --host="$RABBIT_HOST" \
    --port="$RABBIT_PORT" \
    --username="$RABBIT_USER" \
    --password="$RABBIT_PASS" \
    --vhost="/" \
    declare queue
done

echo "All queues declared successfully"