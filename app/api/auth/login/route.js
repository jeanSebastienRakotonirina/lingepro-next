import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await connectDB();
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }
    const ok = await bcrypt.compare(password || '', user.password);
    if (!ok) return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });

    const token = await signToken({ sub: user._id.toString(), role: user.role });
    const res = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      },
    });
    res.cookies.set('lingepro_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
