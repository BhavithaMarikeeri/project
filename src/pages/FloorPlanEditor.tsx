import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { v4 as uuidv4 } from 'uuid';
import type { Room, Opening, FurnitureItem, RoomType, WallSide } from '../types';
import {
  Plus, Minus, RotateCcw, RotateCw, Trash2, Move,
  Square, DoorOpen, AppWindow as WindowIcon, Sofa, Grid3X3,
  ChevronDown, Info
} from 'lucide-react';

const GRID = 60; // px per grid unit (= 1 foot)
const SNAP = 1;  // snap to 1 grid unit

type Tool = 'select' | 'addRoom' | 'addDoor' | 'addWindow' | 'addFurniture';

const ROOM_COLORS: Record<RoomType, string> = {
  bedroom:  '#6366f1', living: '#10b981', kitchen: '#f59e0b',
  bathroom: '#06b6d4', dining: '#ef4444', study: '#a855f7',
  garage:   '#6b7280', corridor:'#94a3b8', balcony:'#22c55e', storage:'#6b7280',
};

const ROOM_BG: Record<RoomType, string> = {
  bedroom:  'rgba(99,102,241,0.12)', living: 'rgba(16,185,129,0.1)',
  kitchen:  'rgba(245,158,11,0.1)',  bathroom:'rgba(6,182,212,0.1)',
  dining:   'rgba(239,68,68,0.1)',   study:   'rgba(168,85,247,0.12)',
  garage:   'rgba(107,114,128,0.1)', corridor:'rgba(148,163,184,0.08)',
  balcony:  'rgba(34,197,94,0.1)',   storage: 'rgba(107,114,128,0.1)',
};

type Dragging =
  | { kind: 'move'; roomId: string; ox: number; oy: number }
  | { kind: 'resize'; roomId: string; handle: string; ox: number; oy: number; origW: number; origH: number; origX: number; origY: number }
  | { kind: 'drawRoom'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'moveFurn'; furnId: string; ox: number; oy: number }
  | null;

function snap(v: number, s = SNAP) { return Math.round(v / s) * s; }
function gridToCanvas(g: number) { return g * GRID; }
function canvasToGrid(c: number) { return c / GRID; }

export function FloorPlanEditor() {
  const store = useAppStore();
  const project = useAppStore(s => s.activeProject());
  const canUndo = useAppStore(s => s.canUndo());
  const canRedo = useAppStore(s => s.canRedo());
  const { undo, redo, updateRoom, addRoom, deleteRoom, addOpening, deleteOpening, addFurniture, deleteFurniture } = store;

  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [selected, setSelected] = useState<{ type: 'room' | 'opening' | 'furniture'; id: string } | null>(null);
  const [dragging, setDragging] = useState<Dragging>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [newRoomType, setNewRoomType] = useState<RoomType>('bedroom');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, px: 0, py: 0 });

  const house = project?.house;

  // SVG world coords from mouse event
  const toWorld = useCallback((e: React.MouseEvent<SVGElement>) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const cx = (e.clientX - rect.left - pan.x) / zoom;
    const cy = (e.clientY - rect.top  - pan.y) / zoom;
    return { wx: canvasToGrid(cx), wy: canvasToGrid(cy) };
  }, [pan, zoom]);

  const handleSVGMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
      return;
    }
    if (tool === 'addRoom') {
      const { wx, wy } = toWorld(e);
      setDragging({ kind: 'drawRoom', x0: snap(wx), y0: snap(wy), x1: snap(wx), y1: snap(wy) });
    }
    if (tool === 'select') setSelected(null);
  }, [tool, toWorld, pan]);

  const handleSVGMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({ x: panStart.px + e.clientX - panStart.x, y: panStart.py + e.clientY - panStart.y });
      return;
    }
    if (!dragging || !house) return;
    const { wx, wy } = toWorld(e);
    if (dragging.kind === 'drawRoom') {
      setDragging({ ...dragging, x1: snap(wx), y1: snap(wy) });
    } else if (dragging.kind === 'move') {
      const room = house.rooms.find(r => r.id === dragging.roomId)!;
      const nx = snap(wx - dragging.ox);
      const ny = snap(wy - dragging.oy);
      updateRoom({ ...room, x: Math.max(0, nx), y: Math.max(0, ny) });
    } else if (dragging.kind === 'resize') {
      const room = house.rooms.find(r => r.id === dragging.roomId)!;
      const { handle, origW, origH, origX, origY } = dragging;
      const dx = wx - dragging.ox;
      const dy = wy - dragging.oy;
      let { x, y, width, height } = { x: origX, y: origY, width: origW, height: origH };
      if (handle.includes('e')) width  = Math.max(2, snap(origW + dx));
      if (handle.includes('s')) height = Math.max(2, snap(origH + dy));
      if (handle.includes('w')) { x = snap(origX + dx); width  = Math.max(2, snap(origW - dx)); }
      if (handle.includes('n')) { y = snap(origY + dy); height = Math.max(2, snap(origH - dy)); }
      updateRoom({ ...room, x, y, width, height });
    } else if (dragging.kind === 'moveFurn') {
      if (!house) return;
      const furn = house.furniture.find(f => f.id === dragging.furnId)!;
      const room = house.rooms.find(r => r.id === furn.roomId)!;
      if (!room) return;
      const nx = snap(wx - room.x - dragging.ox);
      const ny = snap(wy - room.y - dragging.oy);
      store.updateFurniture({ ...furn, x: Math.max(0, nx), y: Math.max(0, ny) });
    }
  }, [isPanning, panStart, dragging, house, toWorld, updateRoom, store]);

  const handleSVGMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setIsPanning(false);
    if (!dragging) return;
    if (dragging.kind === 'drawRoom') {
      const { x0, y0, x1, y1 } = dragging;
      const rx = Math.min(x0, x1), ry = Math.min(y0, y1);
      const rw = Math.abs(x1 - x0), rh = Math.abs(y1 - y0);
      if (rw >= 2 && rh >= 2) {
        const room: Room = {
          id: uuidv4(), name: newRoomType.charAt(0).toUpperCase() + newRoomType.slice(1),
          type: newRoomType, x: rx, y: ry, width: rw, height: rh,
          floorMaterial: 'wood', wallMaterial: 'paint', ceilingHeight: 2.8,
        };
        addRoom(room);
        setSelected({ type: 'room', id: room.id });
      }
    }
    setDragging(null);
  }, [dragging, newRoomType, addRoom]);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.min(3, Math.max(0.3, z * factor)));
  }, []);

  const addDoorOrWindow = (roomId: string, type: 'door' | 'window') => {
    const o: Opening = {
      id: uuidv4(), roomId, side: 'top', offsetPct: 0.5,
      widthPct: type === 'door' ? 0.25 : 0.35, type, isOpen: false,
    };
    addOpening(o);
    setSelected({ type: 'opening', id: o.id });
    setTool('select');
  };

  const selectedRoom = house?.rooms.find(r => r.id === selected?.id && selected?.type === 'room');
  const selectedFurn = house?.furniture.find(f => f.id === selected?.id && selected?.type === 'furniture');
  const selectedOpening = house?.openings.find(o => o.id === selected?.id && selected?.type === 'opening');

  if (!house) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open. Go to Dashboard to open or create a project.
    </div>
  );

  const drawingRoom = dragging?.kind === 'drawRoom' ? dragging : null;

  const canvasW = 2000, canvasH = 2000;

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Left toolbar */}
      <div className="flex flex-col gap-1 p-2 border-r" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', width: 52 }}>
        {[
          { t: 'select' as Tool,      icon: Move,        title: 'Select/Move' },
          { t: 'addRoom' as Tool,     icon: Square,      title: 'Draw Room' },
          { t: 'addDoor' as Tool,     icon: DoorOpen,    title: 'Add Door' },
          { t: 'addWindow' as Tool,   icon: WindowIcon,  title: 'Add Window' },
          { t: 'addFurniture' as Tool,icon: Sofa,        title: 'Add Furniture' },
        ].map(({ t, icon: Icon, title }) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className="p-2.5 rounded-lg transition-all"
            title={title}
            style={{
              background: tool === t ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: tool === t ? '#60a5fa' : 'var(--text-muted)',
              border: tool === t ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
            }}
          >
            <Icon size={17} />
          </button>
        ))}

        <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--border-subtle)' }}>
          <button onClick={() => setShowGrid(g => !g)} className="p-2.5 rounded-lg transition-all w-full"
            title="Toggle Grid"
            style={{ color: showGrid ? '#60a5fa' : 'var(--text-muted)', background: showGrid ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
            <Grid3X3 size={17} />
          </button>
          <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} className="p-2.5 rounded-lg hover:bg-white/5 w-full" title="Zoom In" style={{ color: 'var(--text-muted)' }}>
            <Plus size={17} />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="p-2.5 rounded-lg hover:bg-white/5 w-full" title="Zoom Out" style={{ color: 'var(--text-muted)' }}>
            <Minus size={17} />
          </button>
          <button onClick={undo} disabled={!canUndo} className="p-2.5 rounded-lg hover:bg-white/5 w-full disabled:opacity-30" title="Undo" style={{ color: 'var(--text-muted)' }}>
            <RotateCcw size={17} />
          </button>
          <button onClick={redo} disabled={!canRedo} className="p-2.5 rounded-lg hover:bg-white/5 w-full disabled:opacity-30" title="Redo" style={{ color: 'var(--text-muted)' }}>
            <RotateCw size={17} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#0c1424' }}>
        {/* Tool hint */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--text-muted)' }}>
          {tool === 'select' && 'Click to select • Drag to move • Alt+drag to pan'}
          {tool === 'addRoom' && `Draw room: ${newRoomType} — click & drag`}
          {tool === 'addDoor' && 'Click a room to add a door to it'}
          {tool === 'addWindow' && 'Click a room to add a window to it'}
          {tool === 'addFurniture' && 'Select from right panel, then click a room'}
        </div>

        {/* Room type selector (when addRoom) */}
        {tool === 'addRoom' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid var(--border-normal)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Type:</span>
            <select
              value={newRoomType}
              onChange={e => setNewRoomType(e.target.value as RoomType)}
              className="text-xs bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            >
              {(['bedroom','living','kitchen','bathroom','dining','study','corridor','balcony','garage','storage'] as RoomType[]).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        )}

        <svg
          ref={svgRef}
          width="100%" height="100%"
          style={{ cursor: isPanning ? 'grabbing' : tool === 'addRoom' ? 'crosshair' : 'default' }}
          onMouseDown={handleSVGMouseDown}
          onMouseMove={handleSVGMouseMove}
          onMouseUp={handleSVGMouseUp}
          onMouseLeave={() => { setIsPanning(false); setDragging(null); }}
          onWheel={handleWheel}
        >
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Grid */}
            {showGrid && (
              <defs>
                <pattern id="smallGrid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                </pattern>
                <pattern id="grid" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
                  <rect width={GRID * 5} height={GRID * 5} fill="url(#smallGrid)" />
                  <path d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                </pattern>
              </defs>
            )}
            {showGrid && <rect width={canvasW} height={canvasH} fill="url(#grid)" />}

            {/* Rooms */}
            {house.rooms.map(room => {
              const rx = gridToCanvas(room.x), ry = gridToCanvas(room.y);
              const rw = gridToCanvas(room.width), rh = gridToCanvas(room.height);
              const isSelected = selected?.id === room.id && selected?.type === 'room';
              const color = ROOM_COLORS[room.type];
              const bg = ROOM_BG[room.type];

              return (
                <g key={room.id}>
                  {/* Room fill */}
                  <rect
                    x={rx} y={ry} width={rw} height={rh}
                    fill={bg}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isSelected ? undefined : undefined}
                    rx={2}
                    style={{ cursor: tool === 'addDoor' || tool === 'addWindow' ? 'pointer' : 'move' }}
                    onMouseDown={e => {
                      e.stopPropagation();
                      if (tool === 'addDoor')   { addDoorOrWindow(room.id, 'door');   return; }
                      if (tool === 'addWindow') { addDoorOrWindow(room.id, 'window'); return; }
                      setSelected({ type: 'room', id: room.id });
                      const { wx, wy } = toWorld(e);
                      setDragging({ kind: 'move', roomId: room.id, ox: wx - room.x, oy: wy - room.y });
                    }}
                  />

                  {/* Room label */}
                  <text
                    x={rx + rw / 2} y={ry + rh / 2 - 8}
                    textAnchor="middle" fontSize={11 / zoom} fontWeight={600}
                    fill={color} style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {room.name}
                  </text>
                  <text
                    x={rx + rw / 2} y={ry + rh / 2 + 8}
                    textAnchor="middle" fontSize={9 / zoom}
                    fill="rgba(148,163,184,0.8)" style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {room.width}×{room.height} ft
                  </text>

                  {/* Resize handles */}
                  {isSelected && ['n','s','e','w','ne','nw','se','sw'].map(handle => {
                    let hx = rx, hy = ry;
                    if (handle.includes('e')) hx = rx + rw;
                    if (handle.includes('s')) hy = ry + rh;
                    if (handle === 'n' || handle === 's') hx = rx + rw / 2;
                    if (handle === 'e' || handle === 'w') hy = ry + rh / 2;
                    const hs = 8 / zoom;
                    const cursor = handle === 'n' || handle === 's' ? 'ns-resize'
                      : handle === 'e' || handle === 'w' ? 'ew-resize'
                      : handle === 'ne' || handle === 'sw' ? 'nesw-resize' : 'nwse-resize';
                    return (
                      <rect
                        key={handle}
                        x={hx - hs/2} y={hy - hs/2} width={hs} height={hs}
                        fill="#3b82f6" stroke="#fff" strokeWidth={1/zoom}
                        rx={2/zoom}
                        style={{ cursor }}
                        onMouseDown={e => {
                          e.stopPropagation();
                          const { wx, wy } = toWorld(e);
                          setDragging({ kind: 'resize', roomId: room.id, handle, ox: wx, oy: wy,
                            origW: room.width, origH: room.height, origX: room.x, origY: room.y });
                        }}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Openings (doors & windows) */}
            {house.openings.map(op => {
              const room = house.rooms.find(r => r.id === op.roomId);
              if (!room) return null;
              const rx = gridToCanvas(room.x), ry = gridToCanvas(room.y);
              const rw = gridToCanvas(room.width), rh = gridToCanvas(room.height);
              let x1: number, y1: number, x2: number, y2: number;
              const wallLen = op.side === 'top' || op.side === 'bottom' ? rw : rh;
              const opW = wallLen * op.widthPct;
              const offset = wallLen * op.offsetPct - opW / 2;
              if (op.side === 'top') {
                x1 = rx + offset; y1 = ry; x2 = x1 + opW; y2 = ry;
              } else if (op.side === 'bottom') {
                x1 = rx + offset; y1 = ry + rh; x2 = x1 + opW; y2 = ry + rh;
              } else if (op.side === 'left') {
                x1 = rx; y1 = ry + offset; x2 = rx; y2 = y1 + opW;
              } else {
                x1 = rx + rw; y1 = ry + offset; x2 = rx + rw; y2 = y1 + opW;
              }
              const isSelOpening = selected?.id === op.id && selected?.type === 'opening';
              const color = op.type === 'door' ? '#f59e0b' : '#06b6d4';
              return (
                <g key={op.id}
                  onClick={e => { e.stopPropagation(); setSelected({ type: 'opening', id: op.id }); }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Gap in wall */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isSelOpening ? '#fff' : color}
                    strokeWidth={isSelOpening ? 4 / zoom : 5 / zoom}
                    strokeLinecap="round"
                  />
                  {/* Door arc */}
                  {op.type === 'door' && (() => {
                    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
                    return <circle cx={cx} cy={cy} r={4/zoom} fill={color} opacity={0.8} />;
                  })()}
                  {/* Window bars */}
                  {op.type === 'window' && (() => {
                    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                    return (
                      <>
                        <line x1={mx} y1={y1-4/zoom} x2={mx} y2={y2+4/zoom} stroke={color} strokeWidth={1/zoom} />
                        <line x1={x1-4/zoom} y1={my} x2={x2+4/zoom} y2={my} stroke={color} strokeWidth={1/zoom} />
                      </>
                    );
                  })()}
                </g>
              );
            })}

            {/* Furniture */}
            {house.furniture.map(furn => {
              const room = house.rooms.find(r => r.id === furn.roomId);
              if (!room) return null;
              const fx = gridToCanvas(room.x + furn.x);
              const fy = gridToCanvas(room.y + furn.y);
              const fw = gridToCanvas(furn.width);
              const fh = gridToCanvas(furn.height);
              const cx = fx + fw / 2, cy = fy + fh / 2;
              const isSelFurn = selected?.id === furn.id && selected?.type === 'furniture';
              return (
                <g
                  key={furn.id}
                  transform={`rotate(${furn.rotation},${cx},${cy})`}
                  style={{ cursor: 'move' }}
                  onMouseDown={e => {
                    e.stopPropagation();
                    setSelected({ type: 'furniture', id: furn.id });
                    const { wx, wy } = toWorld(e);
                    setDragging({ kind: 'moveFurn', furnId: furn.id, ox: wx - room.x - furn.x, oy: wy - room.y - furn.y });
                  }}
                >
                  <rect
                    x={fx} y={fy} width={fw} height={fh}
                    fill="rgba(59,130,246,0.15)"
                    stroke={isSelFurn ? '#60a5fa' : 'rgba(59,130,246,0.5)'}
                    strokeWidth={isSelFurn ? 2/zoom : 1/zoom}
                    rx={2/zoom}
                  />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={8/zoom} fill="rgba(147,197,253,0.9)"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {furn.label.length > 10 ? furn.label.slice(0,9) + '…' : furn.label}
                  </text>
                </g>
              );
            })}

            {/* Drawing preview */}
            {drawingRoom && (() => {
              const x = Math.min(drawingRoom.x0, drawingRoom.x1);
              const y = Math.min(drawingRoom.y0, drawingRoom.y1);
              const w = Math.abs(drawingRoom.x1 - drawingRoom.x0);
              const h = Math.abs(drawingRoom.y1 - drawingRoom.y0);
              return (
                <rect
                  x={gridToCanvas(x)} y={gridToCanvas(y)}
                  width={gridToCanvas(w)} height={gridToCanvas(h)}
                  fill={`${ROOM_BG[newRoomType]}`}
                  stroke={ROOM_COLORS[newRoomType]}
                  strokeWidth={2}
                  strokeDasharray="8,4"
                  rx={2}
                />
              );
            })()}
          </g>
        </svg>
      </div>

      {/* Right panel */}
      <div className="w-72 border-l flex flex-col overflow-y-auto" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        {selectedRoom && (
          <RoomPanel room={selectedRoom} onDelete={() => { deleteRoom(selectedRoom.id); setSelected(null); }} />
        )}
        {selectedOpening && (
          <OpeningPanel
            opening={selectedOpening}
            rooms={house.rooms}
            onUpdate={o => store.updateOpening(o)}
            onDelete={() => { deleteOpening(selectedOpening.id); setSelected(null); }}
          />
        )}
        {selectedFurn && (
          <FurnPanel
            furn={selectedFurn}
            onUpdate={f => store.updateFurniture(f)}
            onDelete={() => { deleteFurniture(selectedFurn.id); setSelected(null); }}
          />
        )}
        {!selected && <DefaultPanel house={house} onAddFurniture={addFurniture} />}
      </div>
    </div>
  );
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function RoomPanel({ room, onDelete }: { room: Room; onDelete: () => void }) {
  const { updateRoom } = useAppStore();
  const [name, setName] = React.useState(room.name);
  React.useEffect(() => setName(room.name), [room.name]);

  const field = (label: string, val: string | number, key: keyof Room, type: 'text' | 'number' | 'select' = 'text', opts?: string[]) => (
    <div className="mb-3">
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {type === 'select' ? (
        <select
          value={String(val)}
          onChange={e => updateRoom({ ...room, [key]: e.target.value } as Room)}
          className="input-field w-full px-2 py-1.5 rounded-lg text-xs"
        >
          {opts?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={key === 'name' ? name : val}
          onChange={e => {
            if (key === 'name') setName(e.target.value);
            else updateRoom({ ...room, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value } as Room);
          }}
          onBlur={() => { if (key === 'name') updateRoom({ ...room, name }); }}
          className="input-field w-full px-2 py-1.5 rounded-lg text-xs"
        />
      )}
    </div>
  );

  return (
    <div className="p-4 animate-slide-left">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Room Properties</span>
        <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: '#ef4444' }} title="Delete room">
          <Trash2 size={14} />
        </button>
      </div>
      {field('Name', room.name, 'name')}
      {field('Type', room.type, 'type', 'select', ['bedroom','living','kitchen','bathroom','dining','study','corridor','balcony','garage','storage'])}
      {field('Width (ft)', room.width, 'width', 'number')}
      {field('Height (ft)', room.height, 'height', 'number')}
      {field('Floor Material', room.floorMaterial ?? 'wood', 'floorMaterial', 'select', ['wood','tile','carpet','concrete'])}
      {field('Wall Material', room.wallMaterial ?? 'paint', 'wallMaterial', 'select', ['paint','tile','concrete','wallpaper'])}
      {field('Ceiling Height (m)', room.ceilingHeight ?? 2.8, 'ceilingHeight', 'number')}
      <div className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        Area: {(room.width * room.height).toFixed(0)} sq ft
      </div>
    </div>
  );
}

function OpeningPanel({ opening, rooms, onUpdate, onDelete }: { opening: Opening; rooms: Room[]; onUpdate: (o: Opening) => void; onDelete: () => void }) {
  return (
    <div className="p-4 animate-slide-left">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opening.type === 'door' ? 'Door' : 'Window'} Properties</span>
        <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
      </div>
      {([
        { label: 'Wall Side', key: 'side', opts: ['top','bottom','left','right'] },
      ] as const).map(({ label, key, opts }) => (
        <div className="mb-3" key={key}>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
          <select value={opening[key]} onChange={e => onUpdate({ ...opening, [key]: e.target.value as WallSide })}
            className="input-field w-full px-2 py-1.5 rounded-lg text-xs">
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <div className="mb-3">
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Position (0-1)</label>
        <input type="range" min={0.05} max={0.95} step={0.05} value={opening.offsetPct}
          onChange={e => onUpdate({ ...opening, offsetPct: parseFloat(e.target.value) })}
          className="w-full" />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(opening.offsetPct * 100).toFixed(0)}%</span>
      </div>
      <div className="mb-3">
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Width (0-1)</label>
        <input type="range" min={0.05} max={0.8} step={0.05} value={opening.widthPct}
          onChange={e => onUpdate({ ...opening, widthPct: parseFloat(e.target.value) })}
          className="w-full" />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(opening.widthPct * 100).toFixed(0)}%</span>
      </div>
      {opening.type === 'door' && (
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Connected Room</label>
          <select value={opening.connectedRoomId ?? ''} onChange={e => onUpdate({ ...opening, connectedRoomId: e.target.value || undefined })}
            className="input-field w-full px-2 py-1.5 rounded-lg text-xs">
            <option value="">None</option>
            {rooms.filter(r => r.id !== opening.roomId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function FurnPanel({ furn, onUpdate, onDelete }: { furn: FurnitureItem; onUpdate: (f: FurnitureItem) => void; onDelete: () => void }) {
  return (
    <div className="p-4 animate-slide-left">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Furniture</span>
        <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mb-3">
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Label</label>
        <input value={furn.label} onChange={e => onUpdate({ ...furn, label: e.target.value })}
          className="input-field w-full px-2 py-1.5 rounded-lg text-xs" />
      </div>
      {[
        { label: 'X pos (ft)', key: 'x' as const },
        { label: 'Y pos (ft)', key: 'y' as const },
        { label: 'Width (ft)', key: 'width' as const },
        { label: 'Depth (ft)', key: 'height' as const },
        { label: 'Rotation (°)', key: 'rotation' as const },
      ].map(({ label, key }) => (
        <div className="mb-3" key={key}>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
          <input type="number" step={0.1} value={furn[key]}
            onChange={e => onUpdate({ ...furn, [key]: parseFloat(e.target.value) || 0 })}
            className="input-field w-full px-2 py-1.5 rounded-lg text-xs" />
        </div>
      ))}
    </div>
  );
}

function DefaultPanel({ house, onAddFurniture }: { house: import('../types').HouseData; onAddFurniture: (f: FurnitureItem) => void }) {
  const FURN_CATALOG: Array<{ type: FurnitureItem['type']; label: string; w: number; h: number }> = [
    { type: 'sofa', label: 'Sofa', w: 2.5, h: 1.0 },
    { type: 'bed', label: 'King Bed', w: 2.0, h: 2.2 },
    { type: 'table', label: 'Table', w: 1.2, h: 0.7 },
    { type: 'chair', label: 'Chair', w: 0.6, h: 0.6 },
    { type: 'desk', label: 'Desk', w: 1.4, h: 0.7 },
    { type: 'wardrobe', label: 'Wardrobe', w: 2.0, h: 0.6 },
    { type: 'tv', label: 'TV', w: 1.5, h: 0.2 },
    { type: 'bookshelf', label: 'Bookshelf', w: 1.2, h: 0.4 },
    { type: 'dining_table', label: 'Dining Table', w: 2.0, h: 1.2 },
    { type: 'dining_chair', label: 'Dining Chair', w: 0.5, h: 0.5 },
    { type: 'bathtub', label: 'Bathtub', w: 0.8, h: 1.8 },
    { type: 'toilet', label: 'Toilet', w: 0.6, h: 0.8 },
    { type: 'sink', label: 'Sink', w: 0.6, h: 0.5 },
    { type: 'refrigerator', label: 'Fridge', w: 0.8, h: 0.8 },
    { type: 'stove', label: 'Stove', w: 0.8, h: 0.6 },
    { type: 'kitchen_counter', label: 'Counter', w: 2.0, h: 0.6 },
    { type: 'coffee_table', label: 'Coffee Table', w: 1.2, h: 0.6 },
    { type: 'nightstand', label: 'Nightstand', w: 0.5, h: 0.5 },
    { type: 'plant', label: 'Plant', w: 0.5, h: 0.5 },
    { type: 'lamp', label: 'Lamp', w: 0.4, h: 0.4 },
  ];
  const firstRoom = house.rooms[0];
  return (
    <div className="p-4">
      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Floor Plan</div>
      <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        {house.rooms.length} rooms · {house.openings.length} openings · {house.furniture.length} furniture items
      </div>
      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Quick Add Furniture</div>
      <div className="grid grid-cols-2 gap-1.5">
        {FURN_CATALOG.map(cat => (
          <button
            key={`${cat.type}-${cat.label}`}
            onClick={() => {
              if (!firstRoom) return;
              onAddFurniture({
                id: uuidv4(), type: cat.type, label: cat.label,
                roomId: firstRoom.id, x: 0.5, y: 0.5,
                width: cat.w, height: cat.h, rotation: 0,
              });
            }}
            className="text-xs px-2 py-1.5 rounded-lg text-left transition-all"
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="mt-4 text-xs px-3 py-2 rounded-lg flex items-start gap-2" style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--text-muted)' }}>
        <Info size={12} className="flex-shrink-0 mt-0.5" />
        Click on a room to select it, then use the properties panel.
      </div>
    </div>
  );
}
