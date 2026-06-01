import { useMemo } from "react";
import * as THREE from "three";

const SCALE = 50;

type Props = {
  x: number;
  z: number;
  widthPx: number;
  depthPx: number;
};

export default function ProceduralHouse({ x, z, widthPx, depthPx }: Props) {
  const w = widthPx / SCALE;
  const d = depthPx / SCALE;
  const wallH = 2.4;
  const roofH = 1.2;

  const roofGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo( w / 2, 0);
    shape.lineTo( 0, roofH);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -d / 2);
    return geo;
  }, [w, d, roofH]);

  const cx = x / SCALE;
  const cz = z / SCALE;

  return (
    <group position={[cx, 0, cz]}>
      {/* Фундамент */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w + 0.1, 0.1, d + 0.1]} />
        <meshStandardMaterial color="#9e9e9e" roughness={0.9} />
      </mesh>

      {/* Стены */}
      <mesh position={[0, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, d]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.8} />
      </mesh>

      {/* Рамки окон */}
      {[-w * 0.2, w * 0.2].map((ox, i) => (
        <mesh key={`frame-${i}`} position={[ox, wallH * 0.6, d / 2 + 0.02]}>
          <boxGeometry args={[0.7, 0.7, 0.03]} />
          <meshStandardMaterial color="#c8a87a" roughness={0.8} />
        </mesh>
      ))}

      {/* Стёкла окон */}
      {[-w * 0.2, w * 0.2].map((ox, i) => (
        <mesh key={`glass-${i}`} position={[ox, wallH * 0.6, d / 2 + 0.03]}>
          <boxGeometry args={[0.6, 0.6, 0.02]} />
          <meshStandardMaterial color="#a8d8ea" roughness={0.1} metalness={0.3} />
        </mesh>
      ))}

      {/* Дверь */}
      <mesh position={[0, wallH * 0.28, d / 2 + 0.02]}>
        <boxGeometry args={[0.7, wallH * 0.55, 0.03]} />
        <meshStandardMaterial color="#6b4226" roughness={0.9} />
      </mesh>

      {/* Крыша */}
      <mesh geometry={roofGeometry} position={[0, wallH, 0]} castShadow>
        <meshStandardMaterial color="#8b3a3a" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Конёк */}
      <mesh position={[0, wallH + roofH - 0.05, 0]}>
        <boxGeometry args={[0.12, 0.12, d + 0.2]} />
        <meshStandardMaterial color="#6b2a2a" roughness={0.7} />
      </mesh>
    </group>
  );
}