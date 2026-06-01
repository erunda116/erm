import { Stage, Layer, Line, Circle } from "react-konva";
import { useEffect, useState } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { KonvaEventObject } from "konva/lib/Node";
import Grid from "./Grid";
import { Rect } from "react-konva";

type Size = { w: number; h: number };

export default function FencePlanEditor() {
  const points = useDesignerStore((s) => s.boundaryPoints);
  const addPoint = useDesignerStore((s) => s.addPoint);
  const rebuildFence = useDesignerStore((s) => s.rebuildFence);

  const [size, setSize] = useState<Size>({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleClick(e: KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    addPoint({ x: pos.x, y: pos.y });
    rebuildFence();
  }

  return (
    <div
  style={{
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    pointerEvents: "auto",
  }}
    >
      <Stage
        width={size.w}
        height={size.h}
        onClick={handleClick}
      >
        <Layer>
            <Rect
      x={0}
      y={0}
      width={size.w}
      height={size.h}
      fill="#f5f5f5"
    />

    {/* 🔥 GRID */}
    <Grid width={size.w} height={size.h} step={50} />
          <Line
            points={points.flatMap(p => [p.x, p.y])}
            stroke="black"
            strokeWidth={2}
          />

          {points.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={5}
              fill="red"
              draggable
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}