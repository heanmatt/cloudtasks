'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createApp } = require('../src/app');
const { createMemoryStore } = require('../src/store');

async function withServer(fn) {
  const server = http.createServer(createApp(createMemoryStore({ seed: false })));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const json = (body) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

test('GET /api/health returns ok and port 8081 mapping', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'api');
    assert.equal(body.ports.nginx, 8081);
    assert.equal(body.ports.jenkins, 8080);
  }));

test('GET /api/whoami reports host and version', () =>
  withServer(async (base) => {
    const body = await (await fetch(`${base}/api/whoami`)).json();
    assert.ok(body.host);
    assert.ok(body.version);
  }));

test('POST then GET /api/tasks stores a task with category and priority', () =>
  withServer(async (base) => {
    const created = await fetch(`${base}/api/tasks`, {
      method: 'POST',
      ...json({ title: '  Write report  ', category: 'Documentation', priority: 'High', assignee: 'Hean Matt' }),
    });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.equal(task.title, 'Write report');
    assert.equal(task.category, 'Documentation');
    assert.equal(task.priority, 'High');
    assert.equal(task.done, false);

    const list = await (await fetch(`${base}/api/tasks`)).json();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, task.id);

    const stats = await (await fetch(`${base}/api/stats`)).json();
    assert.equal(stats.total, 1);
    assert.equal(stats.byPriority.High, 1);
  }));

test('POST /api/tasks rejects an empty title', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/api/tasks`, { method: 'POST', ...json({ title: '   ' }) });
    assert.equal(res.status, 400);
  }));

test('POST /api/tasks rejects invalid JSON', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    assert.equal(res.status, 400);
  }));

test('PATCH updates status/done and DELETE removes the task', () =>
  withServer(async (base) => {
    const task = await (await fetch(`${base}/api/tasks`, { method: 'POST', ...json({ title: 'Deploy to EC2' }) })).json();

    const inProg = await fetch(`${base}/api/tasks/${task.id}`, { method: 'PATCH', ...json({ status: 'in-progress' }) });
    assert.equal(inProg.status, 200);
    assert.equal((await inProg.json()).status, 'in-progress');

    const patched = await fetch(`${base}/api/tasks/${task.id}`, { method: 'PATCH', ...json({ done: true }) });
    assert.equal(patched.status, 200);
    const patchedBody = await patched.json();
    assert.equal(patchedBody.done, true);
    assert.equal(patchedBody.status, 'done');

    const deleted = await fetch(`${base}/api/tasks/${task.id}`, { method: 'DELETE' });
    assert.equal(deleted.status, 204);

    const again = await fetch(`${base}/api/tasks/${task.id}`, { method: 'DELETE' });
    assert.equal(again.status, 404);
  }));

test('unknown route returns 404', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/api/nope`);
    assert.equal(res.status, 404);
  }));
