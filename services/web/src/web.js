'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function createWebApp({ publicDir = DEFAULT_PUBLIC_DIR } = {}) {
  const root = path.resolve(publicDir);

  return function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      return sendJson(res, 400, { error: 'Bad request' });
    }

    if (pathname === '/health') {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'web',
        host: os.hostname(),
        version: process.env.APP_VERSION || '2.1.0',
      });
    }
    if (pathname === '/whoami') {
      return sendJson(res, 200, {
        service: 'web',
        host: os.hostname(),
        version: process.env.APP_VERSION || '2.1.0',
      });
    }

    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) {
      return sendJson(res, 404, { error: 'Not found' });
    }

    return fs.readFile(file, (err, data) => {
      if (err) return sendJson(res, 404, { error: 'Not found' });
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': 'no-cache',
      });
      return res.end(req.method === 'HEAD' ? undefined : data);
    });
  };
}

module.exports = { createWebApp };
