import { Task, Delivery, Garment, Invoice } from './models';
import {
  genDeliveryNumber,
  genInvoiceNumber,
  defaultPickupDate,
  estimateWeight,
  garmentLifecycle,
  CATALOG,
} from './catalog';
import { suggestIroner } from './machines';

/**
 * Après création d'une commande :
 * 1. Tâches lavage / séchage / repassage / pliage
 * 2. Bon de livraison (J+1)
 * 3. Facture
 * 4. Incrément cycles HV si applicable
 */
export async function automateFromOrder(order) {
  const weight = estimateWeight(order.items || []);
  const tasks = [];

  tasks.push({
    orderId: order._id,
    orderNumber: order.number,
    type: 'lavage',
    label: `Lavage — ${order.number} (~${weight.toFixed(1)} kg)`,
    status: 'todo',
    machineHint: 'Lave-linge (répartition auto)',
    weightKg: weight,
  });

  tasks.push({
    orderId: order._id,
    orderNumber: order.number,
    type: 'sechage',
    label: `Séchage — ${order.number} (~${weight.toFixed(1)} kg)`,
    status: 'todo',
    machineHint: 'Séchoir (répartition auto)',
    weightKg: weight,
  });

  const needsIron = (order.items || []).some((i) => i.needsIron);
  const needsFold = (order.items || []).some((i) => i.needsFold);

  if (needsIron) {
    const sample = (order.items || []).find((i) => i.needsIron);
    const hint = suggestIroner(sample?.name || '');
    tasks.push({
      orderId: order._id,
      orderNumber: order.number,
      type: 'repassage',
      label: `Repassage — ${order.number}`,
      status: 'todo',
      machineHint: hint,
      weightKg: weight * 0.6,
    });
  }

  if (needsFold) {
    tasks.push({
      orderId: order._id,
      orderNumber: order.number,
      type: 'pliage',
      label: `Pliage Foltext — ${order.number}`,
      status: 'todo',
      machineHint: 'FOLTEXT',
      weightKg: weight * 0.5,
    });
  }

  await Task.insertMany(tasks);

  const blNumber = genDeliveryNumber();
  const scheduled = order.pickupDate ? new Date(order.pickupDate) : defaultPickupDate();

  const delivery = await Delivery.create({
    number: blNumber,
    orderId: order._id,
    orderNumber: order.number,
    clientId: order.clientId,
    clientName: order.clientName,
    address: order.deliveryAddress || {},
    status: 'planned',
    scheduledDate: scheduled,
    notes: order.notes || '',
  });

  const invNumber = genInvoiceNumber();
  const invoice = await Invoice.create({
    number: invNumber,
    clientId: order.clientId,
    clientName: order.clientName,
    clientEmail: order.clientEmail,
    orderId: order._id,
    orderNumber: order.number,
    orderIds: [order._id],
    items: order.items || [],
    address: order.deliveryAddress || {},
    total: order.total || 0,
    status: 'sent',
    notes: order.notes || '',
  });

  // HV garments
  const hvItems = (order.items || []).filter((i) => i.isHV);
  if (hvItems.length && order.clientId) {
    const garments = await Garment.find({
      clientId: order.clientId,
      status: { $ne: 'hors_service' },
    });
    for (const g of garments) {
      const match = hvItems.find((i) => {
        const cat = CATALOG.find((c) => c.sku === i.sku);
        return cat && (g.type === cat.sku || g.label?.includes(cat.name?.split(' ')[0] || ''));
      });
      if (match || hvItems.length) {
        g.washCount = (g.washCount || 0) + 1;
        const life = garmentLifecycle(g.washCount, g.maxWashes || 50);
        g.status = life.status;
        if (life.status === 'hors_service') {
          g.retiredAt = new Date();
          g.retiredReason = 'Limite de lavages atteinte';
        }
        await g.save();
      }
    }
  }

  return { tasks, delivery, invoice };
}

/** Recalcule tâches + met à jour BL et facture après édition commande */
export async function syncAfterOrderEdit(order) {
  await Task.deleteMany({ orderId: order._id, status: { $ne: 'done' } });

  const weight = estimateWeight(order.items || []);
  const tasks = [
    {
      orderId: order._id,
      orderNumber: order.number,
      type: 'lavage',
      label: `Lavage — ${order.number} (~${weight.toFixed(1)} kg)`,
      status: 'todo',
      machineHint: 'Lave-linge (répartition auto)',
      weightKg: weight,
    },
    {
      orderId: order._id,
      orderNumber: order.number,
      type: 'sechage',
      label: `Séchage — ${order.number} (~${weight.toFixed(1)} kg)`,
      status: 'todo',
      machineHint: 'Séchoir (répartition auto)',
      weightKg: weight,
    },
  ];
  if ((order.items || []).some((i) => i.needsIron)) {
    tasks.push({
      orderId: order._id,
      orderNumber: order.number,
      type: 'repassage',
      label: `Repassage — ${order.number}`,
      status: 'todo',
      machineHint: 'GIRBAU/DANUBE',
      weightKg: weight * 0.6,
    });
  }
  if ((order.items || []).some((i) => i.needsFold)) {
    tasks.push({
      orderId: order._id,
      orderNumber: order.number,
      type: 'pliage',
      label: `Pliage Foltext — ${order.number}`,
      status: 'todo',
      machineHint: 'FOLTEXT',
      weightKg: weight * 0.5,
    });
  }
  await Task.insertMany(tasks);

  await Delivery.updateMany(
    { orderId: order._id, status: { $nin: ['delivered', 'cancelled'] } },
    {
      $set: {
        address: order.deliveryAddress || {},
        clientName: order.clientName,
        notes: order.notes || '',
        scheduledDate: order.pickupDate || defaultPickupDate(),
      },
    }
  );

  await Invoice.updateMany(
    { orderId: order._id, status: { $ne: 'paid' } },
    {
      $set: {
        items: order.items || [],
        total: order.total || 0,
        address: order.deliveryAddress || {},
        notes: order.notes || '',
      },
    }
  );

  return { ok: true };
}
