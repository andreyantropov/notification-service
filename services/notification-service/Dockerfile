# --- STAGE 1: сборка ---
FROM node:23.11.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/notification-service/package*.json ./services/notification-service/

RUN npm ci

COPY . .

RUN npm run build --workspace=notification-service


# --- STAGE 2: production ---
FROM node:23.11.0-alpine

WORKDIR /app

COPY services/notification-service/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/services/notification-service/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]