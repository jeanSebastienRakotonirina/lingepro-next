'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ orders: 0, tasks: 0, deliveries: 0 });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/tasks').then((r) => r.json()).catch(() => ({ tasks: [] })),
      fetch('/api/deliveries').then((r) => r.json()),
    ]).then(([o, t, d]) => {
      setStats({
        orders: (o.orders || []).filter((x) => x.status !== 'cancelled').length,
        tasks: (t.tasks || []).filter((x) => x.status !== 'done').length,
        deliveries: (d.deliveries || []).filter((x) => x.status !== 'delivered').length,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Bonjour{user ? `, ${user.name}` : ''}</h1>
      <p className="text-sm text-slate-500 mb-6">Text&apos;eau — tableau de bord</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Link href="/orders" className="card hover:border-brand-200">
          <div className="text-2xl font-bold text-brand-600">{stats.orders}</div>
          <div className="text-xs text-slate-500">Commandes actives</div>
        </Link>
        {(user?.role === 'admin' || user?.role === 'operateur') && (
          <Link href="/tasks" className="card hover:border-brand-200">
            <div className="text-2xl font-bold text-amber-600">{stats.tasks}</div>
            <div className="text-xs text-slate-500">Tâches à faire</div>
          </Link>
        )}
        <Link href="/deliveries" className="card hover:border-brand-200">
          <div className="text-2xl font-bold text-emerald-600">{stats.deliveries}</div>
          <div className="text-xs text-slate-500">Livraisons en cours</div>
        </Link>
      </div>
      <div className="card bg-brand-50 border-brand-100">
        <p className="text-sm text-brand-900">
          <strong>Automatisation :</strong> dès validation → tâches atelier + bon de livraison (J+1) + facture.
          Admin et client peuvent modifier la commande ; tâches, BL et facture se resynchronisent.
        </p>
      </div>
    </div>
  );
}
