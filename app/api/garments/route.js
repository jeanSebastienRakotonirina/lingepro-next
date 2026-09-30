import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Garment, User } from '@/lib/models';
import { getSession, isStaff, isAdmin } from '@/lib/auth';
import { genGarmentCode, garmentLifecycle } from '@/lib/catalog';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const filter = session.role === 'client' ? { clientId: session.id } : {};
  const garments = await Garment.find(filter).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ garments });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  let clientId = session.id;
  let clientName = session.name;
  if (isStaff(session) && body.clientId) {
    const u = await User.findById(body.clientId);
    if (u) {
      clientId = u._id;
      clientName = u.name;
    }
  }
  const maxWashes = body.maxWashes || 50;
  const g = await Garment.create({
    code: genGarmentCode(),
    clientId,
    clientName,
    type: body.type || 'HV',
    label: body.label || 'Gilet HV',
    maxWashes,
    washCount: body.washCount || 0,
    status: garmentLifecycle(body.washCount || 0, maxWashes).status,
    notes: body.notes || '',
  });
  return NextResponse.json({ garment: g }, { status: 201 });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!isStaff(session) && session?.role !== 'client') {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();
  const g = await Garment.findById(body.id);
  if (!g) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (session.role === 'client' && g.clientId.toString() !== session.id) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  }
  if (body.incrementWash) {
    g.washCount = (g.washCount || 0) + 1;
  }
  if (body.washCount !== undefined && isStaff(session)) g.washCount = body.washCount;
  if (body.maxWashes && isStaff(session)) g.maxWashes = body.maxWashes;
  if (body.label) g.label = body.label;
  if (body.notes !== undefined) g.notes = body.notes;
  if (body.retire) {
    g.status = 'hors_service';
    g.retiredAt = new Date();
    g.retiredReason = body.retiredReason || 'Mise hors service manuelle';
  } else {
    const life = garmentLifecycle(g.washCount, g.maxWashes);
    g.status = life.status;
    if (life.status === 'hors_service' && !g.retiredAt) {
      g.retiredAt = new Date();
      g.retiredReason = 'Limite de lavages atteinte';
    }
  }
  await g.save();
  return NextResponse.json({ garment: g });
}

export async function DELETE(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  await Garment.findByIdAndDelete(searchParams.get('id'));
  return NextResponse.json({ ok: true });
}
