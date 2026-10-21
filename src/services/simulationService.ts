import { v4 as uuidv4 } from 'uuid';
import type { HouseData, SimScenario, SimResult, SimScenarioType } from '../types';
import { analyzeDesign } from './analysisService';
import { estimateCost } from './costService';
import { cloneHouseData } from '../utils/projectUtils';

export function getScenarios(house: HouseData): SimScenario[] {
  const scenarios: SimScenario[] = [];

  // 1. Resize largest room
  const largest = [...house.rooms].sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
  if (largest) {
    scenarios.push({
      id: uuidv4(),
      type: 'resize_room' as SimScenarioType,
      title: `Expand "${largest.name}"`,
      description: `Increase the width of ${largest.name} by 2 units to improve spaciousness`,
      targetRoomId: largest.id,
      params: { dx: 2, dy: 0 },
    });
  }

  // 2. Rearrange furniture
  const room = house.rooms.find(r => r.type === 'living' || r.type === 'bedroom');
  if (room) {
    scenarios.push({
      id: uuidv4(),
      type: 'rearrange_furniture' as SimScenarioType,
      title: `Optimize "${room.name}" Layout`,
      description: `Move furniture away from doors to clear pathways and improve traffic flow`,
      targetRoomId: room.id,
      params: {},
    });
  }

  // 3. Relocate window
  const noWindowRoom = house.rooms.find(r =>
    !house.openings.some(o => o.roomId === r.id && o.type === 'window')
  );
  if (noWindowRoom) {
    scenarios.push({
      id: uuidv4(),
      type: 'relocate_window' as SimScenarioType,
      title: `Add Window to "${noWindowRoom.name}"`,
      description: `Install a window on the north wall to improve natural lighting`,
      targetRoomId: noWindowRoom.id,
      params: {},
    });
  }

  // 4. Improve study
  const study = house.rooms.find(r => r.type === 'study');
  if (study) {
    scenarios.push({
      id: uuidv4(),
      type: 'improve_study' as SimScenarioType,
      title: 'Improve Study Room',
      description: 'Add bookshelf and optimize desk position for ergonomics and daylight',
      targetRoomId: study.id,
      params: {},
    });
  }

  // 5. Open layout
  scenarios.push({
    id: uuidv4(),
    type: 'modify_layout' as SimScenarioType,
    title: 'Open-Plan Kitchen-Dining',
    description: 'Merge kitchen and dining room for a modern open-plan layout',
    params: {},
  });

  return scenarios;
}

export function runSimulation(house: HouseData, scenario: SimScenario): SimResult {
  const original = cloneHouseData(house);
  const proposed = cloneHouseData(house);

  switch (scenario.type) {
    case 'resize_room': {
      const room = proposed.rooms.find(r => r.id === scenario.targetRoomId);
      if (room) {
        const { dx = 0, dy = 0 } = scenario.params as { dx: number; dy: number };
        room.width  = Math.max(3, room.width  + dx);
        room.height = Math.max(3, room.height + dy);
      }
      break;
    }
    case 'rearrange_furniture': {
      // Shift furniture toward room center (away from doors)
      const room = proposed.rooms.find(r => r.id === scenario.targetRoomId);
      if (room) {
        const cx = room.width / 2, cy = room.height / 2;
        proposed.furniture = proposed.furniture.map(f => {
          if (f.roomId !== room.id) return f;
          const nx = f.x + (cx - f.x - f.width / 2) * 0.3;
          const ny = f.y + (cy - f.y - f.height / 2) * 0.3;
          return { ...f, x: Math.max(0.2, nx), y: Math.max(0.2, ny) };
        });
      }
      break;
    }
    case 'relocate_window': {
      if (scenario.targetRoomId) {
        proposed.openings.push({
          id: uuidv4(),
          roomId: scenario.targetRoomId,
          side: 'top',
          offsetPct: 0.5,
          widthPct: 0.4,
          type: 'window',
        });
      }
      break;
    }
    case 'improve_study': {
      const study = proposed.rooms.find(r => r.id === scenario.targetRoomId);
      if (study) {
        // Add bookshelf if not present
        if (!proposed.furniture.some(f => f.roomId === study.id && f.type === 'bookshelf')) {
          proposed.furniture.push({
            id: uuidv4(), type: 'bookshelf', label: 'Bookshelf', roomId: study.id,
            x: study.width - 1.6, y: 0.2, width: 1.2, height: 0.4, rotation: 0,
          });
        }
        // Move desk toward window side
        const desk = proposed.furniture.find(f => f.roomId === study.id && f.type === 'desk');
        if (desk) { desk.x = 0.3; desk.y = 0.3; }
        // Add window if missing
        if (!proposed.openings.some(o => o.roomId === study.id && o.type === 'window')) {
          proposed.openings.push({
            id: uuidv4(), roomId: study.id, side: 'top',
            offsetPct: 0.5, widthPct: 0.5, type: 'window',
          });
        }
      }
      break;
    }
    case 'modify_layout': {
      const kitchen = proposed.rooms.find(r => r.type === 'kitchen');
      const dining  = proposed.rooms.find(r => r.type === 'dining');
      if (kitchen && dining) {
        kitchen.width  = Math.max(kitchen.width, kitchen.width + dining.width);
        kitchen.name   = 'Open Kitchen & Dining';
        kitchen.type   = 'kitchen';
        // Remove the dining room
        proposed.rooms     = proposed.rooms.filter(r => r.id !== dining.id);
        proposed.openings  = proposed.openings.filter(o => o.roomId !== dining.id);
        proposed.furniture = proposed.furniture.map(f =>
          f.roomId === dining.id ? { ...f, roomId: kitchen.id } : f
        );
      }
      break;
    }
  }

  return {
    scenario,
    original,
    proposed,
    originalAnalysis: analyzeDesign(original),
    proposedAnalysis: analyzeDesign(proposed),
    originalCost: estimateCost(original),
    proposedCost:  estimateCost(proposed),
    applied: false,
  };
}
