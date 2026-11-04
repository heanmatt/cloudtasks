'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createWebApp } = require('../src/web');

async function withServer(fn) {
  const server = http.createServer(createWebApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /health returns ok', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).service, 'web');
  }));

test('GET /whoami reports host and version', () =>
  withServer(async (base) => {
    const body = await (await fetch(`${base}/whoami`)).json();
    assert.ok(body.host);
    assert.ok(body.version);
  }));

test('GET / serves the CloudTasks multi-tab page with port 8081 configured', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    const html = await res.text();
    assert.match(html, /CloudTasks/);
    assert.match(html, /8081/);
  }));

test('path traversal is blocked', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/..%2fpackage.json`);
    assert.equal(res.status, 404);
  }));

test('POST is rejected', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/`, { method: 'POST' });
    assert.equal(res.status, 405);
  }));
