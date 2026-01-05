# --- STAGE 1: сборка ---
FROM node:23.11.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/retry-service/package*.json ./services/retry-service/

RUN npm ci

COPY . .

RUN npm run build --workspace=retry-service


# --- STAGE 2: production ---
FROM node:23.11.0-alpine

WORKDIR /app

COPY services/retry-service/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/services/retry-service/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]