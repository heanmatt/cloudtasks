'use strict';

const { randomUUID } = require('crypto');

const DEFAULT_TASKS = [
  {
    title: 'Push project source code to GitHub repository',
    category: 'DevOps',
    priority: 'High',
    status: 'done',
    done: true,
    assignee: 'Hean Matt',
    offsetMs: -3600000 * 5,
  },
  {
    title: 'Configure Jenkins CI/CD server on AWS EC2 (:8080)',
    category: 'DevOps',
    priority: 'High',
    status: 'done',
    done: true,
    assignee: 'Hean Matt',
    offsetMs: -3600000 * 4,
  },
  {
    title: 'Deploy Docker Compose stack on Port :8081 (Nginx), :3000 (Web), :4000 (API)',
    category: 'Cloud EC2',
    priority: 'High',
    status: 'done',
    done: true,
    assignee: 'Group-03 Dev',
    offsetMs: -3600000 * 3,
  },
  {
    title: 'Build Multi-Tab UI (Dashboard, Tasks, Kanban, Analytics, EC2 Ports, Setup Guide)',
    category: 'Frontend UI',
    priority: 'High',
    status: 'in-progress',
    done: false,
    assignee: 'Hean Matt',
    offsetMs: -3600000 * 2,
  },
  {
    title: 'Verify REST API health check (:4000/api/health) and Redis persistence',
    category: 'Backend API',
    priority: 'Medium',
    status: 'in-progress',
    done: false,
    assignee: 'QA Engineer',
    offsetMs: -3600000 * 1,
  },
  {
    title: 'Send live EC2 IP & Ports (:8081, :3000, :4000, :8080) and Report to Teacher',
    category: 'Documentation',
    priority: 'High',
    status: 'todo',
    done: false,
    assignee: 'Hean Matt',
    offsetMs: -1800000,
  },
];

function normalizeTaskInput(input) {
  const isObject = input && typeof input === 'object';
  const title = isObject ? String(input.title || '').trim() : String(input || '').trim();
  const category = (isObject && input.category) ? String(input.category).trim() : 'General';
  const priority = (isObject && ['High', 'Medium', 'Low'].includes(input.priority)) ? input.priority : 'Medium';
  const assignee = (isObject && input.assignee) ? String(input.assignee).trim() : 'Hean Matt';
  let status = (isObject && ['todo', 'in-progress', 'done'].includes(input.status)) ? input.status : 'todo';
  let done = isObject && typeof input.done === 'boolean' ? input.done : status === 'done';
  if (done) status = 'done';
  else if (status === 'done') status = 'todo';

  return {
    id: randomUUID(),
    title,
    category,
    priority,
    status,
    done,
    assignee,
    createdAt: Date.now(),
  };
}

function applyPatch(task, patch) {
  const updated = { ...task };
  if (typeof patch.title === 'string' && patch.title.trim()) {
    updated.title = patch.title.trim();
  }
  if (typeof patch.category === 'string' && patch.category.trim()) {
    updated.category = patch.category.trim();
  }
  if (typeof patch.priority === 'string' && ['High', 'Medium', 'Low'].includes(patch.priority)) {
    updated.priority = patch.priority;
  }
  if (typeof patch.assignee === 'string' && patch.assignee.trim()) {
    updated.assignee = patch.assignee.trim();
  }
  if (typeof patch.status === 'string' && ['todo', 'in-progress', 'done'].includes(patch.status)) {
    updated.status = patch.status;
    updated.done = patch.status === 'done';
  }
  if (typeof patch.done === 'boolean') {
    updated.done = patch.done;
    if (patch.done) {
      updated.status = 'done';
    } else if (updated.status === 'done' && !patch.status) {
      updated.status = 'todo';
    }
  }
  return updated;
}

function createMemoryStore({ seed = false } = {}) {
  const tasks = new Map();

  function seedDefaults() {
    tasks.clear();
    const now = Date.now();
    for (const item of DEFAULT_TASKS) {
      const id = randomUUID();
      tasks.set(id, {
        id,
        title: item.title,
        category: item.category,
        priority: item.priority,
        status: item.status,
        done: item.done,
        assignee: item.assignee,
        createdAt: now + item.offsetMs,
      });
    }
  }

  if (seed) seedDefaults();

  return {
    async list() {
      return [...tasks.values()].sort((a, b) => a.createdAt - b.createdAt);
    },
    async add(input) {
      const task = normalizeTaskInput(input);
      tasks.set(task.id, task);
      return task;
    },
    async update(id, patch) {
      const task = tasks.get(id);
      if (!task) return null;
      const updated = applyPatch(task, patch);
      tasks.set(id, updated);
      return updated;
    },
    async remove(id) {
      return tasks.delete(id);
    },
    async resetSeed() {
      seedDefaults();
      return this.list();
    },
    async ping() {
      return 'memory-ok';
    },
  };
}

function createRedisStore(url) {
  const { createClient } = require('redis');
  const client = createClient({ url, disableOfflineQueue: true });
  let seeded = false;

  client.on('error', (err) => console.error('[redis]', err.message));
  client.connect()
    .then(async () => {
      const count = await client.hLen('tasks');
      if (count === 0 && !seeded) {
        seeded = true;
        const now = Date.now();
        for (const item of DEFAULT_TASKS) {
          const id = randomUUID();
          const t = {
            id,
            title: item.title,
            category: item.category,
            priority: item.priority,
            status: item.status,
            done: item.done,
            assignee: item.assignee,
            createdAt: now + item.offsetMs,
          };
          await client.hSet('tasks', id, JSON.stringify(t));
        }
      }
    })
    .catch((err) => console.error('[redis] initial connect failed:', err.message));

  return {
    async list() {
      const all = await client.hGetAll('tasks');
      return Object.values(all)
        .map((raw) => JSON.parse(raw))
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    async add(input) {
      const task = normalizeTaskInput(input);
      await client.hSet('tasks', task.id, JSON.stringify(task));
      return task;
    },
    async update(id, patch) {
      const raw = await client.hGet('tasks', id);
      if (!raw) return null;
      const updated = applyPatch(JSON.parse(raw), patch);
      await client.hSet('tasks', id, JSON.stringify(updated));
      return updated;
    },
    async remove(id) {
      return (await client.hDel('tasks', id)) === 1;
    },
    async resetSeed() {
      await client.del('tasks');
      const now = Date.now();
      for (const item of DEFAULT_TASKS) {
        const id = randomUUID();
        const t = {
          id,
          title: item.title,
          category: item.category,
          priority: item.priority,
          status: item.status,
          done: item.done,
          assignee: item.assignee,
          createdAt: now + item.offsetMs,
        };
        await client.hSet('tasks', id, JSON.stringify(t));
      }
      return this.list();
    },
    async ping() {
      await client.ping();
    },
  };
}

module.exports = { createMemoryStore, createRedisStore };
