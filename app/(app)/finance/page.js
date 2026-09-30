'use client';

import { useEffect, useState } from 'react';

export default function FinancePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/finance')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-slate-400">Chargement…</p>;
  if (data.error) return <p className="text-red-600">{data.error}</p>;

  const maxM = Math.max(...(data.byMonth || [1]), 1);
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Finances / CA (admin)</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <div className="text-xs text-slate-500">CA mois</div>
          <div className="text-xl font-bold text-brand-700">{data.caMonth?.toFixed(2)} €</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500">CA année</div>
          <div className="text-xl font-bold">{data.caYear?.toFixed(2)} €</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500">En cours / impayés</div>
          <div className="text-xl font-bold text-amber-600">{data.unpaid?.toFixed(2)} €</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500">Commandes</div>
          <div className="text-xl font-bold">{data.orderCount}</div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-sm mb-3">Évolution mensuelle</h2>
        <div className="flex items-end gap-1 h-40">
          {(data.byMonth || []).map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-brand-500 rounded-t" style={{ height: `${Math.max(4, (v / maxM) * 100)}%` }} title={`${v.toFixed(0)} €`} />
              <span className="text-[9px] text-slate-400">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-sm mb-3">Top clients</h2>
        <ul className="space-y-2">
          {(data.topClients || []).map((c) => (
            <li key={c.name} className="flex justify-between text-sm">
              <span>{c.name}</span>
              <span className="font-medium">{c.total.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
