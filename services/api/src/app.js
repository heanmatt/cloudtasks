'use strict';

const os = require('os');

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TITLE_LENGTH = 140;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function send(res, status, body) {
  if (status === 204) {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  return res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) tooLarge = true;
      else chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) return reject(httpError(413, 'Request body too large'));
      if (chunks.length === 0) return resolve({});
      try {
        return resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        return reject(httpError(400, 'Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function identity() {
  return {
    service: 'api',
    host: os.hostname(),
    version: process.env.APP_VERSION || '2.1.0',
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

function computeStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done || t.status === 'done').length;
  const inProgress = tasks.filter((t) => !t.done && t.status === 'in-progress').length;
  const todo = total - done - inProgress;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const byCategory = {};
  const byPriority = { High: 0, Medium: 0, Low: 0 };
  const byAssignee = {};

  for (const t of tasks) {
    const cat = t.category || 'General';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    const prio = ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium';
    byPriority[prio] = (byPriority[prio] || 0) + 1;
    const person = t.assignee || 'Unassigned';
    byAssignee[person] = (byAssignee[person] || 0) + 1;
  }

  return { total, todo, inProgress, done, completionRate, byCategory, byPriority, byAssignee };
}

function createApp(store) {
  return async function handler(req, res) {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        return res.end();
      }

      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const method = req.method;

      if ((path === '/api/health' || path === '/health') && method === 'GET') {
        let storeStatus = 'up';
        if (typeof store.ping === 'function') {
          try {
            await store.ping();
            storeStatus = 'up';
          } catch {
            storeStatus = 'down';
          }
        }
        return send(res, 200, {
          status: 'ok',
          ...identity(),
          store: storeStatus,
          ports: { nginx: 8081, web: 3000, api: 4000, jenkins: 8080 },
        });
      }

      if (path === '/api/whoami' && method === 'GET') {
        return send(res, 200, identity());
      }

      if (path === '/api/stats' && method === 'GET') {
        const tasks = await store.list();
        return send(res, 200, { ...computeStats(tasks), ...identity() });
      }

      if (path === '/api/tasks/seed' && method === 'POST') {
        if (typeof store.resetSeed === 'function') {
          const list = await store.resetSeed();
          return send(res, 200, list);
        }
        return send(res, 200, await store.list());
      }

      if (path === '/api/tasks') {
        if (method === 'GET') return send(res, 200, await store.list());
        if (method === 'POST') {
          const body = await readJson(req);
          const title = typeof body.title === 'string' ? body.title.trim() : '';
          if (!title) throw httpError(400, 'title is required');
          if (title.length > MAX_TITLE_LENGTH) {
            throw httpError(400, `title must be at most ${MAX_TITLE_LENGTH} characters`);
          }
          const created = await store.add({
            title,
            category: body.category,
            priority: body.priority,
            status: body.status,
            done: body.done,
            assignee: body.assignee,
          });
          return send(res, 201, created);
        }
        throw httpError(405, 'Method not allowed');
      }

      const match = path.match(/^\/api\/tasks\/([\w-]+)$/);
      if (match) {
        const id = match[1];
        if (method === 'PATCH') {
          const body = await readJson(req);
          const hasValidField =
            typeof body.done === 'boolean' ||
            typeof body.status === 'string' ||
            typeof body.title === 'string' ||
            typeof body.category === 'string' ||
            typeof body.priority === 'string' ||
            typeof body.assignee === 'string';
          if (!hasValidField) throw httpError(400, 'Provide done, status, title, category, priority, or assignee');
          const task = await store.update(id, body);
          if (!task) throw httpError(404, 'Task not found');
          return send(res, 200, task);
        }
        if (method === 'DELETE') {
          const removed = await store.remove(id);
          if (!removed) throw httpError(404, 'Task not found');
          return send(res, 204);
        }
        throw httpError(405, 'Method not allowed');
      }

      throw httpError(404, 'Not found');
    } catch (err) {
      const status = err.status || 500;
      if (status === 500) console.error(err);
      send(res, status, { error: status === 500 ? 'Internal server error' : err.message });
    }
  };
}

module.exports = { createApp };
