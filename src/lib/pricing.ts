import type { FenceItem } from "./geometry";
import type { FenceRow } from "../store/useDesignerStore";
import type { PillarModel } from "../data/posts";

const PAINTING_PRICE_GREY = 30;
const PAINTING_PRICE_WHITE = 30;

export type PriceSummary = {
  panelCount: number;
  postCount: number;
  postTotal: number;
  panelTotal: number;
  paintingTotal: number;
  paintedAreaM2: number;
  total: number;
  rowBreakdown: { label: string; count: number; price: number; total: number }[];
  totalLengthM: number;
  totalWeightKg: number;
};

export function calcPrice(
  items: FenceItem[],
  rows: FenceRow[],
  pillar: PillarModel,
  baseConcreteColor: 'grey' | 'white',
  selectedRal: string | null = null
): PriceSummary {
  const isWhite = baseConcreteColor === 'white';
  const panels = items.filter((i) => i.type === "panel");
  const postCount = items.filter((i) => i.type === "post").length;

  const byModel = new Map<string, { label: string; price: number; count: number; totalM2: number }>();

  let paintedAreaM2 = 0;

  panels.forEach((item) => {
    const row = rows[item.rowIndex ?? 0] ?? rows[0];
    if (!row) return;

    const key = row.panel.id;
    const pricePerM2 = isWhite ? row.panel.priceWhite : row.panel.priceGrey;
    const panelHeightM = row.panel.heightCm / 100;
    const widthRatio = item.widthRatio ?? 1;
    const panelM2 = panelHeightM * 2 * widthRatio;

    if (!byModel.has(key)) {
      byModel.set(key, {
        label: row.panel.label,
        price: pricePerM2,
        count: 0,
        totalM2: 0,
      });
    }

    const entry = byModel.get(key)!;
    entry.count++;
    entry.totalM2 += panelM2;
    paintedAreaM2 += panelM2;
  });

  const rowBreakdown = Array.from(byModel.values()).map((r) => ({
    label: r.label,
    count: r.count,
    price: r.price,
    total: Math.round(r.totalM2 * r.price * 100) / 100,
  }));

  const panelTotal = rowBreakdown.reduce((s, r) => s + r.total, 0);

  const pillarPrice = isWhite ? pillar.priceWhite : pillar.price;
  const postTotal = postCount * pillarPrice;

  const panelsRow0 = panels.filter((p) => (p.rowIndex ?? 0) === 0);
  const totalPanelWidths = panelsRow0.reduce((sum, p) => sum + (p.widthRatio ?? 1), 0);
  const totalLengthM = Math.round(totalPanelWidths * 2 * 10) / 10;

  let totalWeightKg = 0;
  panels.forEach((item) => {
    const row = rows[item.rowIndex ?? 0] ?? rows[0];
    if (!row) return;
    const widthRatio = item.widthRatio ?? 1;
    totalWeightKg += (row.panel.weightKgPerPanel ?? 85) * widthRatio;
  });
  totalWeightKg = Math.round(totalWeightKg + postCount * (pillar.weightKg ?? 120));

  const paintingPricePerM2 = isWhite ? PAINTING_PRICE_WHITE : PAINTING_PRICE_GREY;
  const paintingTotal = selectedRal
    ? Math.round(paintedAreaM2 * paintingPricePerM2 * 100) / 100
    : 0;

  return {
    panelCount: panels.length,
    postCount,
    postTotal,
    panelTotal,
    paintingTotal,
    paintedAreaM2: Math.round(paintedAreaM2 * 100) / 100,
    total: Math.round((panelTotal + postTotal + paintingTotal) * 100) / 100,
    rowBreakdown,
    totalLengthM,
    totalWeightKg,
  };
}