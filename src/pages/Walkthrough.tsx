import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { buildScene } from './Viewer3D';
import { Maximize2, Minimize2, Map, Crosshair, Settings2 } from 'lucide-react';

const MOVE_SPEED = 5.0;  // m/s
const CAMERA_HEIGHT = 1.65; // meters
const GRAVITY = 9.8;

export function Walkthrough() {
  const project = useAppStore(s => s.activeProject());
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef     = useRef<THREE.Scene | null>(null);
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const animRef      = useRef<number>(0);
  const keysRef      = useRef<Set<string>>(new Set());
  const mouseRef     = useRef({ locked: false, dx: 0, dy: 0 });
  const yawRef       = useRef(0);
  const pitchRef     = useRef(0);
  const collidersRef = useRef<THREE.Box3[]>([]);

  const [active, setActive] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [hint, setHint] = useState(true);
  const [fps, setFps] = useState(0);

  // Build colliders from walls/furniture
  const buildColliders = useCallback((house: typeof project extends null ? never : NonNullable<typeof project>['house']) => {
    const boxes: THREE.Box3[] = [];
    const wallT = 0.15;
    const CH = 2.8;
    for (const room of house.rooms) {
      const sides = [
        { x: room.x + room.width / 2, z: room.y,           w: room.width,  d: wallT },
        { x: room.x + room.width / 2, z: room.y + room.height, w: room.width, d: wallT },
        { x: room.x,               z: room.y + room.height / 2, w: wallT, d: room.height },
        { x: room.x + room.width,  z: room.y + room.height / 2, w: wallT, d: room.height },
      ];
      for (const s of sides) {
        boxes.push(new THREE.Box3(
          new THREE.Vector3(s.x - s.w / 2 - 0.1, 0, s.z - s.d / 2 - 0.1),
          new THREE.Vector3(s.x + s.w / 2 + 0.1, CH, s.z + s.d / 2 + 0.1)
        ));
      }
    }
    for (const furn of house.furniture) {
      const room = house.rooms.find(r => r.id === furn.roomId);
      if (!room) continue;
      const fx = room.x + furn.x, fz = room.y + furn.y;
      boxes.push(new THREE.Box3(
        new THREE.Vector3(fx - 0.05, 0, fz - 0.05),
        new THREE.Vector3(fx + furn.width + 0.05, 1.2, fz + furn.height + 0.05)
      ));
    }
    collidersRef.current = boxes;
  }, []);

  useEffect(() => {
    if (!containerRef.current || !project) return;
    const container = containerRef.current;
    const w = container.clientWidth, h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: quality === 'high',
      powerPreference: quality === 'low' ? 'low-power' : 'high-performance',
    });
    renderer.setPixelRatio(quality === 'low' ? 1 : window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = quality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 200);
    // Start in center of first room
    const firstRoom = project.house.rooms[0];
    if (firstRoom) {
      camera.position.set(
        firstRoom.x + firstRoom.width / 2,
        CAMERA_HEIGHT,
        firstRoom.y + firstRoom.height / 2
      );
    }
    cameraRef.current = camera;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    buildScene(project.house, scene, 12);
    buildColliders(project.house);

    // Clock for delta time
    const clock = new THREE.Clock();
    let lastFPSUpdate = 0, frameCount = 0;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      frameCount++;
      const now = performance.now();
      if (now - lastFPSUpdate > 500) {
        setFps(Math.round(frameCount / ((now - lastFPSUpdate) / 1000)));
        frameCount = 0;
        lastFPSUpdate = now;
      }

      if (active) {
        // Mouse look
        const { dx, dy } = mouseRef.current;
        yawRef.current   -= dx * 0.002;
        pitchRef.current  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current - dy * 0.002));
        mouseRef.current.dx = 0;
        mouseRef.current.dy = 0;

        const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
        camera.quaternion.setFromEuler(euler);

        // Movement
        const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
        const right   = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));
        const moveDir = new THREE.Vector3();

        const keys = keysRef.current;
        if (keys.has('KeyW') || keys.has('ArrowUp'))    moveDir.addScaledVector(forward, 1);
        if (keys.has('KeyS') || keys.has('ArrowDown'))  moveDir.addScaledVector(forward, -1);
        if (keys.has('KeyA') || keys.has('ArrowLeft'))  moveDir.addScaledVector(right, -1);
        if (keys.has('KeyD') || keys.has('ArrowRight')) moveDir.addScaledVector(right, 1);

        if (moveDir.length() > 0) {
          moveDir.normalize().multiplyScalar(MOVE_SPEED * dt);
          const newPos = camera.position.clone().add(moveDir);

          // Collision detection
          const playerBox = new THREE.Box3(
            new THREE.Vector3(newPos.x - 0.3, 0, newPos.z - 0.3),
            new THREE.Vector3(newPos.x + 0.3, 2.0, newPos.z + 0.3)
          );
          let collision = false;
          for (const col of collidersRef.current) {
            if (playerBox.intersectsBox(col)) { collision = true; break; }
          }
          if (!collision) {
            camera.position.copy(newPos);
            camera.position.y = CAMERA_HEIGHT;
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [project?.id, quality]); // eslint-disable-line

  // Pointer lock
  const requestLock = useCallback(() => {
    containerRef.current?.requestPointerLock();
  }, []);

  useEffect(() => {
    const onLockChange = () => {
      const locked = document.pointerLockElement === containerRef.current;
      mouseRef.current.locked = locked;
      setActive(locked);
      if (locked) setHint(false);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.locked) return;
      mouseRef.current.dx += e.movementX;
      mouseRef.current.dy += e.movementY;
    };
    const onKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const onKeyUp   = (e: KeyboardEvent) => keysRef.current.delete(e.code);

    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.parentElement?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(f => !f);
  };

  if (!project) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open. Go to Dashboard first.
    </div>
  );

  return (
    <div className="relative h-full flex flex-col" style={{ background: '#000' }}>
      {/* Three.js canvas */}
      <div
        ref={containerRef}
        className="flex-1"
        style={{ cursor: active ? 'none' : 'crosshair' }}
        onClick={requestLock}
      />

      {/* Crosshair */}
      {active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-6 h-6">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white opacity-60" style={{ transform: 'translateX(-50%)' }} />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white opacity-60" style={{ transform: 'translateY(-50%)' }} />
            <div className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-white opacity-80"
              style={{ transform: 'translate(-50%,-50%)' }} />
          </div>
        </div>
      )}

      {/* Hint overlay */}
      {hint && !active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass rounded-2xl p-8 text-center max-w-sm animate-fade-in">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              <Crosshair size={28} className="text-white" />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>First-Person Walkthrough</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Click to enter immersive mode.<br />
              <strong>WASD</strong> to move · <strong>Mouse</strong> to look<br />
              <strong>ESC</strong> to exit
            </p>
            <button onClick={requestLock} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
              Enter Walkthrough
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="glass rounded-xl px-3 py-2 text-xs flex items-center gap-2">
          <span style={{ color: 'var(--text-muted)' }}>FPS:</span>
          <span style={{ color: fps > 30 ? '#10b981' : '#ef4444' }}>{fps}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMap(m => !m)} className="glass rounded-xl p-2" title="Minimap">
            <Map size={16} style={{ color: showMap ? '#60a5fa' : 'var(--text-muted)' }} />
          </button>
          <button onClick={toggleFullscreen} className="glass rounded-xl p-2" title="Fullscreen">
            {fullscreen ? <Minimize2 size={16} style={{ color: 'var(--text-muted)' }} /> : <Maximize2 size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          <div className="glass rounded-xl px-2 py-1 flex items-center gap-1">
            <Settings2 size={14} style={{ color: 'var(--text-muted)' }} />
            {(['low','medium','high'] as const).map(q => (
              <button key={q} onClick={() => setQuality(q)}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: quality === q ? 'rgba(59,130,246,0.3)' : 'transparent',
                  color: quality === q ? '#60a5fa' : 'var(--text-muted)',
                }}>
                {q[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Minimap */}
      {showMap && project.house.rooms.length > 0 && (
        <MinimapOverlay house={project.house} camera={cameraRef.current} />
      )}

      {/* Controls hint */}
      {active && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-xl px-4 py-2 text-xs flex gap-4"
          style={{ color: 'var(--text-muted)' }}>
          <span><kbd>W A S D</kbd> Move</span>
          <span><kbd>Mouse</kbd> Look</span>
          <span><kbd>ESC</kbd> Exit</span>
        </div>
      )}
    </div>
  );
}

function MinimapOverlay({ house, camera }: { house: import('../types').HouseData; camera: THREE.PerspectiveCamera | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const S = 2; // scale: 1 grid unit = 2px
    const pad = 4;
    const allX = house.rooms.map(r => r.x);
    const allY = house.rooms.map(r => r.y);
    const minX = Math.min(...allX, 0) - 1;
    const minY = Math.min(...allY, 0) - 1;

    const draw = () => {
      ctx.clearRect(0, 0, 200, 200);
      ctx.fillStyle = 'rgba(10,15,26,0.85)';
      ctx.fillRect(0, 0, 200, 200);
      for (const room of house.rooms) {
        ctx.fillStyle = 'rgba(59,130,246,0.2)';
        ctx.strokeStyle = 'rgba(59,130,246,0.6)';
        ctx.lineWidth = 1;
        ctx.fillRect((room.x - minX) * S + pad, (room.y - minY) * S + pad, room.width * S, room.height * S);
        ctx.strokeRect((room.x - minX) * S + pad, (room.y - minY) * S + pad, room.width * S, room.height * S);
      }
      if (camera) {
        const px = (camera.position.x - minX) * S + pad;
        const pz = (camera.position.z - minY) * S + pad;
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(px, pz, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const id = setInterval(draw, 100);
    draw();
    return () => clearInterval(id);
  }, [house, camera]);

  return (
    <div className="absolute bottom-4 left-4 glass rounded-xl overflow-hidden" style={{ width: 150, height: 150 }}>
      <canvas ref={canvasRef} width={150} height={150} />
      <div className="absolute top-1 left-2 text-xs" style={{ color: 'var(--text-muted)' }}>Map</div>
    </div>
  );
}
