'use client';

import { useEffect, useState } from 'react';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'client',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      phone: form.phone,
      address: { street: form.street, postalCode: form.postalCode, city: form.city },
    };
    if (form.password) payload.password = form.password;
    if (editId) payload.id = editId;

    const res = await fetch('/api/users', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Erreur');
      return;
    }
    setForm(emptyForm);
    setEditId(null);
    load();
  }

  function startEdit(u) {
    setEditId(u._id);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phone: u.phone || '',
      street: u.address?.street || '',
      postalCode: u.address?.postalCode || '',
      city: u.address?.city || '',
    });
  }

  async function remove(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    load();
  }

  async function toggleActive(u) {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u._id, active: !u.active }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Utilisateurs (CRUD admin)</h1>
      <form onSubmit={save} className="card space-y-3 mb-6">
        <h2 className="font-semibold text-sm">{editId ? 'Modifier' : 'Créer'}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nom</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Mot de passe {editId ? '(vide = inchangé)' : ''}</label>
            <input className="input" type="password" required={!editId} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Rôle</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="client">Client</option>
              <option value="operateur">Opérateur</option>
              <option value="livreur">Livreur</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Rue</label>
            <input className="input" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          </div>
          <div>
            <label className="label">Code postal</label>
            <input className="input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
          <div>
            <label className="label">Ville</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {editId ? 'Enregistrer' : 'Créer'}
          </button>
          {editId && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditId(null);
                setForm(emptyForm);
              }}
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u._id} className="card flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-medium">
                {u.name} <span className="text-xs text-slate-400">({u.role})</span>
                {!u.active && <span className="text-xs text-red-500 ml-1">inactif</span>}
              </div>
              <div className="text-xs text-slate-500">{u.email}</div>
              <div className="text-xs text-slate-400">
                {[u.address?.street, u.address?.postalCode, u.address?.city].filter(Boolean).join(', ') || 'Pas d’adresse'}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary text-xs" onClick={() => startEdit(u)}>
                Éditer
              </button>
              <button type="button" className="btn-secondary text-xs" onClick={() => toggleActive(u)}>
                {u.active ? 'Désactiver' : 'Activer'}
              </button>
              <button type="button" className="btn-danger text-xs" onClick={() => remove(u._id)}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
