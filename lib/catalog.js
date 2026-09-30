export const CATALOG = [
  { sku: 'DB-STD', name: 'Drap de bain', category: 'bain', unitPrice: 2.8, weightKg: 0.6, needsIron: false, needsFold: true, isHV: false },
  { sku: 'TB-STD', name: 'Tapis de bain', category: 'bain', unitPrice: 3.2, weightKg: 0.8, needsIron: false, needsFold: true, isHV: false },
  { sku: 'ST-STD', name: 'Serviette de toilette', category: 'bain', unitPrice: 1.5, weightKg: 0.25, needsIron: false, needsFold: true, isHV: false },
  { sku: 'SB-STD', name: 'Serviette de bain', category: 'bain', unitPrice: 2.2, weightKg: 0.45, needsIron: false, needsFold: true, isHV: false },
  { sku: 'TO-CAR', name: "Taie d'oreiller carrée", category: 'literie', unitPrice: 1.2, weightKg: 0.15, needsIron: true, needsFold: true, isHV: false },
  { sku: 'TO-REC', name: "Taie d'oreiller rectangulaire", category: 'literie', unitPrice: 1.3, weightKg: 0.18, needsIron: true, needsFold: true, isHV: false },
  { sku: 'DR-STD', name: 'Drap plat', category: 'literie', unitPrice: 2.5, weightKg: 0.5, needsIron: true, needsFold: true, isHV: false },
  { sku: 'DH-STD', name: 'Drap housse', category: 'literie', unitPrice: 2.8, weightKg: 0.55, needsIron: true, needsFold: true, isHV: false },
  { sku: 'HC-STD', name: 'Housse de couette', category: 'literie', unitPrice: 4.5, weightKg: 0.9, needsIron: true, needsFold: true, isHV: false },
  { sku: 'TAB-CU', name: 'Tablier cuisinier', category: 'pro', unitPrice: 2.0, weightKg: 0.35, needsIron: true, needsFold: true, isHV: false },
  { sku: 'STAB', name: 'Serviette de table', category: 'table', unitPrice: 1.0, weightKg: 0.12, needsIron: true, needsFold: true, isHV: false },
  { sku: 'NAP-STD', name: 'Nappe de table', category: 'table', unitPrice: 5.0, weightKg: 0.7, needsIron: true, needsFold: true, isHV: false },
  { sku: 'HV-GIL', name: 'Gilet haute visibilité', category: 'hv', unitPrice: 4.0, weightKg: 0.4, needsIron: false, needsFold: true, isHV: true, maxWashes: 50 },
  { sku: 'HV-PAN', name: 'Pantalon HV', category: 'hv', unitPrice: 5.5, weightKg: 0.6, needsIron: false, needsFold: true, isHV: true, maxWashes: 50 },
  { sku: 'HV-VES', name: 'Veste réfléchissante', category: 'hv', unitPrice: 6.5, weightKg: 0.7, needsIron: false, needsFold: true, isHV: true, maxWashes: 40 },
  { sku: 'HV-BAN', name: 'Bande / accessoire HV', category: 'hv', unitPrice: 2.0, weightKg: 0.1, needsIron: false, needsFold: true, isHV: true, maxWashes: 30 },
];

export function genOrderNumber() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(1000 + Math.random() * 9000);
  return `CMD-${y}${m}${day}-${r}`;
}

export function genDeliveryNumber() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(1000 + Math.random() * 9000);
  return `BL-${y}${m}${day}-${r}`;
}

export function genInvoiceNumber() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(1000 + Math.random() * 9000);
  return `FAC-${y}${m}${day}-${r}`;
}

export function genGarmentCode() {
  const r = Math.floor(10000 + Math.random() * 90000);
  return `REF-${r}`;
}

export function defaultPickupDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

export function garmentLifecycle(washCount, maxWashes) {
  const left = Math.max(0, maxWashes - washCount);
  const pct = maxWashes ? washCount / maxWashes : 0;
  if (left <= 0) return { status: 'hors_service', left, pct };
  if (pct >= 0.9 || left <= 5) return { status: 'critique', left, pct };
  if (pct >= 0.7 || left <= 15) return { status: 'attention', left, pct };
  return { status: 'ok', left, pct };
}

export function estimateWeight(items) {
  return items.reduce((s, it) => {
    const cat = CATALOG.find((c) => c.sku === it.sku);
    return s + (cat?.weightKg || 0.3) * (it.qty || 0);
  }, 0);
}
