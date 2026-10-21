// ============================================================
// AI FUTURE HOME — Core Type Definitions
// ============================================================

export type RoomType =
  | 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'dining'
  | 'study' | 'garage' | 'corridor' | 'balcony' | 'storage';

export type FurnitureType =
  | 'sofa' | 'bed' | 'table' | 'chair' | 'desk' | 'wardrobe'
  | 'tv' | 'bookshelf' | 'dining_table' | 'dining_chair'
  | 'bathtub' | 'toilet' | 'sink' | 'refrigerator' | 'stove'
  | 'kitchen_counter' | 'coffee_table' | 'nightstand' | 'dresser'
  | 'plant' | 'lamp';

export type WallSide = 'top' | 'bottom' | 'left' | 'right';
export type OpeningType = 'door' | 'window';

export interface Point2D { x: number; y: number; }

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number;       // grid units
  y: number;
  width: number;
  height: number;
  color?: string;
  floorMaterial?: string;
  wallMaterial?: string;
  ceilingHeight?: number; // meters, default 2.8
}

export interface Opening {
  id: string;
  roomId: string;
  side: WallSide;
  offsetPct: number;  // 0..1 along wall
  widthPct: number;   // fraction of wall
  type: OpeningType;
  isOpen?: boolean;   // doors only
  connectedRoomId?: string;
}

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  label: string;
  roomId: string;
  x: number;      // grid units, relative to room origin
  y: number;
  width: number;
  height: number; // footprint depth
  rotation: number; // degrees
  color?: string;
}

export interface HouseOrientation {
  northDeg: number;  // 0-359, where north faces
}

export interface HouseData {
  rooms: Room[];
  openings: Opening[];
  furniture: FurnitureItem[];
  gridSize: number;  // pixels per grid unit
  orientation: HouseOrientation;
}

export interface ProjectVersion {
  id: string;
  timestamp: number;
  label: string;
  house: HouseData;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  house: HouseData;
  versions: ProjectVersion[];
  budget?: number;  // INR
  notes?: string;
}

// ---- Analysis ----
export interface RoomAnalysis {
  roomId: string;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

export interface DesignAnalysis {
  overallScore: number;
  rooms: RoomAnalysis[];
  globalIssues: string[];
  globalSuggestions: string[];
  spacingScore: number;
  accessibilityScore: number;
  connectivityScore: number;
  lightingScore: number;
}

// ---- Cost ----
export interface CostCategory {
  name: string;
  amount: number;
  unit: string;
  quantity: number;
}

export interface CostEstimate {
  total: number;
  categories: CostCategory[];
  currency: 'INR';
  perSqft: number;
  area: number; // sq ft
}

// ---- Sunlight ----
export interface SunlightData {
  hour: number;       // 0-23
  month: number;      // 0-11
  rooms: { roomId: string; daylightPct: number; lux: number }[];
  sunAzimuth: number; // degrees
  sunElevation: number;
}

// ---- Simulation ----
export type SimScenarioType =
  | 'resize_room' | 'rearrange_furniture' | 'relocate_window'
  | 'improve_study' | 'modify_layout';

export interface SimScenario {
  id: string;
  type: SimScenarioType;
  title: string;
  description: string;
  targetRoomId?: string;
  params: Record<string, unknown>;
}

export interface SimResult {
  scenario: SimScenario;
  original: HouseData;
  proposed: HouseData;
  originalAnalysis: DesignAnalysis;
  proposedAnalysis: DesignAnalysis;
  originalCost: CostEstimate;
  proposedCost: CostEstimate;
  applied: boolean;
}
