import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Bell, Search, Settings } from 'lucide-react';

const TITLE_MAP: Record<string, string> = {
  '/':           'Dashboard',
  '/editor':     'Floor Plan Editor',
  '/viewer3d':   '3D House Viewer',
  '/walkthrough':'First-Person Walkthrough',
  '/analysis':   'AI Design Analysis',
  '/sunlight':   'Sunlight Simulation',
  '/cost':       'Cost Estimation',
  '/simulation': 'What-If Simulation',
  '/furniture':  'Furniture Library',
  '/history':    'Version History',
};

export function TopBar() {
  const { pathname } = useLocation();
  const proj = useAppStore(s => s.activeProject());
  const title = TITLE_MAP[pathname] ?? 'AI Future Home';

  return (
    <header
      className="flex items-center gap-4 px-6 h-14 border-b flex-shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      <div>
        <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {proj && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{proj.name}</p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-normal)', color: 'var(--text-muted)' }}
        >
          <Search size={13} />
          <span>Search…</span>
          <kbd className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--bg-elevated)' }}>⌘K</kbd>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Saved</span>
        </div>

        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <Bell size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <Settings size={16} />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}
        >
          BH
        </div>
      </div>
    </header>
  );
}
