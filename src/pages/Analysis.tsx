import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { analyzeDesign } from '../services/analysisService';
import {
  Brain, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronRight,
  Lightbulb, Target, Accessibility, Link2, Sun
} from 'lucide-react';

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${progress} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={color}>
        {score}
      </text>
    </svg>
  );
}

export function Analysis() {
  const project = useAppStore(s => s.activeProject());
  const [expanded, setExpanded] = useState<string | null>(null);

  const analysis = useMemo(() => {
    if (!project) return null;
    return analyzeDesign(project.house);
  }, [project?.house]); // eslint-disable-line

  if (!project) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open.
    </div>
  );
  if (!analysis) return null;

  const scores = [
    { label: 'Overall',       value: analysis.overallScore,       icon: Target,       color: '#3b82f6' },
    { label: 'Spacing',       value: analysis.spacingScore,       icon: Lightbulb,    color: '#8b5cf6' },
    { label: 'Accessibility', value: analysis.accessibilityScore, icon: Accessibility, color: '#10b981' },
    { label: 'Connectivity',  value: analysis.connectivityScore,  icon: Link2,        color: '#06b6d4' },
    { label: 'Lighting',      value: analysis.lightingScore,      icon: Sun,          color: '#f59e0b' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Design Analysis</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Deterministic analysis of your floor plan</p>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {scores.map(s => (
          <div key={s.label} className="panel p-4 flex flex-col items-center gap-2 card-hover">
            <ScoreRing score={s.value} />
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Global issues */}
      {(analysis.globalIssues.length > 0 || analysis.globalSuggestions.length > 0) && (
        <div className="panel p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Overall Design Feedback</h3>
          {analysis.globalIssues.map((iss, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 text-sm">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{iss}</span>
            </div>
          ))}
          {analysis.globalSuggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 text-sm">
              <Lightbulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#06b6d4' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Per-room analysis */}
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Room-by-Room Analysis</h3>
      <div className="space-y-2">
        {analysis.rooms.map(ra => {
          const room = project.house.rooms.find(r => r.id === ra.roomId);
          if (!room) return null;
          const isOpen = expanded === ra.roomId;
          const scoreColor = ra.score >= 80 ? '#10b981' : ra.score >= 60 ? '#f59e0b' : '#ef4444';

          return (
            <div key={ra.roomId} className="panel overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpanded(isOpen ? null : ra.roomId)}
              >
                <ScoreRing score={ra.score} size={44} />
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{room.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {room.type} · {room.width}×{room.height} ft · {ra.issues.length} issues
                  </div>
                </div>
                {ra.issues.length > 0 && (
                  <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                )}
                {ra.issues.length === 0 && (
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                )}
                {isOpen ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="pt-3 space-y-2">
                    {ra.issues.length === 0 && ra.suggestions.length === 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>No issues found — great design!</span>
                      </div>
                    )}
                    {ra.issues.map((iss, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{iss}</span>
                      </div>
                    ))}
                    {ra.suggestions.map((sug, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Info size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#06b6d4' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
