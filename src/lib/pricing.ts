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
  baseConcreteColor: 'grey' | 'white'
): PriceSummary {
  const isWhite = baseConcreteColor === 'white';
  const panels = items.filter((i) => i.type === "panel");
  const postCount = items.filter((i) => i.type === "post").length;

  // Площадь одной полной панели в m²: ширина 2м × высота в метрах
  // widthRatio учитывает неполные панели на концах секций
  const byModel = new Map<string, { label: string; price: number; count: number; totalM2: number }>();

  panels.forEach((item) => {
    const row = rows[item.rowIndex ?? 0] ?? rows[0];
    if (!row) return;
    const key = row.panel.id;
    const pricePerM2 = isWhite ? row.panel.priceWhite : row.panel.priceGrey;
    const panelHeightM = row.panel.heightCm / 100;
    const panelM2 = panelHeightM * 2;

    if (!byModel.has(key)) {
      byModel.set(key, { label: row.panel.label, price: pricePerM2, count: 0, totalM2: 0 });
    }
    const entry = byModel.get(key)!;
    entry.count++;
    entry.totalM2 += panelM2;
  });

  const rowBreakdown = Array.from(byModel.values()).map((r) => ({
    label: r.label,
    count: r.count,
    price: r.price,
    total: Math.round(r.totalM2 * r.price * 100) / 100, // цена × реальная площадь m²
  }));

  const panelTotal = rowBreakdown.reduce((s, r) => s + r.total, 0);

  // ← ИСПРАВЛЕНИЕ: цена столба зависит от цвета бетона
  const pillarPrice = isWhite ? pillar.priceWhite : pillar.price;
  const postTotal = postCount * pillarPrice;

  // Длина по нулевому ряду
  const panelsRow0 = panels.filter((p) => (p.rowIndex ?? 0) === 0);
  const totalPanelWidths = panelsRow0.reduce((sum, p) => sum + (p.widthRatio ?? 1), 0);
  const totalLengthM = Math.round(totalPanelWidths * 2 * 10) / 10;

  // Вес
  let totalWeightKg = 0;
  panels.forEach((item) => {
    const row = rows[item.rowIndex ?? 0] ?? rows[0];
    if (!row) return;
    const widthRatio = item.widthRatio ?? 1;
    totalWeightKg += (row.panel.weightKgPerPanel ?? 85) * widthRatio; // пропорционально для неполных
  });
  totalWeightKg = Math.round(totalWeightKg + postCount * (pillar.weightKg ?? 120));

  return {
    panelCount: panels.length,
    postCount,
    postTotal,
    panelTotal,
    total: Math.round((panelTotal + postTotal) * 100) / 100,
    rowBreakdown,
    totalLengthM,
    totalWeightKg,
  };
}