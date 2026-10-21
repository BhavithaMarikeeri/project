import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { v4 as uuidv4 } from 'uuid';
import type { FurnitureItem, FurnitureType } from '../types';
import { Sofa, Search, Plus } from 'lucide-react';

const CATALOG: Array<{
  category: string;
  items: Array<{ type: FurnitureType; label: string; w: number; h: number; desc: string; color: string }>;
}> = [
  {
    category: 'Seating',
    items: [
      { type: 'sofa',         label: 'Sofa',          w: 2.5, h: 1.0, desc: '3-seater sofa',         color: '#6b7280' },
      { type: 'chair',        label: 'Armchair',       w: 0.8, h: 0.8, desc: 'Single armchair',       color: '#4b5563' },
      { type: 'dining_chair', label: 'Dining Chair',   w: 0.5, h: 0.5, desc: 'Upholstered chair',     color: '#4b5563' },
    ],
  },
  {
    category: 'Bedroom',
    items: [
      { type: 'bed',       label: 'King Bed',   w: 2.0, h: 2.2, desc: 'King-size platform bed', color: '#7c5cbf' },
      { type: 'bed',       label: 'Twin Bed',   w: 1.0, h: 2.0, desc: 'Single/twin bed',        color: '#7c5cbf' },
      { type: 'wardrobe',  label: 'Wardrobe',   w: 2.0, h: 0.6, desc: 'Sliding door wardrobe',  color: '#5c4434' },
      { type: 'nightstand',label: 'Nightstand', w: 0.5, h: 0.5, desc: 'Bedside table',          color: '#7c5c3a' },
      { type: 'dresser',   label: 'Dresser',    w: 1.2, h: 0.5, desc: 'Chest of drawers',       color: '#8b6a4d' },
    ],
  },
  {
    category: 'Work',
    items: [
      { type: 'desk',      label: 'Office Desk', w: 1.5, h: 0.7, desc: 'L-shaped work desk',    color: '#8B5E3C' },
      { type: 'bookshelf', label: 'Bookshelf',   w: 1.2, h: 0.4, desc: '5-shelf bookcase',      color: '#7B4F2E' },
    ],
  },
  {
    category: 'Living',
    items: [
      { type: 'tv',           label: 'TV Unit',      w: 1.5, h: 0.3, desc: '55" Smart TV',           color: '#1f2937' },
      { type: 'coffee_table', label: 'Coffee Table', w: 1.2, h: 0.6, desc: 'Glass top coffee table', color: '#8B5E3C' },
      { type: 'table',        label: 'Side Table',   w: 0.6, h: 0.6, desc: 'Accent side table',      color: '#8B5E3C' },
      { type: 'plant',        label: 'Floor Plant',  w: 0.5, h: 0.5, desc: 'Large indoor plant',     color: '#2d6a4f' },
      { type: 'lamp',         label: 'Floor Lamp',   w: 0.4, h: 0.4, desc: 'Arc floor lamp',         color: '#fbbf24' },
    ],
  },
  {
    category: 'Dining',
    items: [
      { type: 'dining_table', label: 'Dining Table 4-seater', w: 2.0, h: 1.0, desc: '4-seater dining table', color: '#8B5E3C' },
      { type: 'dining_table', label: 'Dining Table 6-seater', w: 2.4, h: 1.0, desc: '6-seater dining table', color: '#8B5E3C' },
    ],
  },
  {
    category: 'Kitchen',
    items: [
      { type: 'kitchen_counter', label: 'Counter',      w: 2.5, h: 0.6, desc: 'Kitchen counter top', color: '#c0c0c0' },
      { type: 'stove',           label: 'Gas Stove',    w: 0.8, h: 0.6, desc: '4-burner gas hob',    color: '#4b5563' },
      { type: 'refrigerator',    label: 'Refrigerator', w: 0.8, h: 0.8, desc: 'Double-door fridge',  color: '#d1d5db' },
    ],
  },
  {
    category: 'Bathroom',
    items: [
      { type: 'bathtub', label: 'Bathtub',      w: 0.8, h: 1.8, desc: 'Freestanding tub', color: '#e0e0e0' },
      { type: 'toilet',  label: 'WC',           w: 0.6, h: 0.8, desc: 'Wall-hung toilet', color: '#fafafa' },
      { type: 'sink',    label: 'Vanity Sink',  w: 0.6, h: 0.5, desc: 'Basin with cabinet', color: '#e8e8e8' },
    ],
  },
];

function FurnCard({ item, roomId }: {
  item: typeof CATALOG[0]['items'][0];
  roomId: string;
}) {
  const { addFurniture } = useAppStore();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addFurniture({
      id: uuidv4(),
      type: item.type,
      label: item.label,
      roomId,
      x: 0.5, y: 0.5,
      width: item.w, height: item.h,
      rotation: 0,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="panel p-3 card-hover flex flex-col gap-2">
      {/* Procedural preview */}
      <div
        className="h-20 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <svg width={60} height={60} viewBox="0 0 60 60">
          <rect
            x={30 - item.w * 10} y={30 - item.h * 10}
            width={item.w * 20} height={item.h * 20}
            rx={3}
            fill={item.color + '66'}
            stroke={item.color}
            strokeWidth={1.5}
          />
          <text x={30} y={32} textAnchor="middle" fontSize={7} fill={item.color}>
            {item.label.slice(0,8)}
          </text>
          <text x={30} y={41} textAnchor="middle" fontSize={5} fill={item.color + '99'}>
            {item.w}×{item.h}ft
          </text>
        </svg>
      </div>
      <div>
        <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.w}×{item.h} ft</div>
      </div>
      <button
        onClick={handleAdd}
        className={`w-full py-1.5 rounded-lg text-xs flex items-center gap-1.5 justify-center transition-all ${added ? '' : 'btn-primary'}`}
        style={added ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' } : undefined}
        disabled={!roomId}
      >
        <Plus size={12} />
        {added ? 'Added!' : 'Add to Room'}
      </button>
    </div>
  );
}

export function FurniturePage() {
  const project = useAppStore(s => s.activeProject());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [targetRoom, setTargetRoom] = useState('');

  const rooms = project?.house.rooms ?? [];
  const selectedRoomId = targetRoom || rooms[0]?.id || '';

  const categories = ['All', ...CATALOG.map(c => c.category)];

  const filtered = CATALOG
    .filter(c => category === 'All' || c.category === category)
    .map(c => ({
      ...c,
      items: c.items.filter(item =>
        search === '' ||
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(c => c.items.length > 0);

  if (!project) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open.
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#8b5cf6)' }}>
          <Sofa size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Furniture Library</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Search and add furniture to your rooms</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search furniture…"
            className="input-field w-full pl-8 pr-3 py-2 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: category === cat ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
                color: category === cat ? '#60a5fa' : 'var(--text-muted)',
                border: `1px solid ${category === cat ? 'rgba(59,130,246,0.4)' : 'var(--border-subtle)'}`,
              }}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Add to:</span>
          <select
            value={selectedRoomId}
            onChange={e => setTargetRoom(e.target.value)}
            className="input-field px-2 py-1.5 rounded-lg text-xs"
          >
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Items */}
      {filtered.map(cat => (
        <div key={cat.category} className="mb-8">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {cat.category}
            <span className="tag" style={{ background: 'rgba(59,130,246,0.1)', color: '#94a3b8' }}>
              {cat.items.length}
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cat.items.map((item, i) => (
              <FurnCard key={`${item.type}-${i}`} item={item} roomId={selectedRoomId} />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="panel p-12 text-center">
          <Sofa size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No furniture matches your search</p>
        </div>
      )}
    </div>
  );
}
