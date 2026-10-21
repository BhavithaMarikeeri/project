import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { FloorPlanEditor } from './pages/FloorPlanEditor';
import { Viewer3D } from './pages/Viewer3D';
import { Walkthrough } from './pages/Walkthrough';
import { Analysis } from './pages/Analysis';
import { SunlightPage } from './pages/SunlightPage';
import { CostPage } from './pages/CostPage';
import { SimulationPage } from './pages/SimulationPage';
import { FurniturePage } from './pages/FurniturePage';
import { HistoryPage } from './pages/HistoryPage';
import { useAppStore } from './store/appStore';

function AppLayout() {
  const loadProjects = useAppStore(s => s.loadProjects);
  React.useEffect(() => { loadProjects(); }, [loadProjects]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/editor"      element={<FloorPlanEditor />} />
            <Route path="/viewer3d"    element={<Viewer3D />} />
            <Route path="/walkthrough" element={<Walkthrough />} />
            <Route path="/analysis"    element={<Analysis />} />
            <Route path="/sunlight"    element={<SunlightPage />} />
            <Route path="/cost"        element={<CostPage />} />
            <Route path="/simulation"  element={<SimulationPage />} />
            <Route path="/furniture"   element={<FurniturePage />} />
            <Route path="/history"     element={<HistoryPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
