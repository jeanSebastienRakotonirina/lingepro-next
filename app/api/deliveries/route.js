import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Delivery, Order } from '@/lib/models';
import { getSession, isStaff, isAdmin } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  let filter = {};
  if (session.role === 'client') filter.clientId = session.id;
  if (session.role === 'livreur') filter.$or = [{ driverId: session.id }, { driverId: null }, { status: { $in: ['planned', 'in_transit'] } }];
  const deliveries = await Delivery.find(filter).sort({ scheduledDate: -1 }).limit(200).lean();
  return NextResponse.json({ deliveries });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const d = await Delivery.findById(body.id);
  if (!d) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (body.status) {
    d.status = body.status;
    if (body.status === 'delivered') {
      d.deliveredAt = new Date();
      await Order.findByIdAndUpdate(d.orderId, { status: 'delivered' });
    }
  }
  if (body.driverId !== undefined) d.driverId = body.driverId || null;
  if (body.notes !== undefined) d.notes = body.notes;
  if (body.address) d.address = body.address;
  if (body.scheduledDate) d.scheduledDate = new Date(body.scheduledDate);
  await d.save();
  return NextResponse.json({ delivery: d });
}

export async function DELETE(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  await Delivery.findByIdAndDelete(searchParams.get('id'));
  return NextResponse.json({ ok: true });
}
