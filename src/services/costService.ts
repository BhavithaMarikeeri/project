import type { HouseData, CostEstimate, CostCategory } from '../types';

// INR rates per sq ft
const RATES = {
  floorWood:      1200,
  floorTile:       800,
  floorCarpet:     600,
  floorConcrete:   400,
  wallPaint:       120,
  wallTile:        300,
  wallConcrete:    180,
  ceiling:         200,
  door:         15000,  // per door
  window:        8000,  // per window
  // Furniture (rough INR estimates)
  sofa:         35000,
  bed:          25000,
  table:        12000,
  chair:         6000,
  desk:         15000,
  wardrobe:     30000,
  tv:           40000,
  bookshelf:    10000,
  dining_table: 20000,
  dining_chair:  5000,
  bathtub:      45000,
  toilet:       12000,
  sink:          8000,
  refrigerator: 35000,
  stove:        20000,
  kitchen_counter: 30000,
  coffee_table:  8000,
  nightstand:    6000,
  dresser:      18000,
  plant:         2000,
  lamp:          3000,
  // Per sq ft finishes
  lighting:       150, // per sq ft per room
  electrical:     200,
  plumbing:       350,
} as const;

export function estimateCost(house: HouseData): CostEstimate {
  const categories: CostCategory[] = [];
  let total = 0;

  let flooringCost = 0, wallCost = 0, ceilingCost = 0;
  const totalArea = house.rooms.reduce((s, r) => s + r.width * r.height, 0);

  for (const room of house.rooms) {
    const area = room.width * room.height;
    const perimeter = 2 * (room.width + room.height);
    const ch = room.ceilingHeight ?? 2.8;
    const wallAreaSqFt = perimeter * (ch * 3.281); // m to ft

    // Floor
    const floorRate = room.floorMaterial === 'wood'   ? RATES.floorWood
                    : room.floorMaterial === 'tile'   ? RATES.floorTile
                    : room.floorMaterial === 'carpet' ? RATES.floorCarpet
                    : RATES.floorConcrete;
    flooringCost += area * floorRate;

    // Walls
    const wallRate = room.wallMaterial === 'tile'    ? RATES.wallTile
                   : room.wallMaterial === 'concrete'? RATES.wallConcrete
                   : RATES.wallPaint;
    wallCost += wallAreaSqFt * wallRate;

    // Ceiling
    ceilingCost += area * RATES.ceiling;
  }

  categories.push({ name: 'Flooring',  amount: flooringCost, unit: 'per sq ft', quantity: totalArea });
  categories.push({ name: 'Wall Finish', amount: wallCost,   unit: 'per sq ft', quantity: totalArea });
  categories.push({ name: 'Ceiling',   amount: ceilingCost,  unit: 'per sq ft', quantity: totalArea });
  total += flooringCost + wallCost + ceilingCost;

  // Doors & Windows
  const doors   = house.openings.filter(o => o.type === 'door');
  const windows = house.openings.filter(o => o.type === 'window');
  const doorCost   = doors.length * RATES.door;
  const windowCost = windows.length * RATES.window;
  categories.push({ name: 'Doors',   amount: doorCost,   unit: 'per door',   quantity: doors.length });
  categories.push({ name: 'Windows', amount: windowCost, unit: 'per window', quantity: windows.length });
  total += doorCost + windowCost;

  // Furniture
  let furnitureCost = 0;
  for (const f of house.furniture) {
    const rate = (RATES as Record<string, number>)[f.type] ?? 8000;
    furnitureCost += rate;
  }
  categories.push({ name: 'Furniture', amount: furnitureCost, unit: 'per item', quantity: house.furniture.length });
  total += furnitureCost;

  // MEP
  const lightingCost  = totalArea * RATES.lighting;
  const electricalCost= totalArea * RATES.electrical;
  const plumbingRooms = house.rooms.filter(r => r.type === 'bathroom' || r.type === 'kitchen');
  const plumbingCost  = plumbingRooms.reduce((s, r) => s + r.width * r.height * RATES.plumbing, 0);
  categories.push({ name: 'Lighting',    amount: lightingCost,   unit: 'per sq ft', quantity: totalArea });
  categories.push({ name: 'Electrical',  amount: electricalCost, unit: 'per sq ft', quantity: totalArea });
  categories.push({ name: 'Plumbing',    amount: plumbingCost,   unit: 'per sq ft', quantity: plumbingRooms.reduce((s,r)=>s+r.width*r.height,0) });
  total += lightingCost + electricalCost + plumbingCost;

  // Structural (10% of built area at ₹2500/sqft)
  const structuralCost = totalArea * 2500;
  categories.push({ name: 'Structure & Civil', amount: structuralCost, unit: 'per sq ft', quantity: totalArea });
  total += structuralCost;

  return {
    total,
    categories,
    currency: 'INR',
    perSqft: totalArea > 0 ? Math.round(total / totalArea) : 0,
    area: totalArea,
  };
}

export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}
