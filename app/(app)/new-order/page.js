'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CATALOG = [
  { sku: 'DB-STD', name: 'Drap de bain', unitPrice: 2.8, category: 'bain' },
  { sku: 'TB-STD', name: 'Tapis de bain', unitPrice: 3.2, category: 'bain' },
  { sku: 'ST-STD', name: 'Serviette de toilette', unitPrice: 1.5, category: 'bain' },
  { sku: 'SB-STD', name: 'Serviette de bain', unitPrice: 2.2, category: 'bain' },
  { sku: 'TO-CAR', name: "Taie d'oreiller carrée", unitPrice: 1.2, category: 'literie' },
  { sku: 'TO-REC', name: "Taie d'oreiller rectangulaire", unitPrice: 1.3, category: 'literie' },
  { sku: 'DR-STD', name: 'Drap plat', unitPrice: 2.5, category: 'literie' },
  { sku: 'DH-STD', name: 'Drap housse', unitPrice: 2.8, category: 'literie' },
  { sku: 'HC-STD', name: 'Housse de couette', unitPrice: 4.5, category: 'literie' },
  { sku: 'TAB-CU', name: 'Tablier cuisinier', unitPrice: 2.0, category: 'pro' },
  { sku: 'STAB', name: 'Serviette de table', unitPrice: 1.0, category: 'table' },
  { sku: 'NAP-STD', name: 'Nappe de table', unitPrice: 5.0, category: 'table' },
  { sku: 'HV-GIL', name: 'Gilet haute visibilité', unitPrice: 4.0, category: 'hv' },
  { sku: 'HV-PAN', name: 'Pantalon HV', unitPrice: 5.5, category: 'hv' },
  { sku: 'HV-VES', name: 'Veste réfléchissante', unitPrice: 6.5, category: 'hv' },
  { sku: 'HV-BAN', name: 'Bande / accessoire HV', unitPrice: 2.0, category: 'hv' },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [qty, setQty] = useState({});
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [express, setExpress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');

  const showPrices = user?.role === 'admin' || user?.role === 'client';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        if (d.user?.address) {
          setStreet(d.user.address.street || '');
          setPostalCode(d.user.address.postalCode || '');
          setCity(d.user.address.city || '');
        }
        if (d.user?.role === 'admin' || d.user?.role === 'operateur') {
          fetch('/api/users')
            .then((r) => r.json())
            .then((u) => setClients((u.users || []).filter((x) => x.role === 'client')));
        }
      });
  }, []);

  function setQ(sku, n) {
    const v = Math.max(0, Math.min(999, Number.isFinite(n) ? n : 0));
    setQty((q) => ({ ...q, [sku]: v }));
  }

  const lines = CATALOG.filter((c) => (qty[c.sku] || 0) > 0);
  let total = lines.reduce((s, c) => s + c.unitPrice * (qty[c.sku] || 0), 0);
  if (express) total *= 1.3;

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const items = lines.map((c) => ({ sku: c.sku, qty: qty[c.sku] }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          notes,
          express,
          clientId: clientId || undefined,
          deliveryAddress: { street, postalCode, city },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setMsg(`Commande ${data.order.number} créée · BL ${data.deliveryNumber} · Facture ${data.invoiceNumber}. Tâches atelier générées.`);
      setTimeout(() => router.push('/orders'), 1500);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Nouvelle commande</h1>
      <form onSubmit={submit} className="space-y-6">
        {(user?.role === 'admin' || user?.role === 'operateur') && clients.length > 0 && (
          <div className="card">
            <label className="label">Client</label>
            <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">— moi / sélectionner —</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="card">
          <h2 className="font-semibold mb-3">Articles</h2>
          <div className="grid gap-2">
            {CATALOG.map((c) => (
              <div key={c.sku} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  {showPrices && <div className="text-xs text-slate-400">{c.unitPrice.toFixed(2)} € / u</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-lg border border-slate-200 text-lg leading-none"
                    onClick={() => setQ(c.sku, (qty[c.sku] || 0) - 1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    className="w-14 text-center input py-1.5 px-1"
                    value={qty[c.sku] || 0}
                    onChange={(e) => setQ(c.sku, parseInt(e.target.value, 10) || 0)}
                  />
                  <button
                    type="button"
                    className="w-9 h-9 rounded-lg border border-slate-200 text-lg leading-none"
                    onClick={() => setQ(c.sku, (qty[c.sku] || 0) + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Adresse de livraison</h2>
          <div>
            <label className="label">Rue</label>
            <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="12 rue de la Paix" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Code postal</label>
              <input className="input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="29000" />
            </div>
            <div>
              <label className="label">Ville</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Quimper" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
            Express (+30 %)
          </label>
        </div>

        {showPrices && lines.length > 0 && (
          <div className="text-right font-bold text-lg">{total.toFixed(2)} €</div>
        )}

        {msg && <p className="text-sm text-brand-700">{msg}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading || lines.length === 0}>
          {loading ? 'Envoi…' : 'Valider la commande'}
        </button>
      </form>
    </div>
  );
}
