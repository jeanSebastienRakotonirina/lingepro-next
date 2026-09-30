import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const orders = await Order.find({ status: { $ne: 'cancelled' } }).lean();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  let caMonth = 0;
  let caYear = 0;
  const byMonth = Array(12).fill(0);
  const byClient = {};

  for (const o of orders) {
    const d = new Date(o.createdAt);
    const t = o.total || 0;
    if (d.getFullYear() === y) {
      caYear += t;
      byMonth[d.getMonth()] += t;
      if (d.getMonth() === m) caMonth += t;
    }
    const key = o.clientName || 'Inconnu';
    byClient[key] = (byClient[key] || 0) + t;
  }

  const topClients = Object.entries(byClient)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const unpaid = orders.filter((o) => o.status !== 'delivered').reduce((s, o) => s + (o.total || 0), 0);

  return NextResponse.json({
    caMonth: Math.round(caMonth * 100) / 100,
    caYear: Math.round(caYear * 100) / 100,
    unpaid: Math.round(unpaid * 100) / 100,
    byMonth,
    topClients,
    orderCount: orders.length,
  });
}
