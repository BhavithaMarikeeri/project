import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { simulateSunlight } from '../services/sunlightService';
import { Sun, Moon, Compass } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function SunIcon({ elevation }: { elevation: number }) {
  const y = Math.min(100, Math.max(0, 100 - (elevation / 90) * 100));
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${elevation > 10 ? '#1e3a5f' : '#05060a'}, ${elevation > 20 ? '#87CEEB' : '#0a0f1a'})` }}>
      {elevation > 0 && (
        <div
          className="absolute w-8 h-8 rounded-full"
          style={{
            background: elevation > 20 ? '#fbbf24' : '#f97316',
            boxShadow: `0 0 20px ${elevation > 20 ? '#fbbf24' : '#f97316'}`,
            left: '50%', top: `${y}%`,
            transform: 'translate(-50%,-50%)',
            transition: 'all 0.3s ease',
          }}
        />
      )}
      {elevation <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Moon size={20} style={{ color: '#94a3b8' }} />
        </div>
      )}
    </div>
  );
}

export function SunlightPage() {
  const project = useAppStore(s => s.activeProject());
  const store = useAppStore();
  const [hour, setHour]   = useState(12);
  const [month, setMonth] = useState(5);
  const [northDeg, setNorthDeg] = useState(0);

  const data = useMemo(() => {
    if (!project) return null;
    const house = { ...project.house, orientation: { northDeg } };
    return simulateSunlight(house, hour, month);
  }, [project?.house, hour, month, northDeg]); // eslint-disable-line

  // Update north orientation
  const applyOrientation = () => {
    const p = project;
    if (!p) return;
    const updated = { ...p.house, orientation: { northDeg } };
    store.setHouse(updated);
  };

  if (!project) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open.
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          <Sun size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Sunlight Simulation</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Physics-based daylight estimates for each room</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="panel p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Time of Day</h3>
            <SunIcon elevation={data?.sunElevation ?? 0} />
            <div className="mt-3">
              <input type="range" min={0} max={23} value={hour}
                onChange={e => setHour(Number(e.target.value))}
                className="w-full" />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>Midnight</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {String(hour).padStart(2,'0')}:00
                </span>
                <span>Midnight</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1">
              {[6,9,12,15,18,21].map(h => (
                <button key={h} onClick={() => setHour(h)}
                  className="text-xs py-1 rounded-lg"
                  style={{
                    background: hour === h ? 'rgba(245,158,11,0.2)' : 'var(--bg-elevated)',
                    color: hour === h ? '#fbbf24' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Month</h3>
            <div className="grid grid-cols-4 gap-1">
              {MONTHS.map((m, i) => (
                <button key={m} onClick={() => setMonth(i)}
                  className="text-xs py-1.5 rounded-lg"
                  style={{
                    background: month === i ? 'rgba(245,158,11,0.2)' : 'var(--bg-elevated)',
                    color: month === i ? '#fbbf24' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Compass size={14} /> House Orientation
            </h3>
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>North direction: {northDeg}°</div>
            <input type="range" min={0} max={359} value={northDeg}
              onChange={e => setNorthDeg(Number(e.target.value))}
              className="w-full" />
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[['N',0],['E',90],['S',180],['W',270]].map(([label, deg]) => (
                <button key={label} onClick={() => setNorthDeg(Number(deg))}
                  className="text-xs py-1 rounded-lg"
                  style={{
                    background: northDeg === deg ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
                    color: northDeg === deg ? '#60a5fa' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={applyOrientation} className="btn-primary w-full mt-3 py-2 rounded-lg text-xs">
              Apply to Project
            </button>
          </div>
        </div>

        {/* Room daylight cards */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Room Daylight — {MONTHS[month]}, {String(hour).padStart(2,'0')}:00
          </h3>
          {data && (
            <div className="mb-4 panel p-4 flex gap-4 text-sm">
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sun Elevation</div>
                <div className="font-bold" style={{ color: '#fbbf24' }}>{data.sunElevation.toFixed(1)}°</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sun Azimuth</div>
                <div className="font-bold" style={{ color: '#fbbf24' }}>{data.sunAzimuth.toFixed(0)}°</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Condition</div>
                <div className="font-bold" style={{ color: data.sunElevation > 10 ? '#10b981' : '#94a3b8' }}>
                  {data.sunElevation > 20 ? 'Sunny' : data.sunElevation > 5 ? 'Low Sun' : 'No Sun'}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {project.house.rooms.map(room => {
              const rd = data?.rooms.find(r => r.roomId === room.id);
              const pct = rd?.daylightPct ?? 0;
              const lux = rd?.lux ?? 0;
              const barColor = pct > 60 ? '#fbbf24' : pct > 30 ? '#f59e0b' : pct > 0 ? '#f97316' : '#4b5563';
              return (
                <div key={room.id} className="panel p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{room.name}</span>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{lux.toLocaleString()} lux</span>
                      <span className="font-bold" style={{ color: barColor }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {project.house.openings.filter(o => o.roomId === room.id && o.type === 'window').length} window(s)
                    · {room.width}×{room.height} ft
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
