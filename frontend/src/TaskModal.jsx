import { useEffect, useState } from 'react';

export default function TaskModal({ task, onClose, onSave }) {
  const editing = Boolean(task?.id);
  const [title, setTitle] = useState(task?.title ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('O nome da tarefa é obrigatório.');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), dueDate: dueDate || null });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{editing ? 'Edit Task' : 'Create Task'}</h2>
        <label>
          Task name
          <input autoFocus maxLength={255} value={title} placeholder="O que precisa ser feito?"
            onChange={(e) => { setTitle(e.target.value); setError(''); }} />
        </label>
        <label>
          Due date <span className="muted">(optional)</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={saving}>
            {editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
