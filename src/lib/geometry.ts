export type Point = { x: number; y: number };

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
};

const PANEL_WIDTH_PX = 100; // 1 панель = 100px = 2м (50px/м)

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

function splitSegmentAroundHouses(a: Point, b: Point, houses: House[]): [Point, Point][] {
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
  houses: House[] = []
): FenceItem[] {
  if (points.length < 2) return [];

  const result: FenceItem[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const subSegments = splitSegmentAroundHouses(a, b, houses);

    for (const [segA, segB] of subSegments) {
      const totalLen = dist(segA, segB);
      const rot = angle(segA, segB);
      const dx = Math.cos(rot);
      const dz = Math.sin(rot);

      let cursor = 0;

      // START POST
      result.push({
        type: "post",
        x: segA.x, z: segA.y, y: 0,
        rotation: rot,
      });

      while (cursor < totalLen) {
        const nextCursor = cursor + PANEL_WIDTH_PX;

        if (nextCursor <= totalLen) {
          // Полная панель — центр между cursor и nextCursor
          const panelCenterOffset = cursor + PANEL_WIDTH_PX / 2;
          let rowY = 0;
          rowHeightsCm.forEach((h, rowIndex) => {
            result.push({
              type: "panel",
              x: segA.x + dx * panelCenterOffset,
              z: segA.y + dz * panelCenterOffset,
              y: rowY / 100,
              rotation: rot,
              rowIndex,
              widthRatio: 1,
            });
            rowY += h;
          });

          cursor = nextCursor;

          // POST после панели
          result.push({
            type: "post",
            x: segA.x + dx * cursor,
            z: segA.y + dz * cursor,
            y: 0,
            rotation: rot,
          });
        } else {
          // Последняя неполная панель
          const remaining = totalLen - cursor;
          if (remaining > 5) {
            const panelCenterOffset = cursor + PANEL_WIDTH_PX / 2; 
            let rowY = 0;
            rowHeightsCm.forEach((h, rowIndex) => {
              result.push({
                type: "panel",
                x: segA.x + dx * panelCenterOffset,
                z: segA.y + dz * panelCenterOffset,
                y: rowY / 100,
                rotation: rot,
                rowIndex,
                widthRatio: remaining / PANEL_WIDTH_PX,
              });
              rowY += h;
            });
          }

          // END POST
          result.push({
            type: "post",
            x: segB.x, z: segB.y, y: 0,
            rotation: rot,
          });
          break;
        }
      }
    }
  }

  return result;
}