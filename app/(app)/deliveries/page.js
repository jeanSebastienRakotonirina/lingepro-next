'use client';

import { useEffect, useState } from 'react';

export default function DeliveriesPage() {
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);

  function load() {
    fetch('/api/deliveries')
      .then((r) => r.json())
      .then((d) => setList(d.deliveries || []));
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    load();
  }, []);

  async function setStatus(id, status) {
    await fetch('/api/deliveries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id) {
    if (user?.role !== 'admin') return;
    if (!confirm('Supprimer ce BL ?')) return;
    await fetch(`/api/deliveries?id=${id}`, { method: 'DELETE' });
    load();
  }

  function printBL(d) {
    const a = d.address || {};
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${d.number}</title>
      <style>body{font-family:system-ui;padding:24px} img{height:48px}</style></head><body>
      <img src="/logo-texteau.png" alt="Text'eau"/>
      <h1>Bon de livraison ${d.number}</h1>
      <p>Commande : ${d.orderNumber}</p>
      <p><strong>${d.clientName}</strong><br/>${a.street || ''}<br/>${a.postalCode || ''} ${a.city || ''}</p>
      <p>Prévu : ${d.scheduledDate ? new Date(d.scheduledDate).toLocaleString('fr-FR') : '—'}<br/>Statut : ${d.status}</p>
      <p>${d.notes || ''}</p>
      <p style="margin-top:48px">Signature client : ________________</p>
      <p style="color:#666;margin-top:24px">Text'eau — Le nettoyage nature</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  }

  const st = { planned: 'Planifiée', in_transit: 'En cours', delivered: 'Livrée', cancelled: 'Annulée' };

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Livraisons</h1>
      <p className="text-sm text-slate-500 mb-4">Bons créés auto (numéro BL + date J+1).</p>
      <div className="space-y-3">
        {list.map((d) => (
          <div key={d._id} className="card">
            <div className="font-semibold">{d.number}</div>
            <div className="text-xs text-slate-500 mb-2">
              {d.orderNumber} · {d.clientName} · {st[d.status] || d.status}
            </div>
            <div className="text-sm text-slate-600 mb-2">
              {[d.address?.street, d.address?.postalCode, d.address?.city].filter(Boolean).join(', ') || 'Adresse non renseignée'}
            </div>
            <div className="text-xs text-slate-400 mb-3">
              Prévu : {d.scheduledDate ? new Date(d.scheduledDate).toLocaleString('fr-FR') : '—'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary text-xs" onClick={() => printBL(d)}>
                PDF / Imprimer
              </button>
              {user?.role !== 'client' && d.status === 'planned' && (
                <button type="button" className="btn-secondary text-xs" onClick={() => setStatus(d._id, 'in_transit')}>
                  En route
                </button>
              )}
              {user?.role !== 'client' && d.status !== 'delivered' && d.status !== 'cancelled' && (
                <button type="button" className="btn-primary text-xs" onClick={() => setStatus(d._id, 'delivered')}>
                  Livré
                </button>
              )}
              {user?.role === 'admin' && (
                <button type="button" className="btn-danger text-xs" onClick={() => remove(d._id)}>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-slate-400 text-sm">Aucune livraison</p>}
      </div>
    </div>
  );
}
