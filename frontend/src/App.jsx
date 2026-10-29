import { useEffect, useState } from 'react';
import { listTasks, createTask, updateTask, deleteTask } from './api.js';
import TaskModal from './TaskModal.jsx';

const FILTERS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
];

const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const fmtDate = (s) => s.split('-').reverse().join('/');

function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function App() {
  const [data, setData] = useState({ tasks: [], total: 0, completed: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modal, setModal] = useState(null); // null | {} (criar) | task (editar)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const debounced = useDebounce(search);

  useEffect(() => {
    let cancelled = false;
    listTasks(debounced.trim(), status)
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [debounced, status, tick]);

  const reload = () => setTick((t) => t + 1);
  const run = async (fn) => {
    try { await fn(); reload(); } catch (e) { setError(e.message); }
  };

  const save = async (payload) => {
    if (modal?.id) await updateTask(modal.id, payload);
    else await createTask(payload);
    setModal(null);
    reload();
  };

  const pending = data.total - data.completed;
  const counts = { all: data.total, pending, completed: data.completed };
  const today = todayStr();

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="logo">Task<span>Mingle</span></div>

        <div className="search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <p className="section">TASKS</p>
        <nav>
          {FILTERS.map((f) => (
            <button key={f.id} className={`nav-item ${status === f.id ? 'active' : ''}`}
              onClick={() => setStatus(f.id)}>
              <span>{f.label}</span>
              <em className="badge">{counts[f.id]}</em>
            </button>
          ))}
        </nav>

        <div className="user">
          <div className="avatar">SS</div>
          <div><strong>Sarah Smith</strong><small>sarah.smith@shopmingle.com</small></div>
        </div>
        <button className="collapse" onClick={() => setCollapsed((c) => !c)}>
          ⇤ <span>Collapse</span>
        </button>
      </aside>

      <main className="content">
        <header>
          <h1>My Tasks</h1>
          <p className="counters">
            <b>{data.total}</b> total · <b>{data.completed}</b> completed
          </p>
        </header>

        {error && <div className="alert" role="alert">{error}</div>}

        {!loading && data.tasks.length === 0 ? (
          <div className="empty">
            <p>{search || status === 'completed' ? 'No tasks found.' : 'You have no pending tasks.'}</p>
          </div>
        ) : (
          <ul className="list">
            {data.tasks.map((t) => {
              const done = Boolean(t.completed);
              const late = !done && t.due_date && t.due_date < today;
              return (
                <li key={t.id} className="task">
                  <button className={`check ${done ? 'on' : ''}`} aria-label="Marcar como concluída"
                    aria-pressed={done} onClick={() => run(() => updateTask(t.id, { completed: !done }))}>
                    {done && <svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg>}
                  </button>
                  <div className="info">
                    <span className={`title ${done ? 'done' : ''} ${late ? 'late' : ''}`}>{t.title}</span>
                    {t.due_date && (
                      <span className="meta">
                        {fmtDate(t.due_date)}
                        {late && <em className="late-badge">Em atraso</em>}
                      </span>
                    )}
                  </div>
                  <div className="row-actions">
                    <button aria-label="Editar" onClick={() => setModal(t)}>
                      <svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /></svg>
                    </button>
                    <button aria-label="Excluir" className="danger"
                      onClick={() => window.confirm('Excluir esta tarefa?') && run(() => deleteTask(t.id))}>
                      <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button className="fab" aria-label="Create Task" onClick={() => setModal({})}>+</button>
      </main>

      {modal && <TaskModal task={modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
