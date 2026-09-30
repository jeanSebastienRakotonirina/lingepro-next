'use client';

import { useEffect, useState } from 'react';

const TYPE_LABEL = { lavage: 'Lavage', sechage: 'Séchage', repassage: 'Repassage', pliage: 'Pliage' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('todo');
  const [user, setUser] = useState(null);

  function load() {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []));
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    load();
  }, []);

  async function setStatus(id, status) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id) {
    if (user?.role !== 'admin') return;
    if (!confirm('Supprimer cette tâche ?')) return;
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = tasks.filter((t) => (filter === 'all' ? true : t.status === filter));

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Tâches atelier</h1>
      <p className="text-sm text-slate-500 mb-4">Générées automatiquement à chaque commande reçue.</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todo', 'doing', 'done', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'}`}
          >
            {f === 'todo' ? 'À faire' : f === 'doing' ? 'En cours' : f === 'done' ? 'Terminées' : 'Toutes'}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t._id} className="card flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-medium text-sm">
                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-xs mr-2">{TYPE_LABEL[t.type] || t.type}</span>
                {t.label}
              </div>
              <div className="text-xs text-slate-400">
                {t.orderNumber} · {t.machineHint}
                {t.weightKg != null ? ` · ~${t.weightKg} kg` : ''}
              </div>
            </div>
            <div className="flex gap-2">
              {t.status === 'todo' && (
                <button type="button" className="btn-secondary text-xs" onClick={() => setStatus(t._id, 'doing')}>
                  Démarrer
                </button>
              )}
              {t.status !== 'done' && (
                <button type="button" className="btn-primary text-xs" onClick={() => setStatus(t._id, 'done')}>
                  Terminer
                </button>
              )}
              {user?.role === 'admin' && (
                <button type="button" className="btn-danger text-xs" onClick={() => remove(t._id)}>
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-400 text-sm">Aucune tâche</p>}
      </div>
    </div>
  );
}
