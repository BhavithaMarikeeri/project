import type { HouseData, SunlightData } from '../types';

// Sun position (approximate)
function solarDeclination(month: number): number {
  // month 0-11 → degrees
  return 23.45 * Math.sin((2 * Math.PI / 12) * (month - 3));
}

function sunElevation(hour: number, month: number, lat = 20): number {
  // Simplified solar elevation for lat ~20°N (India average)
  const decl = solarDeclination(month);
  const hourAngle = (hour - 12) * 15; // degrees
  const sinElev = Math.sin(lat * Math.PI / 180) * Math.sin(decl * Math.PI / 180)
    + Math.cos(lat * Math.PI / 180) * Math.cos(decl * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180);
  return Math.max(0, Math.asin(sinElev) * 180 / Math.PI);
}

function sunAzimuth(hour: number): number {
  // East=90, South=180, West=270, North=0/360
  return ((hour - 6) / 12) * 180 + 90;
}

export function simulateSunlight(house: HouseData, hour: number, month: number): SunlightData {
  const elevation = sunElevation(hour, month);
  const azimuth   = sunAzimuth(hour);
  const northDeg  = house.orientation.northDeg;

  // Sun direction vector (XZ plane = floor, Y = up)
  const sunDir = {
    x: Math.sin((azimuth - northDeg) * Math.PI / 180),
    z: Math.cos((azimuth - northDeg) * Math.PI / 180),
    y: Math.tan(elevation * Math.PI / 180),
  };

  const rooms = house.rooms.map(room => {
    const openings = house.openings.filter(o => o.roomId === room.id && o.type === 'window');
    if (openings.length === 0 || elevation <= 0) {
      return { roomId: room.id, daylightPct: 0, lux: elevation > 0 ? 150 : 0 };
    }

    let contribution = 0;
    for (const win of openings) {
      // Normal of window face
      let nx = 0, nz = 0;
      if (win.side === 'top')    nz = -1;
      if (win.side === 'bottom') nz =  1;
      if (win.side === 'left')   nx = -1;
      if (win.side === 'right')  nx =  1;

      // Dot product with sun direction
      const dot = nx * sunDir.x + nz * sunDir.z;
      if (dot > 0) {
        contribution += dot * win.widthPct * Math.sin(elevation * Math.PI / 180);
      }
    }

    const daylightPct = Math.min(100, Math.round(contribution * 100 * openings.length));
    const lux = Math.round(elevation > 0 ? 50000 * contribution * Math.sin(elevation * Math.PI / 180) : 200);

    return { roomId: room.id, daylightPct, lux };
  });

  return { hour, month, rooms, sunAzimuth: azimuth, sunElevation: elevation };
}
