import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, useTexture } from "@react-three/drei";
import { Suspense, useMemo } from "react"; 
import { useDesignerStore } from "../../store/useDesignerStore";
import PillarModel from "./PillarModel";
import PanelModel from "./PanelModel";
import ProceduralHouse from "./ProceduralHouse";
import * as THREE from "three";


const SCALE = 50;

export default function Scene() {
  const panelOrientation = useDesignerStore((s) => s.panelOrientation);
  const fenceItems   = useDesignerStore((s) => s.fenceItems);
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const rows         = useDesignerStore((s) => s.rows);
const singleModel  = useDesignerStore((s) => s.singleModel);
const singlePanel  = useDesignerStore((s) => s.singlePanel);
  const activePillar = useDesignerStore((s) => s.activePillar);
  const houses       = useDesignerStore((s) => s.houses);
  const PILLAR_INWARD_OFFSET = 0.12; 

  return (
    <Canvas
      camera={{ position: [0, 15, 25], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ localClippingEnabled: true }}
      shadows
    >
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[15, 20, 10]} intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Дома */}
      {houses.map((house) => (
        <ProceduralHouse
          key={house.id}
          x={house.x} z={house.z}
          widthPx={house.widthPx}
          depthPx={house.depthPx}
        />
      ))}

      {/* Забор */}
      {fenceItems.map((item, idx) => {
        const x = item.x / SCALE;
        const z = item.z / SCALE;
        const rotY = -item.rotation;

        if (item.type === "post") {
  // При inward сдвигаем пиллар вдоль направления секции
  
   return (
    <Suspense fallback={null} key={`post-${idx}`}>
      <PillarModel
        modelPath={activePillar.modelPath}
        burialM={activePillar.burialCm / 100}
        fenceHeightM={fenceHeightCm / 100}
        position={[x, 0, z]}
        rotation={[0, rotY, 0]}
        panelOrientation={panelOrientation}
      />
    </Suspense>
  );
}
const row = getRow(item.rowIndex ?? 0);
if (!row) return null;
function getRow(rowIndex: number) {
  if (singleModel) {
    return { heightCm: fenceHeightCm, panel: singlePanel };
  }
  return rows[rowIndex] ?? rows[0];
}

const is30 = row.panel.heightCm === 30;
const isDouble = row.panel.side === 'double'; 
const panelOffset = 
  is30 ? (panelOrientation === 'inward' ? 0.06 : -0.06) :
  isDouble ? (panelOrientation === 'inward' ? 0.02 : -0.02) :  // ← ДОБАВИТЬ
  0;
const px = x + panelOffset * Math.sin(rotY); // ← sin/cos поменял местами
const pz = z + panelOffset * Math.cos(rotY); // ← убрал минус

return (
  <Suspense fallback={null} key={`panel-${idx}`}>
    <PanelModel
      modelPath={row.panel.modelPath}
      position={[px, item.y, pz]}
      rotation={[0, rotY, 0]}
      widthRatio={item.widthRatio ?? 1}
    />
  </Suspense>
);
      })}
      
      <OrbitControls makeDefault />
            <Suspense fallback={null}>
        <GroundPlane />
      </Suspense>
    </Canvas>
  );
}
function GroundPlane() {
  const groundType = useDesignerStore((s) => s.groundType);

  if (groundType === 'grid') {
    return (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
        <Grid
          args={[100, 100]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#888888"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#555555"
          fadeDistance={80}
          infiniteGrid
        />
      </>
    );
  }

  return <TexturedGround groundType={groundType} />;
}

// ← отдельный компонент, useTexture всегда вызывается безусловно
function TexturedGround({ groundType }: { groundType: 'grass' | 'calcada' | 'ground' }) {
  const texturePath = {
    grass:   '/textures/grass.jpg',
    calcada: '/textures/calcada.jpg',
    ground:  '/textures/ground.jpg',
  }[groundType];

  const texture = useTexture(texturePath);

  // useMemo чтобы не мутировать напрямую
  useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  );
}