import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import type { HouseData, Room, Opening, FurnitureItem } from '../types';
import { Sun, Moon, Lightbulb, RotateCcw } from 'lucide-react';

// ─── Material library ──────────────────────────────────────────────────────────
function makeMaterial(matName = 'paint', isFloor = false): THREE.MeshStandardMaterial {
  const opts: THREE.MeshStandardMaterialParameters = { roughness: 0.7, metalness: 0 };
  if (isFloor) {
    if (matName === 'wood')   { opts.color = 0xc19a6b; opts.roughness = 0.6; }
    else if (matName === 'tile')   { opts.color = 0xe0e0e0; opts.roughness = 0.3; }
    else if (matName === 'carpet') { opts.color = 0x8b7355; opts.roughness = 0.9; }
    else                          { opts.color = 0xaaaaaa; }
  } else {
    if (matName === 'tile')     { opts.color = 0xfafafa; opts.roughness = 0.2; }
    else if (matName === 'concrete') { opts.color = 0xaaaaaa; opts.roughness = 0.8; }
    else                        { opts.color = 0xf5f0e8; }
  }
  return new THREE.MeshStandardMaterial(opts);
}

const FURNITURE_COLORS: Record<string, number> = {
  sofa: 0x6b7280, bed: 0x7c5cbf, table: 0x8B5E3C, chair: 0x4b5563,
  desk: 0x8B5E3C, wardrobe: 0x5c4434, tv: 0x1f2937, bookshelf: 0x7B4F2E,
  dining_table: 0x8B5E3C, dining_chair: 0x4b5563, bathtub: 0xe0e0e0,
  toilet: 0xfafafa, sink: 0xe8e8e8, refrigerator: 0xd1d5db,
  stove: 0x4b5563, kitchen_counter: 0xc0c0c0, coffee_table: 0x8B5E3C,
  nightstand: 0x7c5c3a, dresser: 0x8b6a4d, plant: 0x2d6a4f, lamp: 0xfbbf24,
};

const UNIT = 1; // 1 grid unit = 1 meter (for 3D)

// ─── Scene builder ─────────────────────────────────────────────────────────────
export function buildScene(house: HouseData, scene: THREE.Scene, hour = 12) {
  // Clear everything
  while (scene.children.length > 0) scene.remove(scene.children[0]);

  // Ambient + directional (sun) light
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const sunProgress = (hour - 6) / 12;
  const sunAngle = sunProgress * Math.PI;
  const sunColor = hour < 7 || hour > 18 ? 0xff9944 : 0xfff5e0;
  const sunIntensity = Math.max(0, Math.sin(sunAngle)) * 1.8;
  const dirLight = new THREE.DirectionalLight(sunColor, sunIntensity);
  dirLight.position.set(
    Math.cos(sunAngle) * 20,
    Math.sin(sunAngle) * 20,
    10
  );
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  scene.add(dirLight);

  // Night sky / environment
  if (hour < 7 || hour > 19) {
    scene.background = new THREE.Color(0x05060a);
    const moonLight = new THREE.DirectionalLight(0x8090c0, 0.3);
    moonLight.position.set(-10, 20, 5);
    scene.add(moonLight);
  } else {
    const t = Math.min(1, (sunIntensity) / 1.8);
    scene.background = new THREE.Color().lerpColors(new THREE.Color(0x0a0f1a), new THREE.Color(0x87CEEB), t);
  }

  const CH = 2.8; // ceiling height (meters)

  for (const room of house.rooms) {
    const rx = room.x * UNIT, ry = room.y * UNIT;
    const rw = room.width * UNIT, rh = room.height * UNIT;
    const ch = (room.ceilingHeight ?? CH);

    // Floor
    const floorGeo = new THREE.BoxGeometry(rw, 0.1, rh);
    const floorMat = makeMaterial(room.floorMaterial, true);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(rx + rw / 2, -0.05, ry + rh / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceilGeo = new THREE.BoxGeometry(rw, 0.1, rh);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xfafaf5, roughness: 0.9 });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.position.set(rx + rw / 2, ch + 0.05, ry + rh / 2);
    ceil.receiveShadow = true;
    scene.add(ceil);

    const wallMat = makeMaterial(room.wallMaterial, false);
    const wallT = 0.15;

    // Openings for this room
    const roomOpenings = house.openings.filter(o => o.roomId === room.id);

    // Build walls with openings
    const sides: Array<{ side: 'top' | 'bottom' | 'left' | 'right' }> = [
      { side: 'top' }, { side: 'bottom' }, { side: 'left' }, { side: 'right' }
    ];

    for (const { side } of sides) {
      const sideOpenings = roomOpenings.filter(o => o.side === side);
      const isHoriz = side === 'top' || side === 'bottom';
      const wallLen = isHoriz ? rw : rh;
      let wallX: number, wallZ: number, wallRotY: number;

      if (side === 'top')    { wallX = rx + rw / 2; wallZ = ry;      wallRotY = 0; }
      else if (side === 'bottom') { wallX = rx + rw / 2; wallZ = ry + rh; wallRotY = 0; }
      else if (side === 'left')  { wallX = rx;          wallZ = ry + rh / 2; wallRotY = Math.PI / 2; }
      else                      { wallX = rx + rw;     wallZ = ry + rh / 2; wallRotY = Math.PI / 2; }

      if (sideOpenings.length === 0) {
        // Solid wall
        const wg = new THREE.BoxGeometry(wallLen, ch, wallT);
        const w = new THREE.Mesh(wg, wallMat.clone());
        w.position.set(wallX, ch / 2, wallZ);
        w.rotation.y = wallRotY;
        w.castShadow = true;
        w.receiveShadow = true;
        scene.add(w);
      } else {
        // Wall segments around openings
        const sorted = [...sideOpenings].sort((a, b) => a.offsetPct - b.offsetPct);
        let cursor = 0;
        const addSegment = (start: number, end: number, heightStart: number, heightEnd: number) => {
          const segLen = (end - start) * wallLen;
          if (segLen < 0.01) return;
          const segH = heightEnd - heightStart;
          const segGeo = new THREE.BoxGeometry(segLen, segH, wallT);
          const segMesh = new THREE.Mesh(segGeo, wallMat.clone());
          const offset = (start + end) / 2 * wallLen - wallLen / 2;
          const ry3 = heightStart + segH / 2;
          if (side === 'top'   ) segMesh.position.set(rx + rw / 2 + offset, ry3, ry);
          else if (side === 'bottom') segMesh.position.set(rx + rw / 2 + offset, ry3, ry + rh);
          else if (side === 'left')  { segMesh.position.set(rx, ry3, ry + rh / 2 + offset); segMesh.rotation.y = Math.PI / 2; }
          else                       { segMesh.position.set(rx + rw, ry3, ry + rh / 2 + offset); segMesh.rotation.y = Math.PI / 2; }
          segMesh.castShadow = true;
          segMesh.receiveShadow = true;
          scene.add(segMesh);
        };

        for (const op of sorted) {
          const opStart = op.offsetPct - op.widthPct / 2;
          const opEnd   = op.offsetPct + op.widthPct / 2;
          // Segment before opening
          addSegment(cursor, Math.max(cursor, opStart), 0, ch);
          // Above opening (lintel)
          const opH = op.type === 'door' ? 2.1 : 1.2;
          const opBase = op.type === 'door' ? 0 : 0.9;
          addSegment(opStart, opEnd, opBase + opH, ch);
          // Below window sill
          if (op.type === 'window') {
            addSegment(opStart, opEnd, 0, opBase);
          }
          // Window glass
          if (op.type === 'window') {
            const glassGeo = new THREE.BoxGeometry((opEnd - opStart) * wallLen, opH, 0.05);
            const glassMat = new THREE.MeshStandardMaterial({
              color: 0x88bbff, transparent: true, opacity: 0.3,
              roughness: 0, metalness: 0,
            });
            const glass = new THREE.Mesh(glassGeo, glassMat);
            const offset = (opStart + opEnd) / 2 * wallLen - wallLen / 2;
            if (side === 'top')   glass.position.set(rx + rw / 2 + offset, opBase + opH / 2, ry);
            else if (side === 'bottom') glass.position.set(rx + rw / 2 + offset, opBase + opH / 2, ry + rh);
            else if (side === 'left')  { glass.position.set(rx, opBase + opH / 2, ry + rh / 2 + offset); glass.rotation.y = Math.PI / 2; }
            else                      { glass.position.set(rx + rw, opBase + opH / 2, ry + rh / 2 + offset); glass.rotation.y = Math.PI / 2; }
            scene.add(glass);
          }
          cursor = opEnd;
        }
        addSegment(cursor, 1, 0, ch);
      }
    }

    // Room point light
    const ptLight = new THREE.PointLight(0xfff5e0, 0.4, rw + rh);
    ptLight.position.set(rx + rw / 2, ch - 0.3, ry + rh / 2);
    scene.add(ptLight);
  }

  // Furniture
  for (const furn of house.furniture) {
    const room = house.rooms.find(r => r.id === furn.roomId);
    if (!room) continue;
    const fx = (room.x + furn.x + furn.width / 2) * UNIT;
    const fz = (room.y + furn.y + furn.height / 2) * UNIT;
    const fHeight = getFurnHeight(furn.type);
    const color = FURNITURE_COLORS[furn.type] ?? 0x888888;

    const geo = getFurnGeometry(furn, fHeight);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(fx, fHeight / 2, fz);
    mesh.rotation.y = (furn.rotation * Math.PI) / 180;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { furnId: furn.id, label: furn.label };
    scene.add(mesh);
  }
}

function getFurnHeight(type: FurnitureItem['type']): number {
  const heights: Partial<Record<FurnitureItem['type'], number>> = {
    sofa: 0.85, bed: 0.6, table: 0.75, chair: 0.9, desk: 0.75,
    wardrobe: 2.0, tv: 0.6, bookshelf: 1.8, dining_table: 0.75,
    dining_chair: 0.9, bathtub: 0.6, toilet: 0.75, sink: 0.85,
    refrigerator: 1.7, stove: 0.85, kitchen_counter: 0.9,
    coffee_table: 0.45, nightstand: 0.55, dresser: 1.2,
    plant: 1.2, lamp: 1.5,
  };
  return heights[type] ?? 0.8;
}

function getFurnGeometry(furn: FurnitureItem, h: number): THREE.BufferGeometry {
  const w = furn.width * UNIT, d = furn.height * UNIT;
  if (furn.type === 'plant') {
    return new THREE.CylinderGeometry(w * 0.4, w * 0.3, h, 8);
  }
  if (furn.type === 'lamp') {
    return new THREE.CylinderGeometry(0.1, 0.15, h, 8);
  }
  return new THREE.BoxGeometry(w, h, d);
}

// ─── Main component ────────────────────────────────────────────────────────────
export function Viewer3D() {
  const project = useAppStore(s => s.activeProject());
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef  = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animRef   = useRef<number>(0);

  const [hour, setHour] = useState(12);
  const [orbiting, setOrbiting] = useState(false);
  const orbitState = useRef({ x: 0, y: 0, theta: Math.PI / 4, phi: Math.PI / 3, r: 30, cx: 10, cz: 10 });

  useEffect(() => {
    if (!canvasRef.current || !project) return;
    const container = canvasRef.current;
    const w = container.clientWidth, h = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
    cameraRef.current = camera;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    buildScene(project.house, scene, hour);

    // Find center
    const rooms = project.house.rooms;
    const cx = rooms.length ? rooms.reduce((s, r) => s + r.x + r.width / 2, 0) / rooms.length : 10;
    const cz = rooms.length ? rooms.reduce((s, r) => s + r.y + r.height / 2, 0) / rooms.length : 10;
    orbitState.current.cx = cx;
    orbitState.current.cz = cz;
    const maxSize = rooms.length ? Math.max(...rooms.map(r => r.width + r.height)) : 20;
    orbitState.current.r = maxSize * 1.5 + 10;

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const { theta, phi, r, cx: ccx, cz: ccz } = orbitState.current;
      camera.position.set(
        ccx + r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        ccz + r * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(ccx, 1.5, ccz);
      renderer.render(scene, camera);
    };
    animate();
    animRef.current = frameId!;

    // Resize
    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [project?.id]); // eslint-disable-line

  // Rebuild scene when house changes or hour changes
  useEffect(() => {
    if (sceneRef.current && project) {
      buildScene(project.house, sceneRef.current, hour);
    }
  }, [project?.house, hour]); // eslint-disable-line

  // Mouse orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setOrbiting(true);
    orbitState.current.x = e.clientX;
    orbitState.current.y = e.clientY;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!orbiting) return;
    const dx = e.clientX - orbitState.current.x;
    const dy = e.clientY - orbitState.current.y;
    orbitState.current.theta -= dx * 0.01;
    orbitState.current.phi = Math.max(0.1, Math.min(Math.PI / 2.2, orbitState.current.phi + dy * 0.01));
    orbitState.current.x = e.clientX;
    orbitState.current.y = e.clientY;
  };
  const handleWheel = (e: React.WheelEvent) => {
    orbitState.current.r = Math.max(3, Math.min(80, orbitState.current.r + e.deltaY * 0.05));
  };

  const resetCamera = () => {
    const rooms = project?.house.rooms ?? [];
    const cx = rooms.length ? rooms.reduce((s, r) => s + r.x + r.width / 2, 0) / rooms.length : 10;
    const cz = rooms.length ? rooms.reduce((s, r) => s + r.y + r.height / 2, 0) / rooms.length : 10;
    orbitState.current = { ...orbitState.current, theta: Math.PI / 4, phi: Math.PI / 3, cx, cz };
  };

  if (!project) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open. Go to Dashboard first.
    </div>
  );

  return (
    <div className="relative h-full flex flex-col">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="glass rounded-xl px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>3D Viewer</div>
          <div>Drag to orbit · Scroll to zoom</div>
        </div>
        <button onClick={resetCamera} className="glass rounded-xl p-2.5 flex items-center gap-2 text-xs btn-secondary">
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Time of day */}
      <div className="absolute top-4 right-4 z-10 glass rounded-xl px-4 py-3 w-64">
        <div className="flex items-center gap-2 mb-2">
          {hour < 7 || hour > 19 ? <Moon size={14} style={{ color: '#94a3b8' }} /> : <Sun size={14} style={{ color: '#fbbf24' }} />}
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            Time: {String(hour).padStart(2,'0')}:00
          </span>
        </div>
        <input type="range" min={0} max={23} value={hour} onChange={e => setHour(Number(e.target.value))}
          className="w-full" />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>🌙 Night</span><span>☀️ Noon</span><span>🌙 Night</span>
        </div>
        <div className="mt-2 flex gap-2">
          {[6, 12, 18].map(h => (
            <button key={h} onClick={() => setHour(h)}
              className="flex-1 text-xs py-1 rounded-lg"
              style={{
                background: hour === h ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
                color: hour === h ? '#60a5fa' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}>
              {h}:00
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1"
        style={{ cursor: orbiting ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setOrbiting(false)}
        onMouseLeave={() => setOrbiting(false)}
        onWheel={handleWheel}
      />
    </div>
  );
}
