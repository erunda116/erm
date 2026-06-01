import type { PanelModel } from "../data/panels";

export const FENCE_HEIGHTS_CM = [
  30, 50, 60, 80, 90, 110, 120, 130, 140,
  150, 160, 180, 190, 200, 210, 220, 230, 240, 250,
];

// Для каждой высоты — одна дефолтная разбивка на ряды (высоты рядов)
// Логика: максимально заполняем рядами по 50, остаток 30
export function getDefaultRowHeights(heightCm: number): number[] {
  const rows: number[] = [];
  let remaining = heightCm;
  while (remaining > 0) {
    if (remaining >= 50) {
      rows.push(50);
      remaining -= 50;
    } else {
      rows.push(30);
      remaining -= 30;
    }
  }
  return rows;
}