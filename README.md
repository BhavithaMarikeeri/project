# 🏠 AI Future Home

**AI-Powered Virtual Home Design, Simulation & Immersive 3D Walkthrough**

A complete, production-quality home design application built with React, Vite, TypeScript, Tailwind CSS v4, and Three.js. No paid APIs required — all core features work offline with local storage.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

---

## ✨ Features

### 1. Dashboard & Projects
- Create, open, rename, duplicate, and delete projects
- Auto-seeded demo house ("My First Home") on first launch
- Project cards with room count, area, estimated cost
- Auto-save to localStorage — survives page refresh

### 2. Interactive 2D Floor Plan Editor
- Draw rooms by clicking & dragging on the grid canvas
- Move rooms by dragging, resize via 8 handles
- Add doors and windows to any wall side
- Drag furniture around rooms
- Quick-Add panel with 20 furniture types
- Grid overlay, zoom (scroll), pan (Alt+drag), undo/redo (Ctrl+Z/Y)
- Room type color coding, dimension labels

### 3. Real 3D House Generator
- Converts 2D floor plan to full 3D scene via Three.js
- Walls with door/window cutouts, floor materials, ceiling
- Furniture as 3D boxes with type-specific colors
- Dynamic lighting: time-of-day slider changes sun position/color
- Orbit camera: drag to rotate, scroll to zoom

### 4. First-Person Walkthrough
- Click the canvas to enter pointer-lock immersive mode
- **WASD** / arrow keys to move, **Mouse** to look
- Human-height camera (1.65m), real collision detection with walls and furniture
- Minimap overlay, FPS counter, quality settings (Low/Medium/High)
- ESC to exit

### 5. AI Design Analysis
- Deterministic algorithm — no API key required
- Scores: Overall, Spacing, Accessibility, Connectivity, Lighting
- Per-room issues: blocked doors, missing windows, overcrowding, missing fixtures
- Global issues: rooms without doors, missing bathrooms, etc.
- Expandable accordion per room

### 6. Sunlight Simulation
- Physics-based solar position (declination, elevation, azimuth for India ~20°N)
- Time-of-day slider (0–23h), month selector
- House orientation control (N/S/E/W + degree slider)
- Per-room daylight % and lux estimates based on window count and orientation
- Sun position visualization widget

### 7. Cost Estimation (INR)
- Flooring, Wall Finish, Ceiling, Doors, Windows, Furniture, Lighting, Electrical, Plumbing, Structural
- Budget input with over/under indicator
- Bar charts per category + SVG pie chart
- Formatted in ₹ Lakhs and ₹ Crores

### 8. What-If Simulation
- 5 scenario types: Expand Room, Rearrange Furniture, Add Window, Improve Study, Open-Plan Kitchen
- Non-destructive: clones house before modifying
- Side-by-side comparison: design score, area, cost, lighting, accessibility
- Apply or Discard — original design preserved until you choose Apply

### 9. Furniture Library
- 30+ items across 7 categories: Seating, Bedroom, Work, Living, Dining, Kitchen, Bathroom
- Search & filter by category
- Room selector dropdown — choose which room to add to
- SVG procedural preview per item
- One-click add with confirmation

### 10. Version History & Export
- Save named version snapshots at any point
- Restore any previous version
- Export: JSON (full project), SVG (floor plan image), HTML report
- Import: JSON project file
- Auto-save status indicator

---

## 🏗️ Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| 3D | Three.js |
| State | Zustand |
| Routing | React Router DOM |
| Icons | Lucide React |
| IDs | uuid |

---

## 📁 Project Structure

```
src/
├── types/index.ts          # Shared data models
├── store/appStore.ts       # Zustand global state + localStorage persistence
├── services/
│   ├── analysisService.ts  # AI design analysis (deterministic)
│   ├── costService.ts      # INR cost estimation
│   ├── sunlightService.ts  # Physics-based solar simulation
│   └── simulationService.ts # What-if scenario engine
├── utils/projectUtils.ts   # Demo seed, area calc, deep clone
├── components/
│   ├── Sidebar.tsx         # Collapsible navigation
│   └── TopBar.tsx          # Top header bar
└── pages/
    ├── Dashboard.tsx        # Project management
    ├── FloorPlanEditor.tsx  # 2D SVG editor
    ├── Viewer3D.tsx         # Three.js orbit viewer
    ├── Walkthrough.tsx      # First-person walkthrough
    ├── Analysis.tsx         # AI scoring
    ├── SunlightPage.tsx     # Sunlight simulation
    ├── CostPage.tsx         # Cost breakdown
    ├── SimulationPage.tsx   # What-if scenarios
    ├── FurniturePage.tsx    # Furniture catalog
    └── HistoryPage.tsx      # Versions + export
```

---

## ⚙️ Environment Variables

No API keys required for core features. Optional future integrations:

```env
# .env (optional)
VITE_AI_API_KEY=         # External AI model (not required)
VITE_DB_URL=             # Database for cloud sync (not required)
```

---

## 📋 Notes

- All estimates are approximate; real construction costs vary by region and contractor.
- The 3D scene is built procedurally from the 2D floor plan — changes sync automatically.
- LocalStorage is used for persistence; export JSON to back up important projects.
- Tested on Chrome/Edge on Windows. Firefox may have minor WebGL differences.
