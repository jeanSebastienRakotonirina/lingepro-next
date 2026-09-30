'use client';

import { useEffect, useState } from 'react';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');

  function load() {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function send(e) {
    e.preventDefault();
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBody('');
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Messages</h1>
      <form onSubmit={send} className="card flex gap-2 mb-4">
        <input className="input flex-1" placeholder="Votre message…" value={body} onChange={(e) => setBody(e.target.value)} required />
        <button type="submit" className="btn-primary">
          Envoyer
        </button>
      </form>
      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m._id} className="card text-sm">
            <div className="text-xs text-slate-400 mb-1">
              {m.fromName} · {m.createdAt ? new Date(m.createdAt).toLocaleString('fr-FR') : ''}
            </div>
            {m.body}
          </div>
        ))}
      </div>
    </div>
  );
}
