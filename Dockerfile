FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

RUN npm install

COPY . .

RUN npm run build
RUN npx esbuild server.ts --bundle --platform=node --outfile=server.js --external:vite

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/server.js ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
