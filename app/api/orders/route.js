import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, User, Task, Delivery, Invoice } from '@/lib/models';
import { getSession, isAdmin, isStaff, canSeePrices } from '@/lib/auth';
import { CATALOG, genOrderNumber, defaultPickupDate } from '@/lib/catalog';
import { automateFromOrder, syncAfterOrderEdit } from '@/lib/automation';

function stripPrices(order) {
  const o = typeof order.toObject === 'function' ? order.toObject() : { ...order };
  delete o.total;
  if (o.items) o.items = o.items.map(({ unitPrice, lineTotal, ...rest }) => rest);
  return o;
}

function buildItems(lines) {
  const items = [];
  let total = 0;
  for (const line of lines || []) {
    const cat = CATALOG.find((c) => c.sku === line.sku);
    if (!cat || !line.qty || line.qty < 1) continue;
    const lineTotal = Math.round(cat.unitPrice * line.qty * 100) / 100;
    total += lineTotal;
    items.push({
      sku: cat.sku,
      name: cat.name,
      category: cat.category,
      qty: line.qty,
      unitPrice: cat.unitPrice,
      lineTotal,
      needsIron: cat.needsIron,
      needsFold: cat.needsFold,
      isHV: cat.isHV,
    });
  }
  return { items, total };
}

function canEditOrder(session, order) {
  if (!session || !order) return false;
  if (isAdmin(session)) return true;
  if (session.role === 'client' && order.clientId.toString() === session.id) {
    return ['pending', 'processing'].includes(order.status);
  }
  if (session.role === 'operateur' && ['pending', 'processing', 'ready'].includes(order.status)) {
    return true;
  }
  return false;
}

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    if (session.role === 'client' && order.clientId.toString() !== session.id) {
      return NextResponse.json({ error: 'Interdit' }, { status: 403 });
    }
    return NextResponse.json({ order: canSeePrices(session) ? order : stripPrices(order) });
  }

  let filter = {};
  if (session.role === 'client') filter.clientId = session.id;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const data = canSeePrices(session) ? orders : orders.map(stripPrices);
  return NextResponse.json({ orders: data });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const body = await req.json();

  let clientId = session.id;
  let client = await User.findById(session.id);
  if (isStaff(session) && body.clientId) {
    client = await User.findById(body.clientId);
    clientId = client?._id;
  }
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 400 });

  let { items, total } = buildItems(body.items);
  if (!items.length) return NextResponse.json({ error: 'Aucun article' }, { status: 400 });
  if (body.express) total = Math.round(total * 1.3 * 100) / 100;

  const addr = body.deliveryAddress || client.address || {};
  const order = await Order.create({
    number: genOrderNumber(),
    clientId,
    clientName: client.name,
    clientEmail: client.email,
    deliveryAddress: {
      street: addr.street || '',
      postalCode: addr.postalCode || '',
      city: addr.city || '',
    },
    items,
    total,
    status: 'processing',
    notes: body.notes || '',
    express: !!body.express,
    pickupDate: body.pickupDate ? new Date(body.pickupDate) : defaultPickupDate(),
  });

  const { delivery, invoice } = await automateFromOrder(order);
  order.deliveryNumber = delivery.number;
  order.invoiceNumber = invoice.number;
  await order.save();

  const out = canSeePrices(session) ? order.toObject() : stripPrices(order);
  return NextResponse.json(
    {
      order: out,
      deliveryNumber: delivery.number,
      invoiceNumber: invoice.number,
    },
    { status: 201 }
  );
}

export async function PATCH(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const order = await Order.findById(body.id);
  if (!order) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  if (body.action === 'cancel') {
    const can =
      isStaff(session) ||
      (session.role === 'client' &&
        order.clientId.toString() === session.id &&
        ['pending', 'processing'].includes(order.status));
    if (!can) return NextResponse.json({ error: 'Annulation interdite' }, { status: 403 });
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = session.name;
    await order.save();
    await Task.updateMany({ orderId: order._id }, { status: 'done' });
    await Delivery.updateMany({ orderId: order._id }, { status: 'cancelled' });
    await Invoice.updateMany({ orderId: order._id }, { status: 'cancelled' });
    return NextResponse.json({ order });
  }

  // Full edit (items, address, notes, express)
  if (body.edit === true) {
    if (!canEditOrder(session, order)) {
      return NextResponse.json({ error: 'Modification interdite pour ce statut / rôle' }, { status: 403 });
    }
    if (body.items) {
      let { items, total } = buildItems(body.items);
      if (!items.length) return NextResponse.json({ error: 'Aucun article' }, { status: 400 });
      if (body.express !== undefined ? body.express : order.express) {
        total = Math.round(total * 1.3 * 100) / 100;
      }
      order.items = items;
      order.total = total;
    }
    if (body.express !== undefined) {
      order.express = !!body.express;
      // recalculate if items not resent
      if (!body.items) {
        let t = (order.items || []).reduce((s, i) => s + (i.lineTotal || 0), 0);
        if (order.express) t = Math.round(t * 1.3 * 100) / 100;
        // rebuild from unit prices without double express
        t = (order.items || []).reduce((s, i) => s + (i.unitPrice || 0) * (i.qty || 0), 0);
        if (order.express) t = Math.round(t * 1.3 * 100) / 100;
        order.total = t;
      }
    }
    if (body.notes !== undefined) order.notes = body.notes;
    if (body.deliveryAddress) {
      order.deliveryAddress = {
        street: body.deliveryAddress.street || '',
        postalCode: body.deliveryAddress.postalCode || '',
        city: body.deliveryAddress.city || '',
      };
    }
    if (body.pickupDate) order.pickupDate = new Date(body.pickupDate);
    await order.save();
    await syncAfterOrderEdit(order);
    return NextResponse.json({
      order: canSeePrices(session) ? order : stripPrices(order),
      message: 'Commande mise à jour — tâches, BL et facture synchronisés',
    });
  }

  if (!isStaff(session)) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  if (body.status) order.status = body.status;
  if (body.notes !== undefined) order.notes = body.notes;
  if (body.deliveryAddress) order.deliveryAddress = body.deliveryAddress;
  if (body.pickupDate) order.pickupDate = new Date(body.pickupDate);
  await order.save();
  return NextResponse.json({ order: canSeePrices(session) ? order : stripPrices(order) });
}

export async function DELETE(req) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Admin uniquement' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await Task.deleteMany({ orderId: id });
  await Delivery.deleteMany({ orderId: id });
  await Invoice.deleteMany({ orderId: id });
  await Order.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
