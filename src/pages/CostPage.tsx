import React, { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { estimateCost, formatINR } from '../services/costService';
import { DollarSign, TrendingUp, Home, PieChart } from 'lucide-react';

const CAT_COLORS: Record<string, string> = {
  'Flooring': '#3b82f6', 'Wall Finish': '#8b5cf6', 'Ceiling': '#06b6d4',
  'Doors': '#f59e0b', 'Windows': '#10b981', 'Furniture': '#ef4444',
  'Lighting': '#fbbf24', 'Electrical': '#a855f7', 'Plumbing': '#22c55e',
  'Structure & Civil': '#64748b',
};

export function CostPage() {
  const project = useAppStore(s => s.activeProject());
  const { updateProject } = useAppStore();

  const estimate = useMemo(() => {
    if (!project) return null;
    return estimateCost(project.house);
  }, [project?.house]); // eslint-disable-line

  if (!project || !estimate) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open.
    </div>
  );

  const budget = project.budget ?? 5000000;
  const remaining = budget - estimate.total;
  const budgetPct = Math.min(100, (estimate.total / budget) * 100);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
          <DollarSign size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Cost Estimation</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Approximate construction & interior costs in INR</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Estimated', value: formatINR(estimate.total), color: '#3b82f6', icon: TrendingUp },
          { label: 'Per Sq Ft', value: `₹${estimate.perSqft.toLocaleString('en-IN')}`, color: '#8b5cf6', icon: Home },
          { label: 'Total Area', value: `${estimate.area.toFixed(0)} sq ft`, color: '#10b981', icon: PieChart },
          { label: 'Remaining Budget', value: formatINR(Math.abs(remaining)), color: remaining >= 0 ? '#10b981' : '#ef4444', icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="panel p-4 card-hover">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Budget */}
      <div className="panel p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Budget vs Estimate</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Budget:</span>
            <input
              type="number"
              value={budget}
              onChange={e => updateProject(project.id, { budget: Number(e.target.value) })}
              className="input-field px-2 py-1 rounded-lg text-xs w-32 text-right"
              step={100000}
            />
          </div>
        </div>
        <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${budgetPct}%`,
              background: budgetPct > 100 ? 'linear-gradient(90deg,#ef4444,#dc2626)' :
                          budgetPct > 80  ? 'linear-gradient(90deg,#f59e0b,#ef4444)' :
                                            'linear-gradient(90deg,#10b981,#3b82f6)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span style={{ color: 'var(--text-muted)' }}>₹0</span>
          <span style={{ color: remaining >= 0 ? '#10b981' : '#ef4444' }}>
            {remaining >= 0 ? `₹${remaining.toLocaleString('en-IN')} under budget` : `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{formatINR(budget)}</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Category Breakdown</h3>
          <div className="space-y-3">
            {estimate.categories.map(cat => {
              const pct = (cat.amount / estimate.total) * 100;
              const color = CAT_COLORS[cat.name] ?? '#6b7280';
              return (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatINR(cat.amount)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {pct.toFixed(1)}% · {cat.quantity.toFixed(0)} {cat.unit.replace('per ','')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual pie */}
        <div className="panel p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Cost Distribution</h3>
          <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
            {(() => {
              let cumAngle = -90 * (Math.PI / 180);
              return estimate.categories.map(cat => {
                const frac = cat.amount / estimate.total;
                const angle = frac * 2 * Math.PI;
                const r = 80, cx = 100, cy = 100;
                const x1 = cx + r * Math.cos(cumAngle);
                const y1 = cy + r * Math.sin(cumAngle);
                cumAngle += angle;
                const x2 = cx + r * Math.cos(cumAngle);
                const y2 = cy + r * Math.sin(cumAngle);
                const large = angle > Math.PI ? 1 : 0;
                const color = CAT_COLORS[cat.name] ?? '#6b7280';
                const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
                return <path key={cat.name} d={d} fill={color} stroke="rgba(10,15,26,0.8)" strokeWidth={2} opacity={0.85} />;
              });
            })()}
            <circle cx={100} cy={100} r={40} fill="var(--bg-card)" />
            <text x={100} y={96} textAnchor="middle" fontSize={9} fill="var(--text-muted)">Total</text>
            <text x={100} y={110} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--text-primary)">
              {formatINR(estimate.total)}
            </text>
          </svg>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {estimate.categories.map(cat => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[cat.name] ?? '#6b7280' }} />
                <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 panel p-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        * All estimates are approximate and based on standard INR construction rates for 2024.
        Actual costs may vary by location, materials, labour, and contractor.
      </div>
    </div>
  );
}
