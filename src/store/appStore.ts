import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, HouseData, Room, Opening, FurnitureItem, ProjectVersion } from '../types';
import { createNewProject, cloneHouseData } from '../utils/projectUtils';

const STORAGE_KEY = 'ai_future_home_projects';
const ACTIVE_KEY  = 'ai_future_home_active';

interface HistoryEntry { house: HouseData; }

interface AppStore {
  projects: Project[];
  activeProjectId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  sidebarTab: string;

  // Project CRUD
  loadProjects: () => void;
  saveProjects: () => void;
  createProject: (name: string, useDemo?: boolean) => string;
  openProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => string;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  // Active project helpers
  activeProject: () => Project | null;

  // House mutations (undoable)
  setHouse: (house: HouseData) => void;
  updateRoom: (room: Room) => void;
  addRoom: (room: Room) => void;
  deleteRoom: (id: string) => void;
  updateOpening: (o: Opening) => void;
  addOpening: (o: Opening) => void;
  deleteOpening: (id: string) => void;
  updateFurniture: (f: FurnitureItem) => void;
  addFurniture: (f: FurnitureItem) => void;
  deleteFurniture: (id: string) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Version history
  saveVersion: (label: string) => void;
  restoreVersion: (projectId: string, versionId: string) => void;

  setSidebarTab: (tab: string) => void;
}

function saveToStorage(projects: Project[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch { /* quota */ }
}

function loadFromStorage(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export const useAppStore = create<AppStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  history: [],
  historyIndex: -1,
  sidebarTab: 'dashboard',

  loadProjects() {
    const projects = loadFromStorage();
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (projects.length === 0) {
      // Bootstrap demo
      const demo = createNewProject('My First Home', true);
      projects.push(demo);
      saveToStorage(projects);
      const house = demo.house;
      set({ projects, activeProjectId: demo.id, history: [{ house }], historyIndex: 0 });
    } else {
      const active = projects.find(p => p.id === activeId) ?? projects[0];
      set({ projects, activeProjectId: active.id, history: [{ house: active.house }], historyIndex: 0 });
    }
  },

  saveProjects() { saveToStorage(get().projects); },

  createProject(name, useDemo = false) {
    const p = createNewProject(name, useDemo);
    set(s => {
      const projects = [...s.projects, p];
      saveToStorage(projects);
      return { projects, activeProjectId: p.id, history: [{ house: p.house }], historyIndex: 0 };
    });
    localStorage.setItem(ACTIVE_KEY, p.id);
    return p.id;
  },

  openProject(id) {
    const p = get().projects.find(x => x.id === id);
    if (!p) return;
    localStorage.setItem(ACTIVE_KEY, id);
    set({ activeProjectId: id, history: [{ house: p.house }], historyIndex: 0 });
  },

  renameProject(id, name) {
    set(s => {
      const projects = s.projects.map(p => p.id === id ? { ...p, name, updatedAt: Date.now() } : p);
      saveToStorage(projects);
      return { projects };
    });
  },

  duplicateProject(id) {
    const src = get().projects.find(p => p.id === id);
    if (!src) return id;
    const now = Date.now();
    const dup: Project = {
      ...JSON.parse(JSON.stringify(src)),
      id: uuidv4(),
      name: src.name + ' (Copy)',
      createdAt: now,
      updatedAt: now,
      versions: [],
    };
    set(s => {
      const projects = [...s.projects, dup];
      saveToStorage(projects);
      return { projects };
    });
    return dup.id;
  },

  deleteProject(id) {
    set(s => {
      const projects = s.projects.filter(p => p.id !== id);
      saveToStorage(projects);
      const activeProjectId = s.activeProjectId === id ? (projects[0]?.id ?? null) : s.activeProjectId;
      return { projects, activeProjectId };
    });
  },

  updateProject(id, updates) {
    set(s => {
      const projects = s.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p);
      saveToStorage(projects);
      return { projects };
    });
  },

  activeProject() {
    const { projects, activeProjectId } = get();
    return projects.find(p => p.id === activeProjectId) ?? null;
  },

  setHouse(house) {
    const id = get().activeProjectId;
    if (!id) return;
    set(s => {
      const { history, historyIndex } = s;
      const newHistory = [...history.slice(0, historyIndex + 1), { house }];
      const projects = s.projects.map(p => p.id === id ? { ...p, house, updatedAt: Date.now() } : p);
      saveToStorage(projects);
      return { projects, history: newHistory.slice(-50), historyIndex: Math.min(historyIndex + 1, 49) };
    });
  },

  updateRoom(room) {
    const proj = get().activeProject();
    if (!proj) return;
    const house = { ...proj.house, rooms: proj.house.rooms.map(r => r.id === room.id ? room : r) };
    get().setHouse(house);
  },

  addRoom(room) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({ ...proj.house, rooms: [...proj.house.rooms, room] });
  },

  deleteRoom(id) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({
      ...proj.house,
      rooms: proj.house.rooms.filter(r => r.id !== id),
      openings: proj.house.openings.filter(o => o.roomId !== id),
      furniture: proj.house.furniture.filter(f => f.roomId !== id),
    });
  },

  updateOpening(o) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({ ...proj.house, openings: proj.house.openings.map(x => x.id === o.id ? o : x) });
  },

  addOpening(o) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({ ...proj.house, openings: [...proj.house.openings, o] });
  },

  deleteOpening(id) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({ ...proj.house, openings: proj.house.openings.filter(o => o.id !== id) });
  },

  updateFurniture(f) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({ ...proj.house, furniture: proj.house.furniture.map(x => x.id === f.id ? f : x) });
  },

  addFurniture(f) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({ ...proj.house, furniture: [...proj.house.furniture, f] });
  },

  deleteFurniture(id) {
    const proj = get().activeProject();
    if (!proj) return;
    get().setHouse({ ...proj.house, furniture: proj.house.furniture.filter(f => f.id !== id) });
  },

  undo() {
    const { history, historyIndex, activeProjectId, projects } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const house = history[newIndex].house;
    const updatedProjects = projects.map(p => p.id === activeProjectId ? { ...p, house } : p);
    saveToStorage(updatedProjects);
    set({ historyIndex: newIndex, projects: updatedProjects });
  },

  redo() {
    const { history, historyIndex, activeProjectId, projects } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const house = history[newIndex].house;
    const updatedProjects = projects.map(p => p.id === activeProjectId ? { ...p, house } : p);
    saveToStorage(updatedProjects);
    set({ historyIndex: newIndex, projects: updatedProjects });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  saveVersion(label) {
    const proj = get().activeProject();
    if (!proj) return;
    const ver: ProjectVersion = { id: uuidv4(), timestamp: Date.now(), label, house: cloneHouseData(proj.house) };
    get().updateProject(proj.id, { versions: [...proj.versions, ver] });
  },

  restoreVersion(projectId, versionId) {
    const proj = get().projects.find(p => p.id === projectId);
    if (!proj) return;
    const ver = proj.versions.find(v => v.id === versionId);
    if (!ver) return;
    get().setHouse(cloneHouseData(ver.house));
  },

  setSidebarTab(tab) { set({ sidebarTab: tab }); },
}));
