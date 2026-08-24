import type { Gate } from "../store/useDesignerStore";

export type Point = { x: number; y: number; elevation?: number };

export type House = {
  id: string;
  x: number; z: number;
  widthPx: number; depthPx: number;
};

export type FenceItem = {
  type: "post" | "panel";
  x: number; z: number; y: number;
  rotation: number;
  rowIndex?: number;
  widthRatio?: number;
  extraBurial?: number;
};

const PANEL_WIDTH_PX = 100; // 1 panel = 100px = 2m (50px/m)

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(a: Point, b: Point) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function segmentIntersectsHouse(a: Point, b: Point, house: House): boolean {
  const left   = house.x - house.widthPx / 2;
  const right  = house.x + house.widthPx / 2;
  const top    = house.z - house.depthPx / 2;
  const bottom = house.z + house.depthPx / 2;

  const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
  if (maxX < left || minX > right || maxY < top || minY > bottom) return false;

  function inside(p: Point) {
    return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
  }
  if (inside(a) || inside(b)) return true;

  function segSeg(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 1e-10) return false;
    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / cross;
    const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / cross;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  const tl: Point = { x: left,  y: top };
  const tr: Point = { x: right, y: top };
  const bl: Point = { x: left,  y: bottom };
  const br: Point = { x: right, y: bottom };

  return segSeg(a, b, tl, tr) || segSeg(a, b, tr, br) ||
         segSeg(a, b, br, bl) || segSeg(a, b, bl, tl);
}

function splitSegmentAroundObstacles(a: Point, b: Point, houses: House[], gates: Gate[]): [Point, Point][] {
  const totalLen = dist(a, b);
  if (totalLen < 1) return [];

  const dx = (b.x - a.x) / totalLen;
  const dy = (b.y - a.y) / totalLen;

  type Interval = { tIn: number; tOut: number };
  const blocked: Interval[] = [];

  for (const house of houses) {
    if (!segmentIntersectsHouse(a, b, house)) continue;

    const left   = house.x - house.widthPx / 2;
    const right  = house.x + house.widthPx / 2;
    const top    = house.z - house.depthPx / 2;
    const bottom = house.z + house.depthPx / 2;

    let tMin = 0, tMax = totalLen;

    if (Math.abs(dx) > 1e-10) {
      const t1 = (left  - a.x) / dx;
      const t2 = (right - a.x) / dx;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    }
    if (Math.abs(dy) > 1e-10) {
      const t1 = (top    - a.y) / dy;
      const t2 = (bottom - a.y) / dy;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    }

    if (tMin < tMax) {
      blocked.push({ tIn: Math.max(0, tMin), tOut: Math.min(totalLen, tMax) });
    }
  }

  for (const gate of gates) {
    const r = gate.widthPx / 2;
    const fx = a.x - gate.x;
    const fy = a.y - gate.z;
    const A = dx * dx + dy * dy;
    const B = 2 * (fx * dx + fy * dy);
    const C = (fx * fx + fy * fy) - r * r;
    const discriminant = B * B - 4 * A * C;

    if (discriminant > 0) {
      const sqrtD = Math.sqrt(discriminant);
      const t1 = (-B - sqrtD) / (2 * A);
      const t2 = (-B + sqrtD) / (2 * A);
      const tMin = Math.min(t1, t2);
      const tMax = Math.max(t1, t2);
      if (tMin < totalLen && tMax > 0) {
        blocked.push({ tIn: Math.max(0, tMin), tOut: Math.min(totalLen, tMax) });
      }
    }
  }

  if (blocked.length === 0) return [[a, b]];

  blocked.sort((x, y) => x.tIn - y.tIn);
  const merged: Interval[] = [];
  for (const iv of blocked) {
    if (merged.length && iv.tIn <= merged[merged.length - 1].tOut) {
      merged[merged.length - 1].tOut = Math.max(merged[merged.length - 1].tOut, iv.tOut);
    } else {
      merged.push({ ...iv });
    }
  }

  const result: [Point, Point][] = [];
  let cursor = 0;

  function ptAt(t: number): Point {
    return { x: a.x + dx * t, y: a.y + dy * t };
  }

  for (const { tIn, tOut } of merged) {
    if (tIn - cursor > 5) result.push([ptAt(cursor), ptAt(tIn)]);
    cursor = tOut;
  }
  if (totalLen - cursor > 5) result.push([ptAt(cursor), b]);

  return result;
}

export function buildFence(
  points: Point[],
  fenceHeightM: number,
  rowHeightsCm: number[],
  houses: House[] = [],
  gates: Gate[] = []
): FenceItem[] {
  if (points.length < 2) return [];

  const result: FenceItem[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const subSegments = splitSegmentAroundObstacles(a, b, houses, gates);

    for (let segIdx = 0; segIdx < subSegments.length; segIdx++) {
      const [segA, segB] = subSegments[segIdx];
      const totalLen = dist(segA, segB);
      const rot = angle(segA, segB);
      const dx = Math.cos(rot);
      const dz = Math.sin(rot);

      const mainSegmentLen = dist(a, b);
      const distA = dist(a, segA);
      const distB = dist(a, segB);
      const elA = a.elevation || 0;
      const elB = b.elevation || 0;

      const segElA = mainSegmentLen > 0 ? elA + (distA / mainSegmentLen) * (elB - elA) : elA;
      const segElB = mainSegmentLen > 0 ? elA + (distB / mainSegmentLen) * (elB - elA) : elB;

      let cursor = 0;
      
      const peekElEnd = totalLen > 0 ? segElA + (Math.min(PANEL_WIDTH_PX, totalLen) / totalLen) * (segElB - segElA) : segElA;
      
      // ИСПОЛЬЗУЕМ Math.max: панель прилегает к ВЫСШЕЙ точке рельефа
      const firstPanelY = Math.max(segElA, peekElEnd); 

      result.push({
        type: "post",
        x: segA.x, z: segA.y,
        y: firstPanelY, 
        rotation: rot,
        extraBurial: Math.max(0, firstPanelY - segElA)
      });

      let prevPanelY = firstPanelY;

      while (cursor < totalLen) {
        const nextCursor = cursor + PANEL_WIDTH_PX;
        const isLast = nextCursor >= totalLen;

        const elStart = segElA + (cursor / totalLen) * (segElB - segElA);
        const elEnd = segElA + (Math.min(nextCursor, totalLen) / totalLen) * (segElB - segElA);
        
        // Math.max: панель садится на землю ВЫСШИМ углом, чтобы быть полностью над землей
        const panelY = Math.max(elStart, elEnd);

        if (!isLast) {
          const panelCenterOffset = cursor + PANEL_WIDTH_PX / 2;
          
          let rowY = 0;
          rowHeightsCm.forEach((h, rowIndex) => {
            result.push({
              type: "panel",
              x: segA.x + dx * panelCenterOffset, 
              z: segA.y + dz * panelCenterOffset,
              y: panelY + (rowY / 100),
              rotation: rot, rowIndex,
              widthRatio: 1,
            });
            rowY += h;
          });

          cursor = nextCursor;
          prevPanelY = panelY;

          let nextPanelY = prevPanelY;
          if (cursor < totalLen) {
             const pNextCursor = Math.min(cursor + PANEL_WIDTH_PX, totalLen);
             const pStart = segElA + (cursor / totalLen) * (segElB - segElA);
             const pEnd = segElA + (pNextCursor / totalLen) * (segElB - segElA);
             nextPanelY = Math.max(pStart, pEnd); 
          }

          const postY = Math.max(prevPanelY, nextPanelY);
          const groundEl = segElA + (cursor / totalLen) * (segElB - segElA);

          result.push({
            type: "post",
            x: segA.x + dx * cursor, z: segA.y + dz * cursor,
            y: postY, rotation: rot,
            extraBurial: Math.max(0, postY - groundEl) 
          });
        } else {
          const remaining = totalLen - cursor;
          if (remaining > 5) {
            const panelCenterOffset = cursor + PANEL_WIDTH_PX / 2; 
            
            let rowY = 0;
            rowHeightsCm.forEach((h, rowIndex) => {
              result.push({
                type: "panel",
                x: segA.x + dx * panelCenterOffset, 
                z: segA.y + dz * panelCenterOffset,
                y: panelY + (rowY / 100),
                rotation: rot, rowIndex,
                widthRatio: remaining / PANEL_WIDTH_PX,
              });
              rowY += h;
            });

            const postY = panelY; 
            result.push({
              type: "post",
              x: segB.x, z: segB.y,
              y: postY, rotation: rot,
              extraBurial: Math.max(0, postY - segElB)
            });
          } else {
            const postY = prevPanelY;
            result.push({
              type: "post",
              x: segB.x, z: segB.y,
              y: postY, rotation: rot,
              extraBurial: Math.max(0, postY - segElB)
            });
          }
          break;
        }
      }
    }
  }
  return result;
}