import { Stage, Layer, Line, Circle, Text, Rect } from "react-konva";
import { useEffect, useState, useRef } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import Grid from "./Grid";

type Size = { w: number; h: number };
type Point = { x: number; y: number };

const STEP = 50;
const METERS_PER_CELL = 1;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

function snapToGrid(val: number, step: number, scale: number): number {
  const snappedStep = step;
  return Math.round(val / snappedStep) * snappedStep;
}

function pxToMeters(px: number): number {
  return Math.round((px / STEP) * METERS_PER_CELL * 10) / 10;
}

function distPx(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export default function FencePlanEditor() {
  const points = useDesignerStore((s) => s.boundaryPoints);
  const addPoint = useDesignerStore((s) => s.addPoint);
  const rebuildFence = useDesignerStore((s) => s.rebuildFence);

  const [size, setSize] = useState<Size>({ w: window.innerWidth, h: window.innerHeight });
  const [cursor, setCursor] = useState<Point | null>(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Zoom колесиком — зумируем относительно позиции курсора
  function handleWheel(e: KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, MAX_SCALE)
      : Math.max(oldScale / scaleBy, MIN_SCALE);

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setScale(newScale);
    setStagePos(newPos);
  }

  // Получаем координаты в пространстве сцены (с учётом zoom/pan)
  function getScenePos(stage: Konva.Stage): Point | null {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const x = (pos.x - stage.x()) / stage.scaleX();
    const y = (pos.y - stage.y()) / stage.scaleY();
    return { x, y };
  }

  function handleClick(e: KonvaEventObject<MouseEvent>) {
    // Не добавляем точку если был pan
    if (isPanning) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getScenePos(stage);
    if (!pos) return;
    const snapped = {
      x: snapToGrid(pos.x, STEP, scale),
      y: snapToGrid(pos.y, STEP, scale),
    };
    addPoint(snapped);
    rebuildFence();
  }

  function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getScenePos(stage);
    if (!pos) return;
    setCursor({
      x: snapToGrid(pos.x, STEP, scale),
      y: snapToGrid(pos.y, STEP, scale),
    });
  }

  function handleMouseLeave() {
    setCursor(null);
  }

  // Pan средней кнопкой мыши или пробелом + ЛКМ
  function handleDragStart() {
    setIsPanning(true);
  }

  function handleDragEnd(e: KonvaEventObject<DragEvent>) {
    setStagePos({ x: e.target.x(), y: e.target.y() });
    setTimeout(() => setIsPanning(false), 50);
  }

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const dragLengthM = lastPoint && cursor ? pxToMeters(distPx(lastPoint, cursor)) : null;
  const dragMid = lastPoint && cursor
    ? { x: (lastPoint.x + cursor.x) / 2, y: (lastPoint.y + cursor.y) / 2 }
    : null;

  return (
    <div style={{ position: "absolute", top: 60, left: 20, zIndex: 10, pointerEvents: "auto" }}>

      {/* Подсказка */}
      <div style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        padding: "6px 16px",
        borderRadius: 20,
        fontSize: 12,
        pointerEvents: "none",
      }}>
        🖱 Колесо — zoom · Перетащить сцену — зажми и тяни фон · ЛКМ — добавить точку
      </div>

      {/* Масштаб */}
      <div style={{
        position: "fixed",
        bottom: 56,
        right: 24,
        zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12,
        pointerEvents: "none",
      }}>
        {Math.round(scale * 100)}%
      </div>

      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {/* Фон */}
          <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#f5f5f5" />

          {/* Сетка */}
          <Grid width={size.w} height={size.h} step={STEP} metersPerCell={METERS_PER_CELL} />

          {/* Нарисованные линии */}
          {points.length > 1 && (
            <Line
              points={points.flatMap((p) => [p.x, p.y])}
              stroke="#222"
              strokeWidth={2 / scale}
            />
          )}

          {/* Длины сегментов */}
          {points.slice(0, -1).map((p, i) => {
            const next = points[i + 1];
            const mx = (p.x + next.x) / 2;
            const my = (p.y + next.y) / 2;
            const lenM = pxToMeters(distPx(p, next));
            return (
              <Text
                key={`len-${i}`}
                x={mx + 4 / scale}
                y={my - 16 / scale}
                text={`${lenM} м`}
                fontSize={13 / scale}
                fontStyle="bold"
                fill="#333"
                shadowColor="white"
                shadowBlur={3}
                shadowOpacity={1}
              />
            );
          })}

          {/* Тянущаяся линия */}
          {lastPoint && cursor && (
            <Line
              points={[lastPoint.x, lastPoint.y, cursor.x, cursor.y]}
              stroke="#4fc3a1"
              strokeWidth={2 / scale}
              dash={[8 / scale, 4 / scale]}
            />
          )}

          {/* Подпись длины тянущейся линии */}
          {dragMid && dragLengthM !== null && dragLengthM > 0 && (
            <>
              <Rect
                x={dragMid.x - 22 / scale}
                y={dragMid.y - 22 / scale}
                width={44 / scale}
                height={18 / scale}
                fill="white"
                cornerRadius={4}
                opacity={0.85}
              />
              <Text
                x={dragMid.x - 20 / scale}
                y={dragMid.y - 20 / scale}
                text={`${dragLengthM} м`}
                fontSize={12 / scale}
                fontStyle="bold"
                fill="#4fc3a1"
                width={40 / scale}
                align="center"
              />
            </>
          )}

          {/* Точки */}
          {points.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={5 / scale}
              fill="red"
              draggable
              onDragEnd={(e) => {
                const snapped = {
                  x: snapToGrid(e.target.x(), STEP, scale),
                  y: snapToGrid(e.target.y(), STEP, scale),
                };
                e.target.position(snapped);
                const newPoints = [...points];
                newPoints[i] = snapped;
                useDesignerStore.setState({ boundaryPoints: newPoints });
                rebuildFence();
              }}
            />
          ))}

          {/* Курсор — снапнутая точка */}
          {cursor && (
            <Circle
              x={cursor.x}
              y={cursor.y}
              radius={4 / scale}
              fill="#4fc3a1"
              opacity={0.7}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}