import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/models';
import { getSession, isStaff, isAdmin } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  await connectDB();
  const tasks = await Task.find().sort({ createdAt: -1 }).limit(300).lean();
  return NextResponse.json({ tasks });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  await connectDB();
  const { id, status, machineHint } = await req.json();
  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (status) task.status = status;
  if (machineHint !== undefined) task.machineHint = machineHint;
  await task.save();
  return NextResponse.json({ task });
}

export async function POST(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const task = await Task.create(body);
  return NextResponse.json({ task }, { status: 201 });
}

export async function DELETE(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  await Task.findByIdAndDelete(searchParams.get('id'));
  return NextResponse.json({ ok: true });
}
