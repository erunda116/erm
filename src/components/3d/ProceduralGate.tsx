import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number; // ДОБАВЛЕНА ВЫСОТА!
  rotation: number;
};

export default function ProceduralGate({ x, y, z, width, height, rotation }: Props) {
  const frameT = 0.05; 
  const hw = width / 2;

  return (
    <group position={[x, y, z]} rotation={[0, -rotation, 0]}>
      {[-1, 1].map((side, idx) => {
        const cx = side * (hw / 2);
        const panelW = hw - 0.04; 

        return (
          <group key={idx} position={[cx, 0, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[panelW, frameT, frameT]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
            </mesh>
            
            <mesh position={[0, height, 0]}>
              <boxGeometry args={[panelW, frameT, frameT]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
            </mesh>

            <mesh position={[-panelW / 2 + frameT / 2, height / 2 + 0.05, 0]}>
              <boxGeometry args={[frameT, height - 0.1, frameT]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
            </mesh>
            <mesh position={[panelW / 2 - frameT / 2, height / 2 + 0.05, 0]}>
              <boxGeometry args={[frameT, height - 0.1, frameT]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
            </mesh>

            {Array.from({ length: Math.floor(panelW / 0.12) }).map((_, i, arr) => {
              const count = arr.length;
              const spacing = panelW / count;
              const bx = -panelW / 2 + spacing / 2 + i * spacing;
              return (
                <mesh key={i} position={[bx, height / 2 + 0.05, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, height - 0.1, 8]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}