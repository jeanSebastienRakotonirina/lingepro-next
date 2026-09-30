'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import AIAssistant from './AIAssistant';
import Tutorial from './Tutorial';

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: '📊', roles: ['admin', 'operateur', 'livreur', 'client'] },
  { href: '/new-order', label: 'Nouvelle commande', icon: '➕', roles: ['admin', 'operateur', 'client'] },
  { href: '/orders', label: 'Commandes', icon: '📦', roles: ['admin', 'operateur', 'livreur', 'client'] },
  { href: '/tasks', label: 'Tâches atelier', icon: '🧺', roles: ['admin', 'operateur'] },
  { href: '/deliveries', label: 'Livraisons', icon: '🚚', roles: ['admin', 'operateur', 'livreur', 'client'] },
  { href: '/invoices', label: 'Factures', icon: '🧾', roles: ['admin', 'client'] },
  { href: '/machines', label: 'Machines', icon: '⚙️', roles: ['admin', 'operateur'] },
  { href: '/garments', label: 'Réfléchissants', icon: '🦺', roles: ['admin', 'operateur', 'client'] },
  { href: '/users', label: 'Utilisateurs', icon: '👥', roles: ['admin'] },
  { href: '/finance', label: 'Finances / CA', icon: '💰', roles: ['admin'] },
  { href: '/messages', label: 'Messages', icon: '💬', roles: ['admin', 'operateur', 'client'] },
  { href: '/help', label: 'Aide', icon: '❓', roles: ['admin', 'operateur', 'livreur', 'client'] },
  { href: '/docs', label: 'Docs techniques', icon: '📘', roles: ['admin', 'operateur'] },
];

export default function Shell({ children }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace('/login');
        else setUser(d.user);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Chargement…
      </div>
    );
  }

  const links = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white fixed inset-y-0 z-30">
        <div className="p-4 border-b border-slate-100">
          <Image src="/logo-texteau.png" alt="Text'eau" width={160} height={48} className="h-12 w-auto object-contain" />
          <p className="text-[10px] text-slate-400 mt-1 tracking-wide">LE NETTOYAGE NATURE</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                pathname === l.href ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 mb-2">
            <div className="font-semibold text-slate-800">{user.name}</div>
            <div>{user.role}</div>
          </div>
          <button type="button" onClick={logout} className="btn-secondary w-full text-xs">
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between">
        <button type="button" onClick={() => setOpen(true)} className="p-2 text-xl" aria-label="Menu">
          ☰
        </button>
        <Image src="/logo-texteau.png" alt="Text'eau" width={120} height={36} className="h-8 w-auto object-contain" />
        <span className="text-[10px] text-slate-400 uppercase">{user.role}</span>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-4 overflow-y-auto">
            <Image src="/logo-texteau.png" alt="Text'eau" width={140} height={42} className="h-10 w-auto mb-4" />
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
            <button type="button" onClick={logout} className="btn-secondary w-full mt-4">
              Déconnexion
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-6 min-h-screen">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex justify-around py-2 pb-[max(0.5rem,var(--safe-bottom))]">
        {links.slice(0, 5).map((l) => (
          <Link key={l.href} href={l.href} className={`flex flex-col items-center text-[10px] ${pathname === l.href ? 'text-brand-600' : 'text-slate-500'}`}>
            <span className="text-lg">{l.icon}</span>
            {l.label.split(' ')[0]}
          </Link>
        ))}
      </nav>

      <AIAssistant role={user.role} />
      <Tutorial />
    </div>
  );
}
