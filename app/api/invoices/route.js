import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Invoice } from '@/lib/models';
import { getSession, isAdmin, isStaff, canSeePrices } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const filter = session.role === 'client' ? { clientId: session.id } : {};
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  if (!canSeePrices(session)) {
    return NextResponse.json({
      invoices: invoices.map((i) => {
        const { total, items, ...rest } = i;
        return {
          ...rest,
          items: (items || []).map(({ unitPrice, lineTotal, ...r }) => r),
        };
      }),
    });
  }
  return NextResponse.json({ invoices });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const inv = await Invoice.findById(body.id);
  if (!inv) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (body.status) inv.status = body.status;
  if (body.notes !== undefined) inv.notes = body.notes;
  await inv.save();
  return NextResponse.json({ invoice: inv });
}

export async function DELETE(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  await Invoice.findByIdAndDelete(searchParams.get('id'));
  return NextResponse.json({ ok: true });
}
