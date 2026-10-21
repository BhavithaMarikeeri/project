import type { HouseData, DesignAnalysis, RoomAnalysis } from '../types';

// Clearance thresholds (grid units = feet)
const MIN_ROOM_SIZE_SQF = 40;
const MIN_CLEARANCE = 3; // feet

export function analyzeDesign(house: HouseData): DesignAnalysis {
  const roomAnalyses: RoomAnalysis[] = house.rooms.map(room => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const area = room.width * room.height;
    if (area < MIN_ROOM_SIZE_SQF) {
      issues.push(`Room is very small (${area.toFixed(0)} sq ft, min ${MIN_ROOM_SIZE_SQF} sq ft)`);
      score -= 20;
    }

    const roomFurniture = house.furniture.filter(f => f.roomId === room.id);
    const roomOpenings = house.openings.filter(o => o.roomId === room.id);

    // Check door clearance
    for (const opening of roomOpenings) {
      if (opening.type !== 'door') continue;
      for (const furn of roomFurniture) {
        const wallX1 = room.x, wallX2 = room.x + room.width;
        const wallY1 = room.y, wallY2 = room.y + room.height;
        let doorX: number, doorY: number;
        if (opening.side === 'left') { doorX = wallX1; doorY = room.y + room.height * opening.offsetPct; }
        else if (opening.side === 'right') { doorX = wallX2; doorY = room.y + room.height * opening.offsetPct; }
        else if (opening.side === 'top') { doorX = room.x + room.width * opening.offsetPct; doorY = wallY1; }
        else { doorX = room.x + room.width * opening.offsetPct; doorY = wallY2; }
        const absX = room.x + furn.x;
        const absY = room.y + furn.y;
        const dist = Math.sqrt((absX - doorX) ** 2 + (absY - doorY) ** 2);
        if (dist < MIN_CLEARANCE) {
          issues.push(`Furniture "${furn.label}" may block the door`);
          score -= 10;
        }
      }
    }

    // Room-type specific checks
    if (room.type === 'bedroom' && roomFurniture.find(f => f.type === 'bed') === undefined) {
      suggestions.push('Consider adding a bed');
    }
    if (room.type === 'bathroom' && roomFurniture.find(f => f.type === 'toilet') === undefined) {
      issues.push('No toilet in bathroom');
      score -= 15;
    }
    if (room.type === 'kitchen' && roomFurniture.find(f => f.type === 'stove') === undefined) {
      suggestions.push('Consider adding a stove');
    }
    if (room.type === 'study' && roomFurniture.find(f => f.type === 'desk') === undefined) {
      suggestions.push('Add a desk for the study room');
    }

    // Window check
    const hasWindow = roomOpenings.some(o => o.type === 'window');
    if (!hasWindow) {
      issues.push('No window — poor natural light & ventilation');
      score -= 15;
    }

    // Overcrowding
    const furnitureArea = roomFurniture.reduce((s, f) => s + f.width * f.height, 0);
    const utilizationPct = (furnitureArea / area) * 100;
    if (utilizationPct > 60) {
      issues.push(`Room is overcrowded (${utilizationPct.toFixed(0)}% occupied by furniture)`);
      score -= 10;
    } else if (utilizationPct < 10 && area > 100) {
      suggestions.push('Room feels sparse — consider adding furniture');
    }

    return { roomId: room.id, score: Math.max(0, score), issues, suggestions };
  });

  const globalIssues: string[] = [];
  const globalSuggestions: string[] = [];

  // Connectivity: every room should have at least one door opening
  for (const room of house.rooms) {
    const hasDoor = house.openings.some(o => o.roomId === room.id && o.type === 'door');
    if (!hasDoor) {
      globalIssues.push(`"${room.name}" has no door`);
    }
  }

  // Bathroom proximity
  const hasBath = house.rooms.some(r => r.type === 'bathroom');
  if (!hasBath) globalSuggestions.push('Add at least one bathroom');

  // Average sub-scores
  const avgRoom = roomAnalyses.length
    ? roomAnalyses.reduce((s, r) => s + r.score, 0) / roomAnalyses.length
    : 100;

  const windowedRooms = house.rooms.filter(r =>
    house.openings.some(o => o.roomId === r.id && o.type === 'window')
  ).length;
  const lightingScore = house.rooms.length
    ? Math.round((windowedRooms / house.rooms.length) * 100)
    : 100;

  const dooredRooms = house.rooms.filter(r =>
    house.openings.some(o => o.roomId === r.id && o.type === 'door')
  ).length;
  const connectivityScore = house.rooms.length
    ? Math.round((dooredRooms / house.rooms.length) * 100)
    : 100;

  const totalArea = house.rooms.reduce((s, r) => s + r.width * r.height, 0);
  const furnitureArea = house.furniture.reduce((s, f) => s + f.width * f.height, 0);
  const spacingScore = totalArea > 0 ? Math.max(0, Math.round(100 - (furnitureArea / totalArea) * 100)) : 100;

  const accessibilityScore = Math.max(0, 100 - globalIssues.length * 10);
  const overallScore = Math.round((avgRoom + lightingScore + connectivityScore + spacingScore + accessibilityScore) / 5);

  return {
    overallScore,
    rooms: roomAnalyses,
    globalIssues,
    globalSuggestions,
    spacingScore,
    accessibilityScore,
    connectivityScore,
    lightingScore,
  };
}
