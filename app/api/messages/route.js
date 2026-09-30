import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Message } from '@/lib/models';
import { getSession, isStaff } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  let filter = {};
  if (session.role === 'client') filter.fromId = session.id;
  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ messages });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 });
  const msg = await Message.create({
    fromId: session.id,
    fromName: session.name,
    toRole: session.role === 'client' ? 'staff' : 'client',
    body: body.trim(),
  });
  return NextResponse.json({ message: msg }, { status: 201 });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  await connectDB();
  const { id, read } = await req.json();
  await Message.findByIdAndUpdate(id, { read: !!read });
  return NextResponse.json({ ok: true });
}
