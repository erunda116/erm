import { useMemo } from "react";
import * as THREE from "three";

const SCALE = 50;

type Props = {
  x: number;
  z: number;
  widthPx: number;
  depthPx: number;
};

// Тип дома по размеру
type HouseType = "small" | "medium" | "large";

function getHouseType(w: number, d: number): HouseType {
  const area = w * d;
  if (area < 30) return "small";
  if (area < 80) return "medium";
  return "large";
}

// Процедурная черепица через canvas → CanvasTexture
function useTileTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Фон крыши
    ctx.fillStyle = "#8b2c2c";
    ctx.fillRect(0, 0, size, size);

    // Черепица
    const tW = 32;
    const tH = 24;
    for (let row = 0; row < size / tH + 1; row++) {
      for (let col = 0; col < size / tW + 1; col++) {
        const offsetX = row % 2 === 0 ? 0 : tW / 2;
        const tx = col * tW - offsetX;
        const ty = row * tH;

        // Основная плитка
        ctx.fillStyle = `hsl(${0 + Math.random() * 8}, 55%, ${28 + Math.random() * 6}%)`;
        ctx.beginPath();
        ctx.roundRect(tx + 1, ty + 1, tW - 2, tH - 1, 3);
        ctx.fill();

        // Тень снизу плитки
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(tx + 1, ty + tH - 4, tW - 2, 3);

        // Блик сверху
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(tx + 2, ty + 2, tW - 4, 4);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);
}

// Процедурная текстура стены (штукатурка)
function useWallTexture(color: string) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // Лёгкий шум штукатурки
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.5;
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }, [color]);
}

export default function ProceduralHouse({ x, z, widthPx, depthPx }: Props) {
  const w = widthPx / SCALE;
  const d = depthPx / SCALE;
  const cx = x / SCALE;
  const cz = z / SCALE;
  const houseType = getHouseType(w, d);
  const tileTexture = useTileTexture();
  const wallTexture = useWallTexture("#f0ead8");

  // Размеры адаптируются к типу дома
  const wallH = houseType === "small" ? 2.4 : houseType === "medium" ? 2.8 : 3.2;
  const roofPitch = houseType === "large" ? 0.35 : 0.42; // крутизна крыши
  const roofH = Math.min(w * roofPitch, houseType === "small" ? 1.4 : 2.2);
  const overhang = 0.4; // свес крыши

  // Геометрия крыши
  const roofGeometry = useMemo(() => {
    const hw = w / 2 + overhang;
    const hd = d / 2 + overhang;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(0, roofH);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d + overhang * 2,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -hd);
    return geo;
  }, [w, d, roofH, overhang]);

  // Геометрия фронтонов
  const gableGeo = useMemo(() => {
    const hw = w / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(0, roofH);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [w, roofH]);

  // Количество окон — строго фиксированное по типу, не адаптивное
  const frontWindows = houseType === "small" ? 1 : houseType === "medium" ? 2 : 3;
  const sideWindows = houseType === "small" ? 1 : houseType === "medium" ? 2 : Math.min(3, Math.floor(d / 3));

  // Позиции окон по фасаду — равномерно, но с учётом двери
  const doorX = 0; // дверь всегда по центру
  const frontWindowPositions = useMemo(() => {
    const positions: number[] = [];
    if (frontWindows === 1) {
      // Одно окно — сбоку от двери
      positions.push(w * 0.28);
    } else if (frontWindows === 2) {
      positions.push(-w * 0.3, w * 0.3);
    } else {
      // 3 окна — симметрично, дверь по центру
      positions.push(-w * 0.35, w * 0.35);
      // Третье окно над дверью (фрамуга) — не добавляем, просто 2 боковых
    }
    return positions;
  }, [frontWindows, w]);

  const sideWindowPositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < sideWindows; i++) {
      positions.push(-d / 2 + (d / (sideWindows + 1)) * (i + 1));
    }
    return positions;
  }, [sideWindows, d]);

  const winW = houseType === "small" ? 0.75 : 0.9;
  const winH = houseType === "small" ? 0.85 : 1.0;
  const winY = wallH * 0.58;
  const doorH = wallH * 0.72;
  const doorW = houseType === "small" ? 0.85 : 1.0;

  return (
    <group position={[cx, 0, cz]}>

      {/* === ФУНДАМЕНТ === */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[w + 0.3, 0.2, d + 0.3]} />
        <meshStandardMaterial color="#b8b0a4" roughness={1} />
      </mesh>

      {/* === ЦОКОЛЬ === */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[w + 0.15, 0.4, d + 0.15]} />
        <meshStandardMaterial color="#d0c8bc" roughness={0.95} />
      </mesh>

      {/* === СТЕНЫ === */}
      <mesh position={[0, wallH / 2 + 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, d]} />
        <meshStandardMaterial map={wallTexture} roughness={0.85} />
      </mesh>

      {/* === ДЕКОРАТИВНЫЙ ПОЯС (карниз между этажом и крышей) === */}
      <mesh position={[0, wallH + 0.3, 0]}>
        <boxGeometry args={[w + 0.1, 0.12, d + 0.1]} />
        <meshStandardMaterial color="#e8e0cc" roughness={0.7} />
      </mesh>

      {/* === УГЛОВЫЕ ПИЛЯСТРЫ === */}
      {([-w / 2, w / 2] as number[]).map((ox, i) => (
        <mesh key={`pil-${i}`} position={[ox, wallH / 2 + 0.3, 0]} castShadow>
          <boxGeometry args={[0.14, wallH + 0.05, d + 0.14]} />
          <meshStandardMaterial color="#e8e0cc" roughness={0.85} />
        </mesh>
      ))}

      {/* === ОКНА ФАСАДА === */}
      {frontWindowPositions.map((ox, i) => (
        <Window
          key={`wf-${i}`}
          position={[ox, winY + 0.3, d / 2 + 0.02]}
          width={winW}
          height={winH}
          rotation={[0, 0, 0]}
          type={houseType}
        />
      ))}

      {/* === ОКНА ЗАДНЕЙ СТЕНЫ === */}
      {frontWindowPositions.map((ox, i) => (
        <Window
          key={`wb-${i}`}
          position={[ox, winY + 0.3, -d / 2 - 0.02]}
          width={winW}
          height={winH}
          rotation={[0, Math.PI, 0]}
          type={houseType}
        />
      ))}

      {/* === ОКНА БОКОВЫХ СТЕН === */}
      {sideWindowPositions.map((oz, i) => (
        <group key={`ws-${i}`}>
          <Window
            position={[w / 2 + 0.02, winY + 0.3, oz]}
            width={winW}
            height={winH}
            rotation={[0, Math.PI / 2, 0]}
            type={houseType}
          />
          <Window
            position={[-w / 2 - 0.02, winY + 0.3, oz]}
            width={winW}
            height={winH}
            rotation={[0, -Math.PI / 2, 0]}
            type={houseType}
          />
        </group>
      ))}

      {/* === ДВЕРЬ === */}
      <Door
        position={[doorX, doorH / 2 + 0.2, d / 2 + 0.02]}
        width={doorW}
        height={doorH}
        type={houseType}
      />

      {/* === СТУПЕНИ === */}
      <mesh position={[doorX, 0.12, d / 2 + 0.28]}>
        <boxGeometry args={[doorW + 0.4, 0.12, 0.4]} />
        <meshStandardMaterial color="#c8c0b4" roughness={0.9} />
      </mesh>
      <mesh position={[doorX, 0.06, d / 2 + 0.5]}>
        <boxGeometry args={[doorW + 0.6, 0.06, 0.3]} />
        <meshStandardMaterial color="#bab2a6" roughness={0.9} />
      </mesh>

      {/* === КОЗЫРЁК НАД ДВЕРЬЮ === */}
      <mesh position={[doorX, doorH + 0.35, d / 2 + 0.2]}>
        <boxGeometry args={[doorW + 0.6, 0.1, 0.5]} />
        <meshStandardMaterial color="#7a2a2a" roughness={0.8} />
      </mesh>
      <mesh position={[doorX, doorH + 0.28, d / 2 + 0.42]}>
        <boxGeometry args={[doorW + 0.5, 0.06, 0.06]} />
        <meshStandardMaterial color="#5a1a1a" roughness={0.7} />
      </mesh>

      {/* === КРЫША === */}
      <mesh geometry={roofGeometry} position={[0, wallH + 0.36, 0]} castShadow>
        <meshStandardMaterial
          map={tileTexture}
          roughness={0.9}
          side={THREE.DoubleSide}
          onBeforeCompile={(shader) => {
            // UV repeat для черепицы по размеру крыши
            shader.uniforms.uvScale = { value: new THREE.Vector2(w / 2, d / 3) };
          }}
        />
      </mesh>

      {/* === ФРОНТОНЫ === */}
      <mesh geometry={gableGeo} position={[0, wallH + 0.36, d / 2 + overhang + 0.01]} castShadow>
        <meshStandardMaterial map={wallTexture} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={gableGeo} position={[0, wallH + 0.36, -(d / 2 + overhang + 0.01)]} castShadow>
        <meshStandardMaterial map={wallTexture} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* === КОНЁК === */}
      <mesh position={[0, wallH + roofH + 0.38, 0]}>
        <boxGeometry args={[0.12, 0.12, d + overhang * 2 + 0.1]} />
        <meshStandardMaterial color="#5a1a1a" roughness={0.7} />
      </mesh>

      {/* === ТРУБА (только medium и large) === */}
      {houseType !== "small" && (
        <Chimney
          position={[w * 0.22, wallH + roofH * 0.5 + 0.36, d * 0.1]}
          roofH={roofH}
          wallH={wallH}
          type={houseType}
        />
      )}

    </group>
  );
}

// ─── Компонент окна ───────────────────────────────────────────────────────────
function Window({ position, width, height, rotation, type }: {
  position: [number, number, number];
  width: number;
  height: number;
  rotation: [number, number, number];
  type: HouseType;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Наличник */}
      <mesh>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.07]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.8} />
      </mesh>
      {/* Рама */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.07]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.6} />
      </mesh>
      {/* Стекло */}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[width - 0.08, height - 0.08, 0.03]} />
        <meshStandardMaterial
          color="#c8e4f8"
          roughness={0.05}
          metalness={0.3}
          transparent
          opacity={0.75}
        />
      </mesh>
      {/* Горизонтальный переплёт */}
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[width - 0.06, 0.05, 0.03]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.7} />
      </mesh>
      {/* Вертикальный переплёт */}
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[0.05, height - 0.06, 0.03]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.7} />
      </mesh>
      {/* Подоконник */}
      <mesh position={[0, -(height / 2 + 0.04), 0.1]}>
        <boxGeometry args={[width + 0.3, 0.08, 0.18]} />
        <meshStandardMaterial color="#ede5d0" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Компонент двери ──────────────────────────────────────────────────────────
function Door({ position, width, height, type }: {
  position: [number, number, number];
  width: number;
  height: number;
  type: HouseType;
}) {
  return (
    <group position={position}>
      {/* Дверная коробка */}
      <mesh>
        <boxGeometry args={[width + 0.2, height + 0.1, 0.1]} />
        <meshStandardMaterial color="#c8a87a" roughness={0.85} />
      </mesh>
      {/* Полотно двери */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[width - 0.04, height - 0.04, 0.06]} />
        <meshStandardMaterial color="#7a4a28" roughness={0.9} />
      </mesh>
      {/* Панели на двери */}
      {[-height * 0.2, height * 0.15].map((oy, i) => (
        <mesh key={`panel-${i}`} position={[0, oy, 0.1]}>
          <boxGeometry args={[width * 0.7, height * 0.25, 0.03]} />
          <meshStandardMaterial color="#6a3a18" roughness={0.9} />
        </mesh>
      ))}
      {/* Фрамуга (маленькое окошко сверху двери) */}
      <mesh position={[0, height * 0.42, 0.08]}>
        <boxGeometry args={[width * 0.7, height * 0.12, 0.04]} />
        <meshStandardMaterial
          color="#c8e4f8"
          transparent
          opacity={0.8}
          roughness={0.05}
          metalness={0.2}
        />
      </mesh>
      {/* Ручка */}
      <mesh position={[width * 0.3, 0, 0.13]}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
        <meshStandardMaterial color="#c8a040" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[width * 0.3, -0.06, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
        <meshStandardMaterial color="#c8a040" metalness={0.85} roughness={0.15} />
      </mesh>
    </group>
  );
}

// ─── Компонент трубы ──────────────────────────────────────────────────────────
function Chimney({ position, roofH, wallH, type }: {
  position: [number, number, number];
  roofH: number;
  wallH: number;
  type: HouseType;
}) {
  const h = roofH * 0.9 + 0.4;
  return (
    <group position={position}>
      {/* Тело трубы */}
      <mesh castShadow>
        <boxGeometry args={[0.3, h, 0.3]} />
        <meshStandardMaterial color="#c4a882" roughness={0.95} />
      </mesh>
      {/* Оголовок */}
      <mesh position={[0, h / 2 + 0.06, 0]}>
        <boxGeometry args={[0.42, 0.1, 0.42]} />
        <meshStandardMaterial color="#b09870" roughness={0.9} />
      </mesh>
      {/* Колпак */}
      <mesh position={[0, h / 2 + 0.14, 0]}>
        <coneGeometry args={[0.22, 0.2, 4]} />
        <meshStandardMaterial color="#8b3a3a" roughness={0.8} />
      </mesh>
    </group>
  );
}