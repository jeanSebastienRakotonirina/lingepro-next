'use client';

import { useEffect, useState } from 'react';

export default function InvoicesPage() {
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);
  const showPrices = user?.role === 'admin' || user?.role === 'client';

  function load() {
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((d) => setList(d.invoices || []));
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    load();
  }, []);

  async function setStatus(id, status) {
    await fetch('/api/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id) {
    if (user?.role !== 'admin') return;
    if (!confirm('Supprimer cette facture ?')) return;
    await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
    load();
  }

  function printInv(inv) {
    const a = inv.address || {};
    const w = window.open('', '_blank');
    const rows = showPrices
      ? (inv.items || [])
          .map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.unitPrice ?? ''}</td><td>${i.lineTotal ?? ''}</td></tr>`)
          .join('')
      : (inv.items || []).map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>${inv.number}</title>
      <style>body{font-family:system-ui;padding:24px} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ddd;padding:6px}
      img{height:48px}</style></head><body>
      <img src="/logo-texteau.png" alt="Text'eau"/>
      <h1>Facture ${inv.number}</h1>
      <p>${inv.clientName}<br/>${a.street || ''}<br/>${a.postalCode || ''} ${a.city || ''}</p>
      <p>Commande : ${inv.orderNumber || '—'} · Statut : ${inv.status}</p>
      <table><thead><tr><th>Article</th><th>Qté</th>${showPrices ? '<th>P.U.</th><th>Total</th>' : ''}</tr></thead>
      <tbody>${rows}</tbody></table>
      ${showPrices ? `<p><strong>Total TTC : ${(inv.total ?? 0).toFixed?.(2) ?? inv.total} €</strong></p>` : ''}
      <p style="margin-top:32px;color:#666">Text'eau — Le nettoyage nature</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  }

  const st = { draft: 'Brouillon', sent: 'Émise', paid: 'Payée', cancelled: 'Annulée' };

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Factures</h1>
      <p className="text-sm text-slate-500 mb-4">Créées automatiquement à chaque commande (FAC-AAMMJJ-XXXX).</p>
      <div className="space-y-3">
        {list.map((inv) => (
          <div key={inv._id} className="card">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-semibold">{inv.number}</div>
                <div className="text-xs text-slate-500">
                  {inv.clientName} · {inv.orderNumber} · {st[inv.status] || inv.status}
                </div>
                <div className="text-xs text-slate-400">
                  {[inv.address?.street, inv.address?.postalCode, inv.address?.city].filter(Boolean).join(', ')}
                </div>
              </div>
              {showPrices && <div className="font-bold text-brand-700">{(inv.total ?? 0).toFixed?.(2)} €</div>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" className="btn-secondary text-xs" onClick={() => printInv(inv)}>
                PDF / Imprimer
              </button>
              {user?.role === 'admin' && inv.status === 'sent' && (
                <button type="button" className="btn-primary text-xs" onClick={() => setStatus(inv._id, 'paid')}>
                  Marquer payée
                </button>
              )}
              {user?.role === 'admin' && (
                <button type="button" className="btn-danger text-xs" onClick={() => remove(inv._id)}>
                  Suppr.
                </button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-slate-400 text-sm">Aucune facture</p>}
      </div>
    </div>
  );
}
