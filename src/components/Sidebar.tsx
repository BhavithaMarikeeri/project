import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PenLine, Box, Footprints, Brain,
  Sun, DollarSign, FlaskConical, Sofa, Save, Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/editor',     icon: PenLine,          label: 'Floor Plan' },
  { to: '/viewer3d',   icon: Box,              label: '3D View' },
  { to: '/walkthrough',icon: Footprints,       label: 'Walkthrough' },
  { to: '/analysis',   icon: Brain,            label: 'AI Analysis' },
  { to: '/sunlight',   icon: Sun,              label: 'Sunlight' },
  { to: '/cost',       icon: DollarSign,       label: 'Cost Estimate' },
  { to: '/simulation', icon: FlaskConical,     label: 'What-If' },
  { to: '/furniture',  icon: Sofa,             label: 'Furniture' },
  { to: '/history',    icon: Save,             label: 'History' },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 64 : 220,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        minWidth: collapsed ? 64 : 220,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}
        >
          <span className="text-white text-sm font-bold">AI</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Future</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Home Designer</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto p-1 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-item ${active ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      {!collapsed && (
        <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          AI Future Home v1.0
        </div>
      )}
    </aside>
  );
}
