import type { FenceItem } from "./geometry";

export const PRICES = {
  panel: 30,
  post: 35,
};

export type PriceSummary = {
  panelCount: number;
  postCount: number;
  panelTotal: number;
  postTotal: number;
  total: number;
};

export function calcPrice(items: FenceItem[]): PriceSummary {
  const panelCount = items.filter((i) => i.type === "panel").length;
  const postCount = items.filter((i) => i.type === "post").length;
  return {
    panelCount,
    postCount,
    panelTotal: panelCount * PRICES.panel,
    postTotal: postCount * PRICES.post,
    total: panelCount * PRICES.panel + postCount * PRICES.post,
  };
}