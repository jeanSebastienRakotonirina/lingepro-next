import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from './db';
import { User } from './models';
import { env } from './env';

const SECRET = new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('lingepro_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;
  await connectDB();
  const user = await User.findById(payload.sub).lean();
  if (!user || user.active === false) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points || 0,
    phone: user.phone || '',
    address: user.address || { street: '', postalCode: '', city: '' },
    totpEnabled: !!user.totpEnabled,
  };
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isStaff(user) {
  return user && ['admin', 'operateur', 'livreur'].includes(user.role);
}

export function isOperateur(user) {
  return user?.role === 'operateur' || user?.role === 'admin';
}

export function canSeePrices(user) {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'client';
}

export function validatePassword(pw) {
  if (!pw || pw.length < 6) return 'Minimum 6 caractères';
  if (!/[a-z]/.test(pw)) return 'Au moins une minuscule';
  if (!/[A-Z]/.test(pw)) return 'Au moins une majuscule';
  if (!/[0-9]/.test(pw)) return 'Au moins un chiffre';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Au moins un caractère spécial';
  return null;
}
