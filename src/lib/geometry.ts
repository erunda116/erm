export type Point = { x: number; y: number };

export type FenceItem = {
  type: "post" | "panel";
  x: number;
  z: number;
  y: number;
  rotation: number;
  rowIndex?: number;   // номер ряда (снизу 0)
  widthRatio?: number;
};

const PANEL_WIDTH_CM = 100; // ширина панели в см = 1м

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(a: Point, b: Point) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function buildFence(points: Point[], fenceHeightM: number, rowHeightsCm: number[]): FenceItem[] {
  if (points.length < 2) return [];

  const result: FenceItem[] = [];
  const SCALE = 50; // px → метры

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const totalLen = dist(a, b);
    const rot = angle(a, b);
    const dx = Math.cos(rot);
    const dz = Math.sin(rot);

    const panelWidthPx = PANEL_WIDTH_CM; // в px (1 клетка = 50px = 1м, панель = 1м = 50px)

    const addPost = (offset: number) => {
      result.push({ type: "post", x: a.x + dx * offset, z: a.y + dz * offset, y: 0, rotation: rot });
    };

    const addPanel = (fromOffset: number, toOffset: number, rowIndex: number, rowY: number) => {
      const actualWidth = toOffset - fromOffset;
      const widthRatio = Math.min(actualWidth / panelWidthPx, 1);
      const centerOffset = (fromOffset + toOffset) / 2;
      result.push({
        type: "panel",
        x: a.x + dx * centerOffset,
        z: a.y + dz * centerOffset,
        y: rowY,
        rotation: rot,
        rowIndex,
        widthRatio,
      });
    };

    let cursor = 0;
    addPost(cursor);

    while (cursor < totalLen) {
      const nextPost = cursor + panelWidthPx;
      if (nextPost <= totalLen) {
        let rowY = 0;
        rowHeightsCm.forEach((h, rowIndex) => {
          addPanel(cursor, nextPost, rowIndex, rowY / 100);
          rowY += h;
        });
        cursor = nextPost;
        addPost(cursor);
      } else {
        const remaining = totalLen - cursor;
        if (remaining > 1) {
          let rowY = 0;
          rowHeightsCm.forEach((h, rowIndex) => {
            addPanel(cursor, totalLen, rowIndex, rowY / 100);
            rowY += h;
          });
        }
        addPost(totalLen);
        break;
      }
    }
  }

  return result;
}