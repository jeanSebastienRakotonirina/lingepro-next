'use client';

import { useEffect, useState } from 'react';

export default function GarmentsPage() {
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);
  const [label, setLabel] = useState('Gilet HV');
  const [maxWashes, setMaxWashes] = useState(50);

  function load() {
    fetch('/api/garments')
      .then((r) => r.json())
      .then((d) => setList(d.garments || []));
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    await fetch('/api/garments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, maxWashes }),
    });
    setLabel('Gilet HV');
    load();
  }

  async function increment(id) {
    await fetch('/api/garments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, incrementWash: true }),
    });
    load();
  }

  async function retire(id) {
    await fetch('/api/garments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, retire: true }),
    });
    load();
  }

  async function remove(id) {
    if (user?.role !== 'admin') return;
    await fetch(`/api/garments?id=${id}`, { method: 'DELETE' });
    load();
  }

  const alerts = list.filter((g) => ['attention', 'critique', 'hors_service'].includes(g.status));

  const colors = {
    ok: 'bg-emerald-100 text-emerald-800',
    attention: 'bg-amber-100 text-amber-800',
    critique: 'bg-orange-100 text-orange-800',
    hors_service: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Vêtements réfléchissants</h1>
      <p className="text-sm text-slate-500 mb-4">Suivi des cycles de lavage (ex. 50 max).</p>

      {alerts.length > 0 && (
        <div className="card border-amber-200 bg-amber-50 mb-4 text-sm">
          <strong>{alerts.length}</strong> pièce(s) en alerte ou hors service.
        </div>
      )}

      <form onSubmit={create} className="card flex flex-wrap gap-2 items-end mb-6">
        <div className="flex-1 min-w-[8rem]">
          <label className="label">Libellé</label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="w-24">
          <label className="label">Max lavages</label>
          <input className="input" type="number" min={1} value={maxWashes} onChange={(e) => setMaxWashes(+e.target.value)} />
        </div>
        <button type="submit" className="btn-primary">
          + Enregistrer
        </button>
      </form>

      <div className="space-y-3">
        {list.map((g) => {
          const left = Math.max(0, (g.maxWashes || 50) - (g.washCount || 0));
          const pct = Math.min(100, Math.round(((g.washCount || 0) / (g.maxWashes || 50)) * 100));
          return (
            <div key={g._id} className="card">
              <div className="flex justify-between gap-2 mb-2">
                <div>
                  <div className="font-medium">
                    {g.label} <span className="text-xs text-slate-400">{g.code}</span>
                  </div>
                  <div className="text-xs text-slate-500">{g.clientName}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full h-fit ${colors[g.status] || colors.ok}`}>{g.status}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                <div className={`h-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-slate-500 mb-2">
                {g.washCount}/{g.maxWashes} lavages · {left} restant(s)
              </div>
              <div className="flex gap-2">
                {(user?.role === 'admin' || user?.role === 'operateur') && g.status !== 'hors_service' && (
                  <button type="button" className="btn-secondary text-xs" onClick={() => increment(g._id)}>
                    +1 lavage
                  </button>
                )}
                {g.status !== 'hors_service' && (
                  <button type="button" className="btn-secondary text-xs" onClick={() => retire(g._id)}>
                    Hors service
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button type="button" className="btn-danger text-xs" onClick={() => remove(g._id)}>
                    Suppr.
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
