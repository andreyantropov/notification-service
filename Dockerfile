# --- Stage 1: Builder ---
ARG NODE_VERSION=24.14.0
FROM node:${NODE_VERSION}-alpine AS builder

ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV npm_config_proxy=${HTTP_PROXY}
ENV npm_config_https_proxy=${HTTPS_PROXY}

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --cache /root/.npm --prefer-offline

RUN npm audit --production || true

COPY . .

RUN npm run build && npm prune --omit=dev

# --- Stage 2: Runner ---
FROM node:${NODE_VERSION}-alpine

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app
USER node

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--import", "./dist/instrumentation.js", "./dist/index.js"]
