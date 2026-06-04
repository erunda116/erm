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
  totalLengthM: number;   
  totalWeightKg: number;
};

export function calcPrice(
  items: FenceItem[],
  rows: FenceRow[],
  pillar: PillarModel,
  concreteColor: string  // ← новый параметр
): PriceSummary {
  const isWhite = concreteColor !== 'grey';  // белый или любой RAL = priceWhite
  const panels = items.filter((i) => i.type === "panel");
  const postCount = items.filter((i) => i.type === "post").length;

  const byModel = new Map<string, { label: string; price: number; count: number }>();
  panels.forEach((item) => {
    const row = rows[item.rowIndex ?? 0] ?? rows[0];
    if (!row) return;
    const key = row.panel.id;
    // ← берём priceGrey или priceWhite в зависимости от выбора
    const price = isWhite ? row.panel.priceWhite : row.panel.priceGrey;
    if (!byModel.has(key)) {
      byModel.set(key, { label: row.panel.label, price, count: 0 });
    }
    byModel.get(key)!.count++;
  });

  const rowBreakdown = Array.from(byModel.values()).map((r) => ({
    ...r,
    total: r.count * r.price,
  }));

  const panelTotal = rowBreakdown.reduce((s, r) => s + r.total, 0);
  const postTotal = postCount * pillar.price;

  // Длина: каждая панель = 2 метра ширины
// Длина = только панели нулевого ряда × 2м (остальные ряды идут в высоту, не в длину)
const rowCount = rows.length > 0 ? rows.length : 1;
const totalLengthM = Math.round((panels.length / rowCount) * 2 * 10) / 10;

// Вес: считаем по каждой панели через её row
let totalWeightKg = 0;
panels.forEach((item) => {
  const row = rows[item.rowIndex ?? 0] ?? rows[0];
  if (!row) return;
  totalWeightKg += row.panel.weightKgPerPanel ?? 85;
});
totalWeightKg = Math.round(totalWeightKg + postCount * (pillar.weightKg ?? 120));

  return {
    panelCount: panels.length,
    postCount,
    postTotal,
    panelTotal,
    total: panelTotal + postTotal,
    rowBreakdown,
    totalLengthM,   // ← ДОБАВИТЬ
  totalWeightKg,
  };
}