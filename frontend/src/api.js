const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// Só envia Content-Type quando há body: o Fastify rejeita (400) DELETE com
// "application/json" e corpo vazio.
async function req(path, opts = {}) {
  const headers = opts.body ? { 'Content-Type': 'application/json' } : {};
  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Não foi possível concluir a ação.');
  }
  return res.status === 204 ? null : res.json();
}

export const listTasks = (search, status) =>
  req(`/api/tasks?${new URLSearchParams({ search, status })}`);
export const createTask = (data) =>
  req('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id, data) =>
  req(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTask = (id) => req(`/api/tasks/${id}`, { method: 'DELETE' });
