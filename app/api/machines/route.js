import { NextResponse } from 'next/server';
import { getSession, isStaff } from '@/lib/auth';
import { WASHERS, DRYERS, IRONERS, FOLDERS, packLoads, TOTAL_WASH_KG, TOTAL_DRY_KG } from '@/lib/machines';
import { connectDB } from '@/lib/db';
import { Order, Task } from '@/lib/models';
import { estimateWeight } from '@/lib/catalog';

export async function GET(req) {
  const session = await getSession();
  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('plan');

  const base = {
    washers: WASHERS,
    dryers: DRYERS,
    ironers: IRONERS,
    folders: FOLDERS,
    totalWashKg: TOTAL_WASH_KG,
    totalDryKg: TOTAL_DRY_KG,
  };

  if (orderNumber) {
    const order = await Order.findOne({ number: orderNumber });
    if (!order) return NextResponse.json({ error: 'Commande introuvable', ...base }, { status: 404 });
    const weight = estimateWeight(order.items);
    const washLoads = packLoads(weight, WASHERS);
    const dryLoads = packLoads(weight, DRYERS);
    const tasks = await Task.find({ orderId: order._id }).lean();
    return NextResponse.json({
      ...base,
      plan: { orderNumber, weightKg: weight, washLoads, dryLoads, tasks },
    });
  }

  const openTasks = await Task.find({ status: { $ne: 'done' } }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ ...base, openTasks });
}
