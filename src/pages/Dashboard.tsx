import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { calcTotalArea } from '../utils/projectUtils';
import { formatINR, estimateCost } from '../services/costService';
import {
  Plus, FolderOpen, Copy, Trash2, Home, Edit3,
  LayoutDashboard, Clock, Layers, DollarSign, Star
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }: { icon: React.FC<{ size?: number; color?: string }>, label: string, value: string, color: string }) {
  return (
    <div className="panel p-4 flex items-center gap-4 card-hover">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22` }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { projects, createProject, openProject, renameProject, duplicateProject, deleteProject } = useAppStore();
  const activeProjectId = useAppStore(s => s.activeProjectId);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createProject(newName.trim(), false);
    setCreating(false);
    setNewName('');
    openProject(id);
    navigate('/editor');
  };

  const handleOpen = (id: string) => {
    openProject(id);
    navigate('/editor');
  };

  const activeProject = projects.find(p => p.id === activeProjectId);
  const totalProjects = projects.length;
  const totalRooms = activeProject?.house.rooms.length ?? 0;
  const totalArea  = activeProject ? calcTotalArea(activeProject.house) : 0;
  const cost       = activeProject ? estimateCost(activeProject.house) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Hero */}
      <div
        className="rounded-2xl p-8 mb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1a1040 100%)', border: '1px solid var(--border-normal)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', transform: 'translate(30%,-30%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              <Home size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
              AI-POWERED
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            AI Future Home
          </h1>
          <p className="text-base mb-6 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            Design, simulate, and walk through your dream home with AI-powered tools.
            Real-time 3D generation, cost estimation, and immersive walkthroughs.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCreating(true)}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              <Plus size={16} /> New Project
            </button>
            {activeProject && (
              <button
                onClick={() => { navigate('/editor'); }}
                className="btn-secondary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
              >
                <Edit3 size={16} /> Continue Editing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={LayoutDashboard} label="Projects" value={String(totalProjects)} color="#3b82f6" />
        <StatCard icon={Layers} label="Rooms" value={String(totalRooms)} color="#8b5cf6" />
        <StatCard icon={Home} label="Area (sq ft)" value={totalArea.toFixed(0)} color="#10b981" />
        <StatCard icon={DollarSign} label="Est. Cost" value={cost ? formatINR(cost.total) : '—'} color="#f59e0b" />
      </div>

      {/* Create modal inline */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="panel p-6 w-96 animate-fade-in">
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Create New Project</h3>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Project name…"
              className="input-field w-full px-3 py-2 rounded-lg text-sm mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn-primary px-4 py-2 rounded-lg text-sm flex-1">Create</button>
              <button onClick={() => { setCreating(false); createProject(newName || 'Demo Home', true); navigate('/editor'); }}
                className="btn-secondary px-4 py-2 rounded-lg text-sm flex-1">
                Use Demo
              </button>
              <button onClick={() => setCreating(false)} className="btn-secondary px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Your Projects</h2>
        <button
          onClick={() => setCreating(true)}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary"
        >
          <Plus size={13} /> New
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="panel p-12 text-center">
          <Home size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No projects yet. Create your first home!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(proj => {
            const area   = calcTotalArea(proj.house);
            const cost   = estimateCost(proj.house);
            const isActive = proj.id === activeProjectId;
            return (
              <div
                key={proj.id}
                className={`panel card-hover cursor-pointer group relative ${isActive ? 'glow-blue' : ''}`}
                style={{ borderColor: isActive ? 'rgba(59,130,246,0.5)' : undefined }}
              >
                {/* Thumbnail */}
                <div
                  className="h-36 rounded-t-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a1040)' }}
                >
                  <Home size={40} style={{ color: 'rgba(59,130,246,0.4)' }} />
                  {isActive && (
                    <span className="absolute top-3 left-3 tag" style={{ background: 'rgba(59,130,246,0.25)', color: '#60a5fa' }}>
                      <Star size={10} className="mr-1" /> Active
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {renaming === proj.id ? (
                    <input
                      autoFocus
                      value={renameVal}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { renameProject(proj.id, renameVal); setRenaming(null); }
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      className="input-field w-full px-2 py-1 rounded text-sm mb-2"
                    />
                  ) : (
                    <h3 className="text-sm font-semibold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{proj.name}</h3>
                  )}
                  <div className="flex flex-wrap gap-x-3 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    <span>{proj.house.rooms.length} rooms</span>
                    <span>{area.toFixed(0)} sq ft</span>
                    <span>{formatINR(cost.total)}</span>
                  </div>
                  <div className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={11} /> {new Date(proj.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpen(proj.id)}
                      className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 flex-1"
                    >
                      <FolderOpen size={12} /> Open
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setRenaming(proj.id); setRenameVal(proj.name); }}
                      className="btn-secondary px-2 py-1.5 rounded-lg text-xs"
                      title="Rename"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); duplicateProject(proj.id); }}
                      className="btn-secondary px-2 py-1.5 rounded-lg text-xs"
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); setDelConfirm(proj.id); }}
                        className="px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-red-500/10"
                        style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="panel p-6 w-80 animate-fade-in">
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Project?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { deleteProject(delConfirm); setDelConfirm(null); }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                Delete
              </button>
              <button onClick={() => setDelConfirm(null)} className="btn-secondary flex-1 px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
