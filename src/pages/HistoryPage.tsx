import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Save, RotateCcw, Download, Upload, Clock, Plus, FileJson, Image, FileText } from 'lucide-react';
import { estimateCost, formatINR } from '../services/costService';
import { analyzeDesign } from '../services/analysisService';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hrs > 0)   return `${hrs}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}

export function HistoryPage() {
  const project = useAppStore(s => s.activeProject());
  const { saveVersion, restoreVersion, saveProjects } = useAppStore();
  const [versionLabel, setVersionLabel] = useState('');
  const [msg, setMsg] = useState('');

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  // Export JSON
  const exportJSON = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${project.name}.json`; a.click();
    URL.revokeObjectURL(url);
    showMsg('Project exported as JSON');
  };

  // Import JSON
  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.house && data.name) {
            useAppStore.getState().updateProject(project!.id, { house: data.house, name: data.name });
            showMsg('Project imported successfully');
          }
        } catch { showMsg('Invalid JSON file'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Export floor plan as SVG snapshot (text-based)
  const exportSVG = () => {
    if (!project) return;
    const house = project.house;
    const G = 40;
    const pad = 20;
    const maxX = Math.max(...house.rooms.map(r => r.x + r.width)) * G + pad * 2;
    const maxY = Math.max(...house.rooms.map(r => r.y + r.height)) * G + pad * 2;

    const COLORS: Record<string, string> = {
      bedroom: '#6366f1', living: '#10b981', kitchen: '#f59e0b', bathroom: '#06b6d4',
      dining: '#ef4444', study: '#a855f7', corridor: '#94a3b8', balcony: '#22c55e',
    };

    const rects = house.rooms.map(room => {
      const color = COLORS[room.type] ?? '#888';
      return `<rect x="${room.x*G+pad}" y="${room.y*G+pad}" width="${room.width*G}" height="${room.height*G}"
        fill="${color}22" stroke="${color}" stroke-width="1.5" rx="2"/>
      <text x="${(room.x+room.width/2)*G+pad}" y="${(room.y+room.height/2)*G+pad+4}"
        text-anchor="middle" font-size="10" fill="${color}" font-family="sans-serif">${room.name}</text>`;
    }).join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" style="background:#0a0f1a">
      ${rects}
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${project.name}_floorplan.svg`; a.click();
    URL.revokeObjectURL(url);
    showMsg('Floor plan exported as SVG');
  };

  // Export report as HTML
  const exportReport = () => {
    if (!project) return;
    const cost = estimateCost(project.house);
    const analysis = analyzeDesign(project.house);
    const html = `<!DOCTYPE html>
<html><head><title>${project.name} - Design Report</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;color:#1f2937}
h1{color:#3b82f6}h2{color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:8px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border-bottom:1px solid #e5e7eb}
.score{font-size:2em;font-weight:bold;color:#3b82f6}.cat{margin:8px 0;padding:8px;background:#f9fafb;border-radius:6px}
</style></head><body>
<h1>🏠 ${project.name}</h1>
<p>Generated: ${new Date().toLocaleString()}</p>
<h2>Project Overview</h2>
<table>
<tr><th>Rooms</th><td>${project.house.rooms.length}</td></tr>
<tr><th>Total Area</th><td>${cost.area.toFixed(0)} sq ft</td></tr>
<tr><th>Total Est. Cost</th><td>${formatINR(cost.total)}</td></tr>
<tr><th>Per Sq Ft</th><td>₹${cost.perSqft.toLocaleString('en-IN')}</td></tr>
<tr><th>Design Score</th><td>${analysis.overallScore}/100</td></tr>
</table>
<h2>Rooms</h2>
<table><tr><th>Name</th><th>Type</th><th>Size</th><th>Area</th></tr>
${project.house.rooms.map(r=>`<tr><td>${r.name}</td><td>${r.type}</td><td>${r.width}×${r.height} ft</td><td>${r.width*r.height} sq ft</td></tr>`).join('')}
</table>
<h2>Cost Breakdown</h2>
${cost.categories.map(c=>`<div class="cat"><strong>${c.name}</strong>: ${formatINR(c.amount)}</div>`).join('')}
<h2>Design Analysis</h2>
<p>Overall: <span class="score">${analysis.overallScore}</span>/100</p>
${analysis.globalIssues.length ? `<h3>Issues</h3><ul>${analysis.globalIssues.map(i=>`<li>⚠️ ${i}</li>`).join('')}</ul>` : ''}
${analysis.globalSuggestions.length ? `<h3>Suggestions</h3><ul>${analysis.globalSuggestions.map(s=>`<li>💡 ${s}</li>`).join('')}</ul>` : ''}
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${project.name}_report.html`; a.click();
    URL.revokeObjectURL(url);
    showMsg('Report exported as HTML');
  };

  if (!project) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      No project open.
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
          <Save size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Version History & Export</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Snapshots, undo/redo, JSON/SVG/report export</p>
        </div>
      </div>

      {/* Message toast */}
      {msg && (
        <div className="mb-4 px-4 py-2 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
          ✓ {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Versions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Version Snapshots ({project.versions.length})
            </h3>
          </div>

          {/* Save new version */}
          <div className="panel p-4 mb-3">
            <div className="flex gap-2">
              <input
                value={versionLabel}
                onChange={e => setVersionLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && versionLabel.trim()) {
                    saveVersion(versionLabel.trim());
                    setVersionLabel('');
                    showMsg('Version saved');
                  }
                }}
                placeholder="Version label (e.g. v1.0, After changes…)"
                className="input-field flex-1 px-3 py-2 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  if (!versionLabel.trim()) return;
                  saveVersion(versionLabel.trim());
                  setVersionLabel('');
                  showMsg('Version saved');
                }}
                className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-1.5"
              >
                <Plus size={14} /> Save
              </button>
            </div>
          </div>

          {project.versions.length === 0 ? (
            <div className="panel p-8 text-center">
              <Clock size={32} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No versions saved yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...project.versions].reverse().map((ver, i) => (
                <div key={ver.id} className="panel p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                    v{project.versions.length - i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ver.label}</div>
                    <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={10} /> {timeAgo(ver.timestamp)} · {ver.house.rooms.length} rooms
                    </div>
                  </div>
                  <button
                    onClick={() => { restoreVersion(project.id, ver.id); showMsg(`Restored: ${ver.label}`); }}
                    className="btn-secondary px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1"
                  >
                    <RotateCcw size={11} /> Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export & Import</h3>
          {[
            { label: 'Export as JSON', desc: 'Full project data — can be re-imported', icon: FileJson, action: exportJSON, color: '#3b82f6' },
            { label: 'Import JSON',    desc: 'Load a previously exported project file', icon: Upload,   action: importJSON,  color: '#8b5cf6' },
            { label: 'Export Floor Plan (SVG)', desc: 'Vector image of the 2D floor plan', icon: Image, action: exportSVG, color: '#10b981' },
            { label: 'Export Design Report (HTML)', desc: 'Full report with analysis and costs', icon: FileText, action: exportReport, color: '#f59e0b' },
          ].map(({ label, desc, icon: Icon, action, color }) => (
            <button key={label} onClick={action} className="panel w-full p-4 flex items-center gap-4 card-hover text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <Download size={14} className="ml-auto flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}

          {/* Auto-save note */}
          <div className="panel p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Auto-Save Active</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              All changes are automatically saved to local storage.
              Your project will be restored when you reload the page.
              Last saved: {timeAgo(project.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
