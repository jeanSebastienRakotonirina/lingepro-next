'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { askAI, pageSuggestions } from '@/lib/ai';

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Bonjour ! Je suis l'assistant Text'eau. Posez une question sur les commandes, tâches, livraisons…" },
  ]);
  const pathname = usePathname();
  const tips = pageSuggestions(pathname || '');

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    const answer = askAI(q, pathname);
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'bot', text: answer }]);
    setInput('');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg text-2xl flex items-center justify-center hover:bg-violet-700"
        aria-label="Assistant IA"
      >
        ✨
      </button>
      {open && (
        <div className="fixed bottom-36 md:bottom-24 right-4 z-40 w-[min(100vw-2rem,22rem)] card shadow-xl flex flex-col max-h-[70vh]">
          <div className="font-semibold text-sm mb-2 text-violet-700">Assistant Text&apos;eau (gratuit)</div>
          <div className="flex-1 overflow-y-auto space-y-2 text-sm mb-2 max-h-64">
            {messages.map((m, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 ${m.role === 'user' ? 'bg-brand-50 ml-6' : 'bg-slate-100 mr-4'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {tips.map((t) => (
              <button key={t} type="button" onClick={() => send(t)} className="text-[10px] px-2 py-1 rounded-full bg-violet-50 text-violet-700">
                {t}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Votre question…" />
            <button type="submit" className="btn-primary px-3">
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}
