import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { getScenarios, runSimulation } from '../services/simulationService';
import { formatINR } from '../services/costService';
import type { SimResult, SimScenario } from '../types';
import {
  FlaskConical, Play, Check, X, ArrowRight, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react';

function DiffBadge({ a, b, label, format = (v: number) => String(v.toFixed(1)), higher = 'good' }: {
  a: number; b: number; label: string; format?: (v: number) => string; higher?: 'good' | 'bad';
}) {
  const diff = b - a;
  const isGood = higher === 'good' ? diff > 0 : diff < 0;
  const color = Math.abs(diff) < 0.5 ? '#94a3b8' : isGood ? '#10b981' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{format(b)}</span>
      {Math.abs(diff) >= 0.5 && (
        <span className="text-xs font-medium flex items-center gap-0.5" style={{ color }}>
          {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {diff > 0 ? '+' : ''}{format(diff)}
        </span>
      )}
    </div>
  );
}

export function SimulationPage() {
  const project = useAppStore(s => s.activeProject());
  const store   = useAppStore();
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [applied, setApplied] = useState(false);

  const scenarios = useMemo(() => {
    if (!project) return [];
    return getScenarios(project.house);
  }, [project?.house]); // eslint-disable-line

  const runScenario = (scenario: SimScenario) => {
    if (!project) return;
    setRunning(true);
    setApplied(false);
    setTimeout(() => {
      const res = runSimulation(project.house, scenario);
      setResult(res);
      setRunning(false);
    }, 400);
  };

  const applyResult = () => {
    if (!result) return;
    store.setHouse(result.proposed);
    setApplied(true);
  };

  const discardResult = () => {
    setResult(null);
    setApplied(false);
  };

  if (!project) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open.
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)' }}>
          <FlaskConical size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>What-If Simulation</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Clone your design, try changes, compare results, and choose to apply or discard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenarios */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Available Scenarios</h3>
          <div className="space-y-2">
            {scenarios.map(scenario => (
              <div key={scenario.id} className="panel p-4 card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {scenario.title}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {scenario.description}
                    </div>
                    <div className="mt-2">
                      <span className="tag" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                        {scenario.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => runScenario(scenario)}
                    disabled={running}
                    className="btn-primary px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 flex-shrink-0"
                  >
                    {running ? (
                      <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        <div>
          {!result && !running && (
            <div className="panel p-8 h-full flex flex-col items-center justify-center text-center">
              <FlaskConical size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mb-3" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Select and run a scenario to see a comparison
              </p>
            </div>
          )}
          {running && (
            <div className="panel p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mb-4" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Simulating…</p>
            </div>
          )}
          {result && !running && (
            <div className="space-y-4 animate-fade-in">
              <div className="panel p-4">
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {result.scenario.title}
                </h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  {result.scenario.description}
                </p>

                {/* Comparison table */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>ORIGINAL</div>
                    <DiffBadge a={0} b={result.originalAnalysis.overallScore} label="Design Score" />
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs mb-2 font-medium" style={{ color: '#60a5fa' }}>PROPOSED</div>
                    <DiffBadge
                      a={result.originalAnalysis.overallScore}
                      b={result.proposedAnalysis.overallScore}
                      label="Design Score"
                      higher="good"
                    />
                  </div>
                </div>

                {/* Metric comparison grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl mb-4"
                  style={{ background: 'var(--bg-elevated)' }}>
                  {[
                    { label: 'Area (sq ft)',  a: result.original.rooms.reduce((s,r)=>s+r.width*r.height,0),  b: result.proposed.rooms.reduce((s,r)=>s+r.width*r.height,0),  format: (v: number) => v.toFixed(0) },
                    { label: 'Est. Cost',     a: result.originalCost.total / 100000,  b: result.proposedCost.total / 100000,  format: (v: number) => `₹${v.toFixed(1)}L`, higher: 'bad' as const },
                    { label: 'Lighting',      a: result.originalAnalysis.lightingScore, b: result.proposedAnalysis.lightingScore },
                    { label: 'Accessibility', a: result.originalAnalysis.accessibilityScore, b: result.proposedAnalysis.accessibilityScore },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                      <div className="flex items-center gap-2 justify-center text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>{(m.format ?? ((v: number) => v.toFixed(1)))(m.a)}</span>
                        <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: m.b >= m.a ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                          {(m.format ?? ((v: number) => v.toFixed(1)))(m.b)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {!applied ? (
                  <div className="flex gap-2">
                    <button
                      onClick={applyResult}
                      className="btn-primary flex-1 py-2 rounded-xl text-sm flex items-center gap-2 justify-center"
                    >
                      <Check size={14} /> Apply to Project
                    </button>
                    <button onClick={discardResult} className="btn-secondary flex-1 py-2 rounded-xl text-sm flex items-center gap-2 justify-center">
                      <X size={14} /> Discard
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <Check size={14} style={{ color: '#10b981' }} />
                    <span className="text-sm" style={{ color: '#10b981' }}>Changes applied to project</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
