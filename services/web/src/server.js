'use strict';

const http = require('http');
const { createWebApp } = require('./web');

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(createWebApp());

server.listen(PORT, '0.0.0.0', () => console.log(`web listening on :${PORT}`));

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
