'use client';

import { useEffect, useState } from 'react';

export default function MachinesPage() {
  const [data, setData] = useState(null);
  const [planCmd, setPlanCmd] = useState('');
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetch('/api/machines')
      .then((r) => r.json())
      .then(setData);
  }, []);

  async function planOrder(e) {
    e.preventDefault();
    const res = await fetch(`/api/machines?plan=${encodeURIComponent(planCmd)}`);
    const d = await res.json();
    setPlan(d.plan || null);
    if (d.error) alert(d.error);
  }

  if (!data) return <p className="text-slate-400">Chargement…</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Parc machines</h1>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="card">
          <h2 className="font-semibold text-sm mb-2">Lavage — {data.totalWashKg} kg</h2>
          <ul className="text-sm space-y-1">
            {(data.washers || []).map((m) => (
              <li key={m.id}>
                {m.label} <span className="text-slate-400">({m.capacityKg} kg)</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold text-sm mb-2">Séchage — {data.totalDryKg} kg</h2>
          <ul className="text-sm space-y-1">
            {(data.dryers || []).map((m) => (
              <li key={m.id}>
                {m.label} <span className="text-slate-400">({m.capacityKg} kg)</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold text-sm mb-2">Repassage</h2>
          <ul className="text-sm space-y-1">
            {(data.ironers || []).map((m) => (
              <li key={m.id}>{m.label}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold text-sm mb-2">Pliage</h2>
          <ul className="text-sm space-y-1">
            {(data.folders || []).map((m) => (
              <li key={m.id}>{m.label}</li>
            ))}
          </ul>
        </div>
      </div>

      <form onSubmit={planOrder} className="card flex gap-2 mb-4">
        <input className="input flex-1" placeholder="CMD-…" value={planCmd} onChange={(e) => setPlanCmd(e.target.value)} />
        <button type="submit" className="btn-primary">
          Planifier
        </button>
      </form>

      {plan && (
        <div className="card space-y-3">
          <h2 className="font-semibold">
            Plan {plan.orderNumber} — ~{plan.weightKg?.toFixed?.(1)} kg
          </h2>
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Lavage</h3>
            {(plan.washLoads || []).map((l, i) => (
              <div key={i} className="text-sm">
                {l.machine.label} : {l.kg} kg ({l.pct} %)
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Séchage</h3>
            {(plan.dryLoads || []).map((l, i) => (
              <div key={i} className="text-sm">
                {l.machine.label} : {l.kg} kg ({l.pct} %)
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-semibold mt-6 mb-2">File d&apos;attente</h2>
      <div className="space-y-2">
        {(data.openTasks || []).map((t) => (
          <div key={t._id} className="card text-sm">
            {t.type} — {t.label} <span className="text-slate-400">({t.status})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
