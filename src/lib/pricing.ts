import type { FenceItem } from "./geometry";
import type { FenceRow } from "../store/useDesignerStore";
import type { PillarModel } from "../data/posts";

export type PriceSummary = {
  panelCount: number;
  postCount: number;
  postTotal: number;
  panelTotal: number;
  total: number;
  rowBreakdown: { label: string; count: number; price: number; total: number }[];
};

export function calcPrice(
  items: FenceItem[],
  rows: FenceRow[],
  pillar: PillarModel
): PriceSummary {
  const panels = items.filter((i) => i.type === "panel");
  const postCount = items.filter((i) => i.type === "post").length;

  // Группируем панели по модели (не по ряду — для читаемости)
  const byModel = new Map<string, { label: string; price: number; count: number }>();
  panels.forEach((item) => {
    const row = rows[item.rowIndex ?? 0] ?? rows[0];
    if (!row) return;
    const key = row.panel.id;
    if (!byModel.has(key)) {
      byModel.set(key, { label: row.panel.label, price: row.panel.price, count: 0 });
    }
    byModel.get(key)!.count++;
  });

  const rowBreakdown = Array.from(byModel.values()).map((r) => ({
    ...r,
    total: r.count * r.price,
  }));

  const panelTotal = rowBreakdown.reduce((s, r) => s + r.total, 0);
  const postTotal = postCount * pillar.price;

  return {
    panelCount: panels.length,
    postCount,
    postTotal,
    panelTotal,
    total: panelTotal + postTotal,
    rowBreakdown,
  };
}