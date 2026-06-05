import { create } from "zustand";
import { buildFence } from "../lib/geometry";
import type { Point, FenceItem, House } from "../lib/geometry";
import { PANEL_MODELS, getPanelsForSingleModel } from "../data/panels";
import type { PanelModel } from "../data/panels";
import { getCompatiblePillar, PILLAR_MODELS } from "../data/posts";
import type { PillarModel, PillarStyle } from "../data/posts";
import type { CityResult } from '../lib/delivery';
import type { Locale } from '../lib/i18n';

export type { Point, FenceItem, House };

export type FenceRow = {
  heightCm: number;
  panel: PanelModel;
};

export const FENCE_HEIGHTS_CM = [
  30, 50, 60, 80, 90, 100, 110, 120, 130, 140,
  150, 160, 180, 190, 200, 210, 220, 230, 240, 250,
];

// Какие панели влезают в оставшуюся высоту И после которых остаток набираем
export function getAvailablePanels(remainingCm: number): PanelModel[] {
  return PANEL_MODELS.filter((p) => {
    if (p.heightCm > remainingCm) return false;
    return canReach(remainingCm - p.heightCm);
  });
}

function canReach(targetCm: number): boolean {
  if (targetCm === 0) return true;
  if (targetCm < 0) return false;
  const heights = [...new Set(PANEL_MODELS.map((p) => p.heightCm))];
  const dp = new Array(targetCm + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= targetCm; i++) {
    for (const h of heights) {
      if (i >= h && dp[i - h]) { dp[i] = true; break; }
    }
  }
  return dp[targetCm];
}

export function getFilledHeight(rows: FenceRow[]): number {
  return rows.reduce((s, r) => s + r.heightCm, 0);
}


function makeRows(heightCm: number, panel: PanelModel): FenceRow[] {
  const count = Math.round(heightCm / panel.heightCm);
  return Array.from({ length: count }, () => ({ heightCm: panel.heightCm, panel }));
}

function getDefaultSinglePanel(heightCm: number): PanelModel {
  const compatible = getPanelsForSingleModel(heightCm);
  return compatible[0] ?? PANEL_MODELS[0];
}

const DEFAULT_HEIGHT = 150;

type DesignerStore = {
  // Забор
  boundaryPoints: Point[];
  fenceItems: FenceItem[];

  // Высота
  fenceHeightCm: number;

  // Панели
  singleModel: boolean;
  singlePanel: PanelModel;
  filledRows: FenceRow[];
  rows: FenceRow[];
  locale: Locale;        
  setLocale: (l: Locale) => void;

  deliveryCity: CityResult | null;
deliveryDistanceKm: number;
deliveryCost: number;
setDeliveryCity: (city: CityResult | null, distanceKm: number, cost: number) => void;
  

  //color
  concreteColor: 'grey' | 'white' | string;
  setConcreteColor: (color: string) => void;

  // Пиллар
  selectedPillarStyle: PillarStyle;
  activePillar: PillarModel;

  panelOrientation: 'outward' | 'inward';
  setPanelOrientation: (v: 'outward' | 'inward') => void;
    groundType: 'grass' | 'calcada' | 'ground' | 'grid';
  setGroundType: (v: 'grass' | 'calcada' | 'ground' | 'grid') => void;

  // Дома
  houses: House[];

  // Инструмент
  activeTool: "fence" | "house";

  // Actions — забор
  addPoint: (p: Point) => void;
  setFenceHeight: (cm: number) => void;
  setSingleModel: (val: boolean) => void;
  setSinglePanel: (panel: PanelModel) => void;
  setFilledRow: (rowIndex: number, panel: PanelModel) => void;
  resetFilledRows: () => void;
  setSelectedPillarStyle: (style: PillarStyle) => void;
  rebuildFence: () => void;
  clearAll: () => void;

  // Actions — дома
  setActiveTool: (tool: "fence" | "house") => void;
  addHouse: (x: number, z: number) => void;
  updateHouse: (id: string, patch: Partial<House>) => void;
  removeHouse: (id: string) => void;
};

export const useDesignerStore = create<DesignerStore>((set, get) => ({
  boundaryPoints: [],
  fenceItems: [],
  fenceHeightCm: DEFAULT_HEIGHT,
  singleModel: true,
  singlePanel: getDefaultSinglePanel(DEFAULT_HEIGHT),
  filledRows: [],
  rows: [],
  selectedPillarStyle: "smooth",
  activePillar: getCompatiblePillar("smooth", DEFAULT_HEIGHT),
  panelOrientation: 'outward',
  houses: [],
  activeTool: "fence",
  concreteColor: 'grey',
setPanelOrientation: (v) => set({ panelOrientation: v }),
setConcreteColor: (color) => set({ concreteColor: color }),
groundType: 'grid',
  setGroundType: (v) => set({ groundType: v }),
  deliveryCity: null,
deliveryDistanceKm: 0,
deliveryCost: 0,
locale: 'en',

  // ─── Забор ────────────────────────────────────────────────────────────────

  addPoint: (p) => set((s) => ({ boundaryPoints: [...s.boundaryPoints, p] })),
  // Delivery

setDeliveryCity: (city: CityResult | null, distanceKm: number, cost: number) =>
  set({ deliveryCity: city, deliveryDistanceKm: distanceKm, deliveryCost: cost }),

  setFenceHeight: (cm) => {
    const { selectedPillarStyle } = get();
    const compatible = getPanelsForSingleModel(cm);
    const currentSingle = get().singlePanel;
    const newSinglePanel = compatible.find((p) => p.id === currentSingle.id)
      ?? compatible[0]
      ?? PANEL_MODELS[0];
    const canBeSingle = compatible.length > 0;
    const singleModel = canBeSingle ? get().singleModel : false;

    set({
      fenceHeightCm: cm,
      activePillar: getCompatiblePillar(selectedPillarStyle, cm),
      singlePanel: newSinglePanel,
      singleModel,
      filledRows: [],
      rows: [],
    });
    get().rebuildFence();
  },
setLocale: (locale) => set({ locale }),
  setSingleModel: (val) => {
    set({ singleModel: val, filledRows: [], rows: [] });
    get().rebuildFence();
  },

  setSinglePanel: (panel) => {
    const { fenceHeightCm } = get();
    const rows = makeRows(fenceHeightCm, panel);
    set({ singlePanel: panel, rows });
    get().rebuildFence();
  },

  setFilledRow: (rowIndex, panel) => {
    const { fenceHeightCm, filledRows } = get();
    const newFilled = filledRows.slice(0, rowIndex);
    newFilled.push({ heightCm: panel.heightCm, panel });

    const filledHeight = getFilledHeight(newFilled);
    const complete = filledHeight === fenceHeightCm;

    set({ filledRows: newFilled, rows: newFilled });

    if (complete) get().rebuildFence();
    else set({ fenceItems: [] });
  },

  resetFilledRows: () => {
    set({ filledRows: [], rows: [] });
    set({ fenceItems: [] });
  },

  setSelectedPillarStyle: (style) => {
    const { fenceHeightCm } = get();
    set({
      selectedPillarStyle: style,
      activePillar: getCompatiblePillar(style, fenceHeightCm),
    });
  },

  rebuildFence: () => {
  const { boundaryPoints, fenceHeightCm, rows, singleModel, singlePanel, houses } = get();
  if (boundaryPoints.length < 2) { set({ fenceItems: [] }); return; }

  // ← singleModel всегда строит из singlePanel, не требует заполненных rows
  const activeRows = singleModel
    ? makeRows(fenceHeightCm, singlePanel)
    : rows;

  if (!singleModel && activeRows.length === 0) { set({ fenceItems: [] }); return; }

  const rowHeightsCm = activeRows.map((r) => r.heightCm);
  set({
    fenceItems: buildFence(boundaryPoints, fenceHeightCm / 100, rowHeightsCm, houses),
    rows: activeRows, // ← сохраняем актуальные rows в стор
  });
},

  clearAll: () => set({
    boundaryPoints: [],
    fenceItems: [],
    filledRows: [],
    rows: [],
    houses: [],
  }),

  // ─── Дома ─────────────────────────────────────────────────────────────────

  setActiveTool: (tool) => set({ activeTool: tool }),

  addHouse: (x, z) => {
    const house: House = {
      id: crypto.randomUUID(),
      x, z,
      widthPx: 200,
      depthPx: 150,
    };
    set((s) => ({ houses: [...s.houses, house] }));
  },

  updateHouse: (id, patch) => {
    set((s) => ({
      houses: s.houses.map((h) => h.id === id ? { ...h, ...patch } : h),
    }));
    get().rebuildFence();
  },

  removeHouse: (id) => {
    set((s) => ({ houses: s.houses.filter((h) => h.id !== id) }));
    get().rebuildFence();
  },
}));