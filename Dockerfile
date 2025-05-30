FROM node:23.11.0-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . ./

RUN npm run build

CMD ["npm", "run", "start"]