export type Point = { x: number; y: number };

export type FenceItem = {
  type: "post" | "panel";
  x: number;
  z: number;
  y: number;
  rotation: number;
  widthRatio?: number;
};

const PANEL_WIDTH = 100;
const PANEL_HEIGHT_M = 0.5;

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(a: Point, b: Point) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function buildFence(points: Point[], fenceHeightM: number): FenceItem[] {
  if (points.length < 2) return [];

  const rowCount = Math.max(1, Math.round(fenceHeightM / PANEL_HEIGHT_M));
  const result: FenceItem[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const totalLen = dist(a, b);
    const rot = angle(a, b);
    const dx = Math.cos(rot);
    const dz = Math.sin(rot);

    const addPost = (offset: number) => {
      result.push({ type: "post", x: a.x + dx * offset, z: a.y + dz * offset, y: 0, rotation: rot });
    };

    const addPanel = (fromPost: number, toPost: number, row: number) => {
      const actualWidth = toPost - fromPost;
      const widthRatio = Math.min(actualWidth / PANEL_WIDTH, 1);
      const centerOffset = (fromPost + toPost) / 2;
      result.push({
        type: "panel",
        x: a.x + dx * centerOffset,
        z: a.y + dz * centerOffset,
        y: row * PANEL_HEIGHT_M,
        rotation: rot,
        widthRatio,
      });
    };

    let cursor = 0;
    addPost(cursor);

    while (cursor < totalLen) {
      const nextPostOffset = cursor + PANEL_WIDTH;
      if (nextPostOffset <= totalLen) {
        for (let row = 0; row < rowCount; row++) {
          addPanel(cursor, nextPostOffset, row);
        }
        cursor = nextPostOffset;
        addPost(cursor);
      } else {
        const remaining = totalLen - cursor;
        if (remaining > 1) {
          for (let row = 0; row < rowCount; row++) {
            addPanel(cursor, totalLen, row);
          }
        }
        addPost(totalLen);
        break;
      }
    }
  }

  return result;
}