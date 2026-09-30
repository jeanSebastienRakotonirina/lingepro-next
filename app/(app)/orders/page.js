'use client';

import { useEffect, useState } from 'react';

const CATALOG = [
  { sku: 'DB-STD', name: 'Drap de bain', unitPrice: 2.8 },
  { sku: 'TB-STD', name: 'Tapis de bain', unitPrice: 3.2 },
  { sku: 'ST-STD', name: 'Serviette de toilette', unitPrice: 1.5 },
  { sku: 'SB-STD', name: 'Serviette de bain', unitPrice: 2.2 },
  { sku: 'TO-CAR', name: "Taie d'oreiller carrée", unitPrice: 1.2 },
  { sku: 'TO-REC', name: "Taie d'oreiller rectangulaire", unitPrice: 1.3 },
  { sku: 'DR-STD', name: 'Drap plat', unitPrice: 2.5 },
  { sku: 'DH-STD', name: 'Drap housse', unitPrice: 2.8 },
  { sku: 'HC-STD', name: 'Housse de couette', unitPrice: 4.5 },
  { sku: 'TAB-CU', name: 'Tablier cuisinier', unitPrice: 2.0 },
  { sku: 'STAB', name: 'Serviette de table', unitPrice: 1.0 },
  { sku: 'NAP-STD', name: 'Nappe de table', unitPrice: 5.0 },
  { sku: 'HV-GIL', name: 'Gilet haute visibilité', unitPrice: 4.0 },
  { sku: 'HV-PAN', name: 'Pantalon HV', unitPrice: 5.5 },
  { sku: 'HV-VES', name: 'Veste réfléchissante', unitPrice: 6.5 },
  { sku: 'HV-BAN', name: 'Bande / accessoire HV', unitPrice: 2.0 },
];

const statusLabel = {
  pending: 'En attente',
  processing: 'En traitement',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showPrices = user?.role === 'admin' || user?.role === 'client';
  const isAdmin = user?.role === 'admin';
  const isStaff = user && ['admin', 'operateur', 'livreur'].includes(user.role);

  function load() {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    load();
  }, []);

  function canEdit(o) {
    if (!user || !o) return false;
    if (o.status === 'cancelled' || o.status === 'delivered') return false;
    if (user.role === 'admin') return true;
    if (user.role === 'operateur' && ['pending', 'processing', 'ready'].includes(o.status)) return true;
    if (user.role === 'client' && ['pending', 'processing'].includes(o.status)) return true;
    return false;
  }

  function openEdit(o) {
    const qty = {};
    CATALOG.forEach((c) => { qty[c.sku] = 0; });
    (o.items || []).forEach((i) => { qty[i.sku] = i.qty; });
    setEdit({
      id: o._id,
      number: o.number,
      qty,
      street: o.deliveryAddress?.street || '',
      postalCode: o.deliveryAddress?.postalCode || '',
      city: o.deliveryAddress?.city || '',
      notes: o.notes || '',
      express: !!o.express,
    });
  }

  function setQ(sku, n) {
    const v = Math.max(0, Math.min(999, Number.isFinite(n) ? n : 0));
    setEdit((e) => ({ ...e, qty: { ...e.qty, [sku]: v } }));
  }

  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setToast('');
    try {
      const items = CATALOG.filter((c) => (edit.qty[c.sku] || 0) > 0).map((c) => ({
        sku: c.sku,
        qty: edit.qty[c.sku],
      }));
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: edit.id,
          edit: true,
          items,
          express: edit.express,
          notes: edit.notes,
          deliveryAddress: {
            street: edit.street,
            postalCode: edit.postalCode,
            city: edit.city,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setToast(data.message || 'Commande mise à jour');
      setEdit(null);
      load();
    } catch (err) {
      setToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id) {
    if (!confirm('Annuler cette commande ?')) return;
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cancel' }),
    });
    load();
  }

  async function setStatus(id, status) {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id) {
    if (!confirm('Supprimer définitivement ?')) return;
    await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
    load();
  }

  function printOrder(o) {
    const w = window.open('', '_blank');
    const addr = o.deliveryAddress || {};
    const priceRows = showPrices
      ? o.items?.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.unitPrice ?? ''}</td><td>${i.lineTotal ?? ''}</td></tr>`).join('')
      : o.items?.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>${o.number}</title>
      <style>body{font-family:system-ui;padding:24px} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ddd;padding:6px;text-align:left}
      img{height:48px}</style></head><body>
      <img src="/logo-texteau.png" alt="Text'eau"/>
      <h1>Commande ${o.number}</h1>
      <p>${o.clientName}<br/>${addr.street || ''}<br/>${addr.postalCode || ''} ${addr.city || ''}</p>
      <p>Statut : ${o.status} · BL : ${o.deliveryNumber || '—'} · Facture : ${o.invoiceNumber || '—'}</p>
      <table><thead><tr><th>Article</th><th>Qté</th>${showPrices ? '<th>P.U.</th><th>Total</th>' : ''}</tr></thead>
      <tbody>${priceRows}</tbody></table>
      ${showPrices ? `<p><strong>Total : ${(o.total ?? 0).toFixed?.(2) ?? o.total} €</strong></p>` : ''}
      <p style="margin-top:40px;color:#666">Text'eau — Le nettoyage nature</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  }

  let editTotal = 0;
  if (edit && showPrices) {
    editTotal = CATALOG.reduce((s, c) => s + c.unitPrice * (edit.qty[c.sku] || 0), 0);
    if (edit.express) editTotal *= 1.3;
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Commandes</h1>
      <p className="text-sm text-slate-500 mb-4">
        Tâches, BL et facture générés automatiquement. Admin et client peuvent modifier (selon statut).
      </p>
      {toast && <div className="mb-3 rounded-xl bg-brand-50 text-brand-800 text-sm px-3 py-2">{toast}</div>}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="card">
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold">{o.number}</div>
                <div className="text-xs text-slate-500">
                  {o.clientName} · {statusLabel[o.status] || o.status}
                </div>
                <div className="text-xs text-slate-400">
                  {[o.deliveryAddress?.street, o.deliveryAddress?.postalCode, o.deliveryAddress?.city].filter(Boolean).join(', ') || 'Adresse non renseignée'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {o.deliveryNumber && <span className="mr-2">BL {o.deliveryNumber}</span>}
                  {o.invoiceNumber && <span>FAC {o.invoiceNumber}</span>}
                </div>
              </div>
              {showPrices && <div className="font-bold text-brand-700">{(o.total ?? 0).toFixed?.(2) ?? o.total} €</div>}
            </div>
            <ul className="text-sm text-slate-600 mb-3">
              {(o.items || []).map((i, idx) => (
                <li key={idx}>
                  {i.qty}× {i.name}
                  {showPrices && i.lineTotal != null ? ` — ${i.lineTotal} €` : ''}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {canEdit(o) && (
                <button type="button" className="btn-primary text-xs" onClick={() => openEdit(o)}>
                  Modifier
                </button>
              )}
              <button type="button" className="btn-secondary text-xs" onClick={() => printOrder(o)}>
                PDF / Imprimer
              </button>
              {o.status !== 'cancelled' && o.status !== 'delivered' && (
                <button type="button" className="btn-secondary text-xs text-red-600" onClick={() => cancel(o._id)}>
                  Annuler
                </button>
              )}
              {isStaff && o.status === 'processing' && (
                <button type="button" className="btn-secondary text-xs" onClick={() => setStatus(o._id, 'ready')}>
                  Marquer prête
                </button>
              )}
              {isStaff && o.status === 'ready' && (
                <button type="button" className="btn-secondary text-xs" onClick={() => setStatus(o._id, 'delivered')}>
                  Livrée
                </button>
              )}
              {isAdmin && (
                <button type="button" className="btn-danger text-xs" onClick={() => remove(o._id)}>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-slate-400 text-sm">Aucune commande</p>}
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center">
              <h2 className="font-bold">Modifier {edit.number}</h2>
              <button type="button" className="text-slate-400 text-xl px-2" onClick={() => setEdit(null)}>×</button>
            </div>
            <form onSubmit={saveEdit} className="p-4 space-y-4">
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {CATALOG.map((c) => (
                  <div key={c.sku} className="flex items-center gap-2">
                    <div className="flex-1 text-sm truncate">{c.name}</div>
                    <button type="button" className="w-8 h-8 border rounded-lg" onClick={() => setQ(c.sku, (edit.qty[c.sku] || 0) - 1)}>−</button>
                    <input type="number" min={0} max={999} className="w-12 text-center input py-1 px-0"
                      value={edit.qty[c.sku] || 0}
                      onChange={(e) => setQ(c.sku, parseInt(e.target.value, 10) || 0)} />
                    <button type="button" className="w-8 h-8 border rounded-lg" onClick={() => setQ(c.sku, (edit.qty[c.sku] || 0) + 1)}>+</button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="label">Rue</label>
                <input className="input" value={edit.street} onChange={(e) => setEdit({ ...edit, street: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Code postal</label>
                    <input className="input" value={edit.postalCode} onChange={(e) => setEdit({ ...edit, postalCode: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Ville</label>
                    <input className="input" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} />
                  </div>
                </div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={edit.express} onChange={(e) => setEdit({ ...edit, express: e.target.checked })} />
                  Express (+30 %)
                </label>
              </div>
              {showPrices && <div className="text-right font-bold">{editTotal.toFixed(2)} €</div>}
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setEdit(null)}>Annuler</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">Tâches, BL et facture mis à jour automatiquement.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
