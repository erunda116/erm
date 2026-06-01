import { create } from "zustand";
import { buildFence } from "../lib/geometry";
import type { Point, FenceItem } from "../lib/geometry";
import { PANEL_MODELS, getPanelsForSingleModel } from "../data/panels";
import type { PanelModel } from "../data/panels";
import { getCompatiblePillar } from "../data/posts";
import type { PillarModel, PillarStyle } from "../data/posts";

export type { Point, FenceItem };

export type FenceRow = {
  heightCm: number;
  panel: PanelModel;
};

export const FENCE_HEIGHTS_CM = [
  30, 50, 60, 80, 90, 110, 120, 130, 140,
  150, 160, 180, 190, 200, 210, 220, 230, 240, 250,
];

// Какие панели влезают в оставшуюся высоту
export function getAvailablePanels(remainingCm: number): PanelModel[] {
  return PANEL_MODELS.filter((p) => {
    if (p.heightCm > remainingCm) return false;
    const afterThis = remainingCm - p.heightCm;
    // После выбора этой панели остаток должен быть набираем
    // (0 = готово, или можно набрать комбинацией 50 и 30)
    return canReach(afterThis);
  });
}

// Проверяем можно ли набрать высоту комбинацией доступных панелей
function canReach(targetCm: number): boolean {
  if (targetCm === 0) return true;
  if (targetCm < 0) return false;
  const heights = [...new Set(PANEL_MODELS.map((p) => p.heightCm))]; // [50, 30]
  // Динамическое программирование
  const dp = new Array(targetCm + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= targetCm; i++) {
    for (const h of heights) {
      if (i >= h && dp[i - h]) { dp[i] = true; break; }
    }
  }
  return dp[targetCm];
}

// Текущая заполненная высота
export function getFilledHeight(rows: FenceRow[]): number {
  return rows.reduce((s, r) => s + r.heightCm, 0);
}

function makeRows(heightCm: number, panel: PanelModel): FenceRow[] {
  const rows: FenceRow[] = [];
  let remaining = heightCm;
  while (remaining > 0) {
    const h = remaining >= 50 ? 50 : 30;
    rows.push({ heightCm: h, panel });
    remaining -= h;
  }
  return rows;
}

function getDefaultSinglePanel(heightCm: number): PanelModel {
  const compatible = getPanelsForSingleModel(heightCm);
  return compatible[0] ?? PANEL_MODELS[0];
}

const DEFAULT_HEIGHT = 150;

type DesignerStore = {
  boundaryPoints: Point[];
  fenceItems: FenceItem[];
  fenceHeightCm: number;
  singleModel: boolean;
  singlePanel: PanelModel;

  // Динамические ряды — только заполненные пользователем
  filledRows: FenceRow[];
  // Для buildFence — все ряды (включая незаполненные — не используем)
  rows: FenceRow[];

  selectedPillarStyle: PillarStyle;
  activePillar: PillarModel;

  addPoint: (p: Point) => void;
  setFenceHeight: (cm: number) => void;
  setSingleModel: (val: boolean) => void;
  setSinglePanel: (panel: PanelModel) => void;
  setFilledRow: (rowIndex: number, panel: PanelModel) => void;
  resetFilledRows: () => void;
  setSelectedPillarStyle: (style: PillarStyle) => void;
  rebuildFence: () => void;
  clearAll: () => void;
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

  addPoint: (p) => set((s) => ({ boundaryPoints: [...s.boundaryPoints, p] })),

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

  // Пользователь выбрал панель для ряда i
  setFilledRow: (rowIndex, panel) => {
    const { fenceHeightCm, filledRows } = get();

    // Обрезаем если переписывает уже существующий ряд
    const newFilled = filledRows.slice(0, rowIndex);
    newFilled.push({ heightCm: panel.heightCm, panel });

    const filledHeight = getFilledHeight(newFilled);

    // Если набрали нужную высоту — rows = filledRows
    const complete = filledHeight === fenceHeightCm;

    set({ filledRows: newFilled, rows: newFilled });

    if (complete) get().rebuildFence();
    else set({ fenceItems: [] }); // Пока не набрали — не рисуем
  },

  resetFilledRows: () => {
    set({ filledRows: [], rows: [] });
    get().rebuildFence();
  },

  setSelectedPillarStyle: (style) => {
    const { fenceHeightCm } = get();
    set({ selectedPillarStyle: style, activePillar: getCompatiblePillar(style, fenceHeightCm) });
  },

  rebuildFence: () => {
    const { boundaryPoints, fenceHeightCm, rows, singleModel, singlePanel } = get();
    if (boundaryPoints.length < 2) { set({ fenceItems: [] }); return; }

    const activeRows = singleModel
      ? makeRows(fenceHeightCm, singlePanel)
      : rows;

    if (activeRows.length === 0) { set({ fenceItems: [] }); return; }

    const rowHeightsCm = activeRows.map((r) => r.heightCm);
    set({ fenceItems: buildFence(boundaryPoints, fenceHeightCm / 100, rowHeightsCm) });
  },

  clearAll: () => set({ boundaryPoints: [], fenceItems: [], filledRows: [], rows: [] }),
}));