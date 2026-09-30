export const WASHERS = [
  { id: 'L80', label: 'Lave-linge 80 kg', capacityKg: 80 },
  { id: 'L60-1', label: 'Lave-linge 60 kg #1', capacityKg: 60 },
  { id: 'L60-2', label: 'Lave-linge 60 kg #2', capacityKg: 60 },
  { id: 'L60-3', label: 'Lave-linge 60 kg #3', capacityKg: 60 },
  { id: 'L45', label: 'Lave-linge 45 kg', capacityKg: 45 },
];

export const DRYERS = [
  { id: 'S80', label: 'Séchoir 80 kg', capacityKg: 80 },
  { id: 'S60-1', label: 'Séchoir 60 kg #1', capacityKg: 60 },
  { id: 'S60-2', label: 'Séchoir 60 kg #2', capacityKg: 60 },
  { id: 'S42', label: 'Séchoir 42 kg', capacityKg: 42 },
];

export const IRONERS = [
  { id: 'GIRBAU', label: 'Girbau (draps, housses)', types: ['drap', 'housse'] },
  { id: 'DANUBE', label: 'Danube (drap housse, taies, serv. table…)', types: ['drap housse', 'taie', 'serviette de table', 'nappe'] },
  { id: 'CAL-P', label: 'Petite calandre', types: ['petit', 'finition'] },
];

export const FOLDERS = [{ id: 'FOLTEXT', label: 'Foltext (serviettes, draps bain, taies…)' }];

/** Pack items into machines largest-first */
export function packLoads(weightKg, machines) {
  const sorted = [...machines].sort((a, b) => b.capacityKg - a.capacityKg);
  let remaining = weightKg;
  const loads = [];
  while (remaining > 0.05) {
    let placed = false;
    for (const m of sorted) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, m.capacityKg);
      if (take < 1 && remaining > 0) {
        loads.push({ machine: m, kg: remaining, pct: Math.round((remaining / m.capacityKg) * 100) });
        remaining = 0;
        placed = true;
        break;
      }
      if (take >= Math.min(5, m.capacityKg * 0.15) || remaining === weightKg) {
        loads.push({ machine: m, kg: Math.round(take * 10) / 10, pct: Math.round((take / m.capacityKg) * 100) });
        remaining -= take;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const m = sorted[sorted.length - 1];
      loads.push({ machine: m, kg: Math.round(remaining * 10) / 10, pct: Math.round((remaining / m.capacityKg) * 100) });
      remaining = 0;
    }
  }
  return loads;
}

export function suggestIroner(itemName = '') {
  const n = itemName.toLowerCase();
  if (n.includes('drap') && !n.includes('housse') && !n.includes('bain')) return 'GIRBAU';
  if (n.includes('housse de couette')) return 'GIRBAU';
  if (n.includes('drap housse') || n.includes('taie') || n.includes('serviette de table') || n.includes('nappe')) return 'DANUBE';
  return 'CAL-P';
}

export const TOTAL_WASH_KG = WASHERS.reduce((s, m) => s + m.capacityKg, 0);
export const TOTAL_DRY_KG = DRYERS.reduce((s, m) => s + m.capacityKg, 0);
