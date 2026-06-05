import { Stage, Layer, Line, Circle, Text, Rect, Group } from "react-konva";
import { useEffect, useState, useRef } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { House } from "../../store/useDesignerStore";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import Grid from "./Grid";

type Size = { w: number; h: number };
type Point = { x: number; y: number };

const STEP = 50;
const METERS_PER_CELL = 1;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const HANDLE_R = 6;
const CLOSE_SNAP_RADIUS = 30;

function snapToGrid(val: number, step: number, scale: number): number {
  return Math.round(val / step) * step;
}

function pxToMeters(px: number): number {
  return Math.round((px / STEP) * METERS_PER_CELL * 10) / 10;
}

function distPx(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export default function FencePlanEditor() {
  const points        = useDesignerStore((s) => s.boundaryPoints);
  const addPoint      = useDesignerStore((s) => s.addPoint);
  const rebuildFence  = useDesignerStore((s) => s.rebuildFence);
  const activeTool    = useDesignerStore((s) => s.activeTool);
  const setActiveTool = useDesignerStore((s) => s.setActiveTool);
  const houses        = useDesignerStore((s) => s.houses);
  const addHouse      = useDesignerStore((s) => s.addHouse);
  const updateHouse   = useDesignerStore((s) => s.updateHouse);
  const removeHouse   = useDesignerStore((s) => s.removeHouse);

 const containerRef = useRef<HTMLDivElement>(null);
const [size, setSize] = useState<Size>({ w: 800, h: 600 });
  const [cursor, setCursor]       = useState<Point | null>(null);
  const [scale, setScale]         = useState(1);
  const [stagePos, setStagePos]   = useState({ x: 0, y: 0 });
  
  const stageRef = useRef<Konva.Stage>(null);
  const panStart  = useRef<Point | null>(null);
const panOrigin = useRef({ x: 0, y: 0 });
const lastTapRef = useRef<number>(0);
const pinchStartDist = useRef<number | null>(null);
const pinchStartScale = useRef<number>(1);
const pinchStartPos = useRef({ x: 0, y: 0 });
const touchPanStart = useRef<Point | null>(null);
const touchPanOrigin = useRef({ x: 0, y: 0 });

  useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    setSize({ w: width, h: height });
  });
  ro.observe(el);
  setSize({ w: el.clientWidth, h: el.clientHeight });
  return () => ro.disconnect();
}, []);

  function handleWheel(e: KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer  = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy  = 1.08;
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, MAX_SCALE)
      : Math.max(oldScale / scaleBy, MIN_SCALE);

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }

  function getScenePos(stage: Konva.Stage): Point | null {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
  }

  function handleClick(e: KonvaEventObject<MouseEvent>) {
  // Для инструмента house — разрешаем клик по любому элементу кроме ручек домов
  const targetName = e.target.name();
  const isHandle = targetName === 'handle' || targetName === 'house-body';
  
  if (activeTool === "fence") {
    // Для забора — только клик по фону
    if (e.target !== e.target.getStage() && targetName !== "bg") return;
  } else if (activeTool === "house") {
    // Для домика — игнорируем только клики по ручкам
    if (isHandle) return;
  }

  const stage = e.target.getStage();
  if (!stage) return;
  const pos = getScenePos(stage);
  if (!pos) return;

  const snapped = {
    x: snapToGrid(pos.x, STEP, scale),
    y: snapToGrid(pos.y, STEP, scale),
  };

  if (activeTool === "fence") {
    addPoint(snapped);
    rebuildFence();
  } else if (activeTool === "house") {
    addHouse(snapped.x, snapped.y);
    rebuildFence();
  }
}

function handleDblClick(e: KonvaEventObject<MouseEvent>) {
  if (activeTool !== "fence") return;
  if (points.length < 2) return;
  addPoint({ x: points[0].x, y: points[0].y });
  rebuildFence();
}

  function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
  // Пан
  if (panStart.current) {
    const dx = e.evt.clientX - panStart.current.x;
    const dy = e.evt.clientY - panStart.current.y;
    setStagePos({
      x: panOrigin.current.x + dx,
      y: panOrigin.current.y + dy,
    });
    return;
  }
  // Курсор
  const stage = e.target.getStage();
  if (!stage) return;
  const pos = getScenePos(stage);
  if (!pos) return;
  setCursor({
    x: snapToGrid(pos.x, STEP, scale),
    y: snapToGrid(pos.y, STEP, scale),
  });
}
function handleMouseDown(e: KonvaEventObject<MouseEvent>) {
  if (e.evt.button === 1 || e.evt.button === 2) {
    e.evt.preventDefault();
    panStart.current  = { x: e.evt.clientX, y: e.evt.clientY };
    panOrigin.current = { ...stagePos };
  }
}

function handleMouseUp() {
  panStart.current = null;
}
  function handleMouseLeave() {
    setCursor(null);
  }
function getTouchPos(stage: Konva.Stage, touch: Touch): Point {
  const rect = stage.container().getBoundingClientRect();
  return {
    x: (touch.clientX - rect.left - stage.x()) / stage.scaleX(),
    y: (touch.clientY - rect.top  - stage.y()) / stage.scaleY(),
  };
}

function handleTouchStart(e: KonvaEventObject<TouchEvent>) {
  const touches = e.evt.touches;

  if (touches.length === 2) {
    // Pinch-zoom start
    e.evt.preventDefault();
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    pinchStartDist.current = Math.hypot(dx, dy);
    pinchStartScale.current = scale;
    pinchStartPos.current = {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
    touchPanStart.current = null;
    return;
  }

  if (touches.length === 1) {
    // Pan start
    touchPanStart.current = { x: touches[0].clientX, y: touches[0].clientY };
    touchPanOrigin.current = { ...stagePos };
  }
}

function handleTouchMove(e: KonvaEventObject<TouchEvent>) {
  const touches = e.evt.touches;

  if (touches.length === 2 && pinchStartDist.current !== null) {
    e.evt.preventDefault();
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE,
      pinchStartScale.current * (dist / pinchStartDist.current)
    ));

    const stage = stageRef.current;
    if (!stage) return;

    const center = pinchStartPos.current;
    const oldScale = pinchStartScale.current;
    const pointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    setScale(newScale);
    setStagePos({
      x: center.x - pointTo.x * newScale,
      y: center.y - pointTo.y * newScale,
    });
    return;
  }

  if (touches.length === 1 && touchPanStart.current) {
    const dx = touches[0].clientX - touchPanStart.current.x;
    const dy = touches[0].clientY - touchPanStart.current.y;
    // Если сдвиг небольшой — это тап, не пан
    if (Math.hypot(dx, dy) > 8) {
      setStagePos({
        x: touchPanOrigin.current.x + dx,
        y: touchPanOrigin.current.y + dy,
      });
    }
  }
}

function handleTouchEnd(e: KonvaEventObject<TouchEvent>) {
  if (e.evt.touches.length === 0 && e.evt.changedTouches.length === 1) {
    const touch = e.evt.changedTouches[0];

    // Проверяем что это тап (не пан)
    if (touchPanStart.current) {
      const dx = touch.clientX - touchPanStart.current.x;
      const dy = touch.clientY - touchPanStart.current.y;
      const isTap = Math.hypot(dx, dy) < 8;

      if (isTap) {
        const stage = stageRef.current;
        if (!stage) return;

        const now = Date.now();
        const isDoubleTap = now - lastTapRef.current < 300;
        lastTapRef.current = now;

        const pos: Point = {
          x: (touch.clientX - stage.container().getBoundingClientRect().left - stage.x()) / stage.scaleX(),
          y: (touch.clientY - stage.container().getBoundingClientRect().top  - stage.y()) / stage.scaleY(),
        };

        const snapped = {
          x: snapToGrid(pos.x, STEP, scale),
          y: snapToGrid(pos.y, STEP, scale),
        };

        if (isDoubleTap && activeTool === "fence" && points.length >= 2) {
          // Double tap — закрыть контур
          addPoint({ x: points[0].x, y: points[0].y });
          rebuildFence();
        } else if (activeTool === "fence") {
          addPoint(snapped);
          rebuildFence();
        } else if (activeTool === "house") {
          addHouse(snapped.x, snapped.y);
          rebuildFence();
        }
      }
    }
  }

  pinchStartDist.current = null;
  touchPanStart.current = null;
}
  

  const lastPoint   = points.length > 0 ? points[points.length - 1] : null;
  const dragLengthM = lastPoint && cursor && activeTool === "fence"
    ? pxToMeters(distPx(lastPoint, cursor))
    : null;
  const dragMid = lastPoint && cursor && activeTool === "fence"
    ? { x: (lastPoint.x + cursor.x) / 2, y: (lastPoint.y + cursor.y) / 2 }
    : null;

  return (
    <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "auto" }}>

      {/* Тулбар */}
      

      {/* Подсказка */}
     <div style={{
  position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
  zIndex: 200, background: "rgba(0,0,0,0.55)", color: "#fff",
  padding: "6px 16px", borderRadius: 20, fontSize: 12, pointerEvents: "none",
  whiteSpace: "nowrap",
}}>
  {'ontouchstart' in window
    ? '👆 Tap — add point · Two fingers — zoom/pan · Double tap — close'
    : '🖱 Mouse wheel — zoom · Middle drag — pan · Click — add point · Dbl-click — close'}
</div>

      {/* Масштаб */}
      <div style={{
        position: "fixed", bottom: 56, right: 24, zIndex: 200,
        background: "rgba(0,0,0,0.45)", color: "#fff",
        padding: "4px 10px", borderRadius: 8, fontSize: 12, pointerEvents: "none",
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
         draggable={false} 
        onWheel={handleWheel}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
onMouseUp={handleMouseUp}
onDblClick={handleDblClick}
onTouchStart={handleTouchStart}   
  onTouchMove={handleTouchMove}     
  onTouchEnd={handleTouchEnd} 
      >
        <Layer>
          {/* Фон */}
          <Rect name="bg" x={-5000} y={-5000} width={10000} height={10000} fill="#f5f5f5" />

          {/* Сетка */}
          <Grid width={size.w} height={size.h} step={STEP} metersPerCell={METERS_PER_CELL} scale={scale} />



          {/* Нарисованные линии забора */}
          {points.length > 1 && (
  <Line
    points={points.flatMap((p) => [p.x, p.y])}
    stroke="#222"
    strokeWidth={2 / scale}
    closed={
      points.length > 2 &&
      points[0].x === points[points.length - 1].x &&
      points[0].y === points[points.length - 1].y
    }
  />
)}

          {/* Длины зафиксированных сегментов */}
          {points.slice(0, -1).map((p, i) => {
            const next = points[i + 1];
            const mx   = (p.x + next.x) / 2;
            const my   = (p.y + next.y) / 2;
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

          {/* Тянущаяся preview линия */}
          {lastPoint && cursor && activeTool === "fence" && (
            <Line
              points={[lastPoint.x, lastPoint.y, cursor.x, cursor.y]}
              stroke="#4fc3a1"
              strokeWidth={2 / scale}
              dash={[8 / scale, 4 / scale]}
              listening={false}
            />
          )}

          {/* Подпись длины preview линии */}
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
                listening={false}
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
                listening={false}
              />
            </>
          )}

          {/* Точки забора */}
          {points.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={i === 0 && points.length >= 2 ? 9 / scale : 5 / scale}
fill={i === 0 && points.length >= 2 ? "#ff6600" : "red"}
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
              fill={activeTool === "fence" ? "#4fc3a1" : "#f0a500"}
              opacity={0.7}
              listening={false}
            />
          )}

          {/* Дома */}
          {houses.map((house) => (
            <HouseShape
              key={house.id}
              house={house}
              scale={scale}
              onUpdate={(patch) => { updateHouse(house.id, patch); rebuildFence(); }}
              onRemove={() => { removeHouse(house.id); rebuildFence(); }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

// ─── HouseShape ────────────────────────────────────────────────────────────────

function HouseShape({ house, scale, onUpdate, onRemove }: {
  house: House;
  scale: number;
  onUpdate: (patch: Partial<House>) => void;
  onRemove: () => void;
}) {
  const x  = house.x - house.widthPx / 2;
  const y  = house.z - house.depthPx / 2;
  const sw = 2 / scale;
  const hr = HANDLE_R / scale;

  const wM = pxToMeters(house.widthPx).toFixed(1);
  const dM = pxToMeters(house.depthPx).toFixed(1);

  type Corner = "tl" | "tr" | "br" | "bl";

  function handleCornerDrag(corner: Corner, nx: number, ny: number) {
    const left   = house.x - house.widthPx / 2;
    const right  = house.x + house.widthPx / 2;
    const top    = house.z - house.depthPx / 2;
    const bottom = house.z + house.depthPx / 2;

    let cx = house.x, cz = house.z, w = house.widthPx, d = house.depthPx;

    if (corner === "tl")      { w = right - nx; d = bottom - ny; cx = nx + w / 2; cz = ny + d / 2; }
    else if (corner === "tr") { w = nx - left;  d = bottom - ny; cx = left + w / 2; cz = ny + d / 2; }
    else if (corner === "br") { w = nx - left;  d = ny - top;   cx = left + w / 2; cz = top + d / 2; }
    else                      { w = right - nx; d = ny - top;   cx = nx + w / 2;  cz = top + d / 2; }

    if (w < 30 || d < 30) return;
    onUpdate({ x: cx, z: cz, widthPx: w, depthPx: d });
  }

  const corners: { corner: Corner; cx: number; cy: number }[] = [
    { corner: "tl", cx: x,                 cy: y },
    { corner: "tr", cx: x + house.widthPx, cy: y },
    { corner: "br", cx: x + house.widthPx, cy: y + house.depthPx },
    { corner: "bl", cx: x,                 cy: y + house.depthPx },
  ];

  const labelFontSize = 12 / scale;
  const labelPad      = 4 / scale;
  const labelText     = `${wM} × ${dM} м`;
  const labelW        = labelText.length * labelFontSize * 0.62 + labelPad * 2;
  const labelH        = labelFontSize + labelPad * 2;

  return (
    <Group>
      {/* Тело дома */}
      <Rect
        name="house-body"
        x={x} y={y}
        width={house.widthPx} height={house.depthPx}
        fill="rgba(180,160,120,0.5)"
        stroke="#8B6914" strokeWidth={sw}
        dash={[6 / scale, 3 / scale]}
        draggable
        onDragEnd={(e) => {
          const nx = snapToGrid(e.target.x() + house.widthPx / 2, STEP, scale);
          const nz = snapToGrid(e.target.y() + house.depthPx / 2, STEP, scale);
          e.target.position({ x: nx - house.widthPx / 2, y: nz - house.depthPx / 2 });
          onUpdate({ x: nx, z: nz });
        }}
        onDblClick={onRemove}
      />

      {/* Крыша */}
      <Line
        points={[
          x + house.widthPx * 0.1, y,
          x + house.widthPx / 2,   y - 20 / scale,
          x + house.widthPx * 0.9, y,
        ]}
        stroke="#8B6914" strokeWidth={sw}
        listening={false}
      />

      {/* Метка размера — обновляется при ресайзе */}
      <Rect
        x={house.x - labelW / 2}
        y={house.z - labelH / 2}
        width={labelW} height={labelH}
        fill="rgba(139,105,20,0.85)"
        cornerRadius={3 / scale}
        listening={false}
      />
      <Text
        x={house.x - labelW / 2 + labelPad}
        y={house.z - labelH / 2 + labelPad}
        text={labelText}
        fontSize={labelFontSize}
        fill="#ffffff"
        fontStyle="bold"
        listening={false}
      />

      {/* Угловые ручки */}
      {corners.map(({ corner, cx, cy }) => (
        <Circle
          key={corner}
          x={cx} y={cy}
          radius={hr}
          fill="white"
          stroke="#8B6914" strokeWidth={sw}
          draggable
          onDragMove={(e) => handleCornerDrag(corner, e.target.x(), e.target.y())}
          onDragEnd={(e)  => handleCornerDrag(corner, e.target.x(), e.target.y())}
        />
      ))}
    </Group>
  );
}

// ─── ToolBtn ───────────────────────────────────────────────────────────────────

function ToolBtn({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
        background: active ? "#4fc3a1" : "rgba(255,255,255,0.15)",
        color: active ? "#000" : "#fff",
        fontWeight: active ? 700 : 400, fontSize: 13,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}