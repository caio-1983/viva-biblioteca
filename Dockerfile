FROM node:22-alpine

WORKDIR /app

# Ferramentas de compilação necessárias para módulos nativos (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
