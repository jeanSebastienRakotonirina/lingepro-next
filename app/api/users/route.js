import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { getSession, isAdmin, isStaff, validatePassword } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  await connectDB();
  const users = await User.find().select('-password -totpSecret').sort({ name: 1 }).lean();
  return NextResponse.json({ users });
}

export async function POST(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const err = validatePassword(body.password);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const hash = await bcrypt.hash(body.password, 10);
  try {
    const user = await User.create({
      name: body.name,
      email: (body.email || '').toLowerCase(),
      password: hash,
      role: body.role || 'client',
      phone: body.phone || '',
      address: {
        street: body.address?.street || '',
        postalCode: body.address?.postalCode || '',
        city: body.address?.city || '',
      },
      active: body.active !== false,
    });
    const u = user.toObject();
    delete u.password;
    return NextResponse.json({ user: u }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.code === 11000 ? 'Email déjà utilisé' : e.message }, { status: 400 });
  }
}

export async function PATCH(req) {
  const session = await getSession();
  await connectDB();
  const body = await req.json();

  // client or admin can update own profile address
  if (body.id === session?.id || isAdmin(session)) {
    if (!isAdmin(session) && body.id !== session.id) {
      return NextResponse.json({ error: 'Interdit' }, { status: 403 });
    }
    if (!isAdmin(session) && body.id === session.id) {
      // self: only address/phone/name
      const user = await User.findById(body.id);
      if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
      if (body.name) user.name = body.name;
      if (body.phone !== undefined) user.phone = body.phone;
      if (body.address) {
        user.address = {
          street: body.address.street || '',
          postalCode: body.address.postalCode || '',
          city: body.address.city || '',
        };
      }
      await user.save();
      const u = user.toObject();
      delete u.password;
      return NextResponse.json({ user: u });
    }
  }

  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  const user = await User.findById(body.id);
  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (body.name) user.name = body.name;
  if (body.email) user.email = body.email.toLowerCase();
  if (body.role) user.role = body.role;
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.active !== undefined) user.active = body.active;
  if (body.address) {
    user.address = {
      street: body.address.street || '',
      postalCode: body.address.postalCode || '',
      city: body.address.city || '',
    };
  }
  if (body.password) {
    const err = validatePassword(body.password);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    user.password = await bcrypt.hash(body.password, 10);
  }
  await user.save();
  const u = user.toObject();
  delete u.password;
  return NextResponse.json({ user: u });
}

export async function DELETE(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id === session.id) return NextResponse.json({ error: 'Impossible de se supprimer' }, { status: 400 });
  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
