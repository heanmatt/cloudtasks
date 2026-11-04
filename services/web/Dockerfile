# syntax=docker/dockerfile:1

FROM node:22-alpine AS test
WORKDIR /app
COPY . .
RUN npm test

FROM node:22-alpine AS runtime
ARG APP_VERSION=2.1.0
ENV NODE_ENV=production APP_VERSION=${APP_VERSION} PORT=3000
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1
CMD ["node", "src/server.js"]
