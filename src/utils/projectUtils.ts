import { v4 as uuidv4 } from 'uuid';
import type { Project, HouseData, FurnitureItem, Room, Opening } from '../types';

// ─── Demo seed ────────────────────────────────────────────────────────────────
export function createDemoHouse(): HouseData {
  const rooms: Room[] = [
    { id: 'r1', name: 'Living Room',   type: 'living',   x: 1,  y: 1,  width: 8, height: 6, floorMaterial: 'wood',    wallMaterial: 'paint',  ceilingHeight: 3.0 },
    { id: 'r2', name: 'Master Bedroom',type: 'bedroom',  x: 9,  y: 1,  width: 7, height: 6, floorMaterial: 'carpet',  wallMaterial: 'paint',  ceilingHeight: 2.8 },
    { id: 'r3', name: 'Kitchen',       type: 'kitchen',  x: 1,  y: 7,  width: 5, height: 5, floorMaterial: 'tile',    wallMaterial: 'tile',   ceilingHeight: 2.8 },
    { id: 'r4', name: 'Dining Room',   type: 'dining',   x: 6,  y: 7,  width: 4, height: 5, floorMaterial: 'wood',    wallMaterial: 'paint',  ceilingHeight: 2.8 },
    { id: 'r5', name: 'Bedroom 2',     type: 'bedroom',  x: 10, y: 7,  width: 6, height: 5, floorMaterial: 'carpet',  wallMaterial: 'paint',  ceilingHeight: 2.8 },
    { id: 'r6', name: 'Bathroom',      type: 'bathroom', x: 9,  y: 7,  width: 1, height: 5, floorMaterial: 'tile',    wallMaterial: 'tile',   ceilingHeight: 2.4 },
    { id: 'r7', name: 'Study',         type: 'study',    x: 1,  y: 12, width: 4, height: 4, floorMaterial: 'wood',    wallMaterial: 'paint',  ceilingHeight: 2.8 },
    { id: 'r8', name: 'Corridor',      type: 'corridor', x: 5,  y: 12, width: 3, height: 4, floorMaterial: 'tile',    wallMaterial: 'paint',  ceilingHeight: 2.8 },
    { id: 'r9', name: 'Balcony',       type: 'balcony',  x: 16, y: 1,  width: 3, height: 6, floorMaterial: 'tile',    wallMaterial: 'concrete',ceilingHeight: 2.8 },
  ];

  const openings: Opening[] = [
    { id: 'o1', roomId: 'r1', side: 'right',  offsetPct: 0.5, widthPct: 0.3, type: 'door',   isOpen: true,  connectedRoomId: 'r2' },
    { id: 'o2', roomId: 'r1', side: 'bottom', offsetPct: 0.2, widthPct: 0.2, type: 'door',   isOpen: false, connectedRoomId: 'r3' },
    { id: 'o3', roomId: 'r1', side: 'top',    offsetPct: 0.5, widthPct: 0.6, type: 'window' },
    { id: 'o4', roomId: 'r1', side: 'left',   offsetPct: 0.5, widthPct: 0.6, type: 'window' },
    { id: 'o5', roomId: 'r2', side: 'right',  offsetPct: 0.5, widthPct: 0.5, type: 'door',   isOpen: false, connectedRoomId: 'r9' },
    { id: 'o6', roomId: 'r2', side: 'top',    offsetPct: 0.5, widthPct: 0.7, type: 'window' },
    { id: 'o7', roomId: 'r3', side: 'right',  offsetPct: 0.5, widthPct: 0.3, type: 'door',   isOpen: true,  connectedRoomId: 'r4' },
    { id: 'o8', roomId: 'r3', side: 'left',   offsetPct: 0.4, widthPct: 0.5, type: 'window' },
    { id: 'o9', roomId: 'r4', side: 'right',  offsetPct: 0.5, widthPct: 0.3, type: 'door',   isOpen: false, connectedRoomId: 'r6' },
    { id:'o10', roomId: 'r5', side: 'top',    offsetPct: 0.5, widthPct: 0.6, type: 'window' },
    { id:'o11', roomId: 'r5', side: 'right',  offsetPct: 0.5, widthPct: 0.5, type: 'window' },
    { id:'o12', roomId: 'r7', side: 'left',   offsetPct: 0.5, widthPct: 0.5, type: 'window' },
    { id:'o13', roomId: 'r7', side: 'right',  offsetPct: 0.5, widthPct: 0.3, type: 'door',   isOpen: false, connectedRoomId: 'r8' },
    { id:'o14', roomId: 'r9', side: 'top',    offsetPct: 0.5, widthPct: 0.8, type: 'window' },
    { id:'o15', roomId: 'r9', side: 'right',  offsetPct: 0.5, widthPct: 0.8, type: 'window' },
  ];

  const furniture: FurnitureItem[] = [
    // Living Room
    { id: 'f1', type: 'sofa',          label: 'Sofa',           roomId: 'r1', x: 1.0, y: 1.0, width: 2.5, height: 1.0, rotation: 0   },
    { id: 'f2', type: 'coffee_table',  label: 'Coffee Table',   roomId: 'r1', x: 1.5, y: 2.5, width: 1.2, height: 0.6, rotation: 0   },
    { id: 'f3', type: 'tv',            label: 'TV',             roomId: 'r1', x: 5.0, y: 0.2, width: 1.5, height: 0.2, rotation: 0   },
    { id: 'f4', type: 'plant',         label: 'Plant',          roomId: 'r1', x: 6.5, y: 4.5, width: 0.5, height: 0.5, rotation: 0   },
    // Master Bedroom
    { id: 'f5', type: 'bed',           label: 'King Bed',       roomId: 'r2', x: 1.5, y: 1.0, width: 2.0, height: 2.2, rotation: 0   },
    { id: 'f6', type: 'nightstand',    label: 'Nightstand',     roomId: 'r2', x: 0.2, y: 1.0, width: 0.5, height: 0.5, rotation: 0   },
    { id: 'f7', type: 'wardrobe',      label: 'Wardrobe',       roomId: 'r2', x: 4.5, y: 0.3, width: 2.0, height: 0.6, rotation: 0   },
    // Kitchen
    { id: 'f8', type: 'kitchen_counter', label: 'Counter',      roomId: 'r3', x: 0.2, y: 0.2, width: 3.0, height: 0.6, rotation: 0   },
    { id: 'f9', type: 'stove',         label: 'Stove',          roomId: 'r3', x: 3.3, y: 0.2, width: 0.8, height: 0.6, rotation: 0   },
    { id:'f10', type: 'refrigerator',  label: 'Refrigerator',   roomId: 'r3', x: 0.2, y: 3.3, width: 0.8, height: 0.8, rotation: 0   },
    // Dining
    { id:'f11', type: 'dining_table',  label: 'Dining Table',   roomId: 'r4', x: 0.8, y: 0.8, width: 2.0, height: 1.2, rotation: 0   },
    { id:'f12', type: 'dining_chair',  label: 'Chair',          roomId: 'r4', x: 0.3, y: 1.0, width: 0.5, height: 0.5, rotation: 90  },
    { id:'f13', type: 'dining_chair',  label: 'Chair',          roomId: 'r4', x: 3.0, y: 1.0, width: 0.5, height: 0.5, rotation: 270 },
    // Bedroom 2
    { id:'f14', type: 'bed',           label: 'Twin Bed',       roomId: 'r5', x: 0.5, y: 0.5, width: 1.6, height: 2.0, rotation: 0   },
    { id:'f15', type: 'desk',          label: 'Desk',           roomId: 'r5', x: 3.5, y: 0.3, width: 1.4, height: 0.7, rotation: 0   },
    { id:'f16', type: 'chair',         label: 'Chair',          roomId: 'r5', x: 3.8, y: 1.1, width: 0.6, height: 0.6, rotation: 180 },
    // Bathroom
    { id:'f17', type: 'bathtub',       label: 'Bathtub',        roomId: 'r6', x: 0.05,y: 0.5, width: 0.8, height: 1.8, rotation: 0   },
    { id:'f18', type: 'toilet',        label: 'Toilet',         roomId: 'r6', x: 0.1, y: 2.6, width: 0.6, height: 0.8, rotation: 0   },
    { id:'f19', type: 'sink',          label: 'Sink',           roomId: 'r6', x: 0.1, y: 3.8, width: 0.6, height: 0.5, rotation: 0   },
    // Study
    { id:'f20', type: 'desk',          label: 'Study Desk',     roomId: 'r7', x: 0.3, y: 0.3, width: 1.6, height: 0.7, rotation: 0   },
    { id:'f21', type: 'chair',         label: 'Study Chair',    roomId: 'r7', x: 0.7, y: 1.1, width: 0.6, height: 0.6, rotation: 180 },
    { id:'f22', type: 'bookshelf',     label: 'Bookshelf',      roomId: 'r7', x: 2.5, y: 0.2, width: 1.2, height: 0.4, rotation: 0   },
  ];

  return {
    rooms,
    openings,
    furniture,
    gridSize: 60,
    orientation: { northDeg: 0 },
  };
}

export function createEmptyHouse(): HouseData {
  return {
    rooms: [],
    openings: [],
    furniture: [],
    gridSize: 60,
    orientation: { northDeg: 0 },
  };
}

export function createNewProject(name: string, useDemo = false): Project {
  const now = Date.now();
  return {
    id: uuidv4(),
    name,
    createdAt: now,
    updatedAt: now,
    house: useDemo ? createDemoHouse() : createEmptyHouse(),
    versions: [],
    budget: 5000000,
  };
}

export function calcRoomAreaSqft(room: Room): number {
  const G = 0.3048; // 1 grid unit = 1 foot
  return room.width * room.height; // grid units = feet²
}

export function calcTotalArea(house: HouseData): number {
  return house.rooms.reduce((s, r) => s + calcRoomAreaSqft(r), 0);
}

export function cloneHouseData(h: HouseData): HouseData {
  return JSON.parse(JSON.stringify(h));
}
