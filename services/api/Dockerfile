# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi

FROM deps AS test
COPY . .
RUN npm test

FROM node:22-alpine AS runtime
ARG APP_VERSION=2.1.0
ENV NODE_ENV=production APP_VERSION=${APP_VERSION} PORT=4000
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health >/dev/null || exit 1
CMD ["node", "src/server.js"]
