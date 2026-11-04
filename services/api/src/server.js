'use strict';

const http = require('http');
const { createApp } = require('./app');
const { createMemoryStore, createRedisStore } = require('./store');

const PORT = Number(process.env.PORT || 4000);
const store = process.env.REDIS_URL
  ? createRedisStore(process.env.REDIS_URL)
  : createMemoryStore({ seed: true });

const server = http.createServer(createApp(store));
server.listen(PORT, '0.0.0.0', () => {
  console.log(`api listening on :${PORT} (store: ${process.env.REDIS_URL ? 'redis' : 'memory'})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
