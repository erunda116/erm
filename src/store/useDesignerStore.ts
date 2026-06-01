import { create } from "zustand";
import { buildFence } from "../lib/geometry";
import type { Point, FenceItem } from "../lib/geometry";

export type { Point, FenceItem };

export const FENCE_HEIGHT_OPTIONS = [
  { label: "0.5 м (1 ряд)", value: 0.5 },
  { label: "1.0 м (2 ряда)", value: 1.0 },
  { label: "1.5 м (3 ряда)", value: 1.5 },
  { label: "2.0 м (4 ряда)", value: 2.0 },
  { label: "2.5 м (5 рядов)", value: 2.5 },
  { label: "3.0 м (6 рядов)", value: 3.0 },
];

type DesignerStore = {
  boundaryPoints: Point[];
  fenceItems: FenceItem[];
  fenceHeightM: number;
  addPoint: (p: Point) => void;
  setFenceHeight: (h: number) => void;
  rebuildFence: () => void;
  clearAll: () => void;
};

export const useDesignerStore = create<DesignerStore>((set, get) => ({
  boundaryPoints: [],
  fenceItems: [],
  fenceHeightM: 2.0,

  addPoint: (p: Point) => {
    set((state) => ({ boundaryPoints: [...state.boundaryPoints, p] }));
  },

  setFenceHeight: (h: number) => {
    set({ fenceHeightM: h });
    get().rebuildFence();
  },

  rebuildFence: () => {
    const { boundaryPoints, fenceHeightM } = get();
    set({ fenceItems: buildFence(boundaryPoints, fenceHeightM) });
  },

  clearAll: () => {
    set({ boundaryPoints: [], fenceItems: [] });
  },
}));