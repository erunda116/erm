import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, useTexture, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useDesignerStore } from "../../store/useDesignerStore";
import PillarModel from "./PillarModel";
import PanelModel from "./PanelModel";
import ProceduralHouse from "./ProceduralHouse";
import * as THREE from "three";

const SCALE = 50;

function AxisLabel({
  text,
  position,
  color,
  onClick,
}: {
  text: string;
  position: [number, number, number];
  color: string;
  onClick?: (e: any) => void;
}) {
  const canvas = useMemo(() => {
    const size = 160;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;

    const ctx = c.getContext("2d");
    if (!ctx) return c;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 122, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(158,158,158,0.96)";
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(15,23,42,0.12)";
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "bold 154px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2 + 1);

    return c;
  }, [text, color]);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    return t;
  }, [canvas]);

  return (
    <sprite
      position={position}
      scale={[0.28, 0.28, 0.28]}
      renderOrder={999}
      onClick={onClick}
    >
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </sprite>
  );
}

function CameraSphereGizmo({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const anchorRef = useRef<THREE.Group>(null);

  const animRef = useRef<{
    active: boolean;
    start: number;
    duration: number;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromQuat: THREE.Quaternion;
    toQuat: THREE.Quaternion;
  } | null>(null);

  const moveToAxis = (axis: "x" | "y" | "z", negative = false) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const target = controls.target.clone();
    const currentOffset = camera.position.clone().sub(target);
    const distance = Math.max(currentOffset.length(), 8);

    const dir = new THREE.Vector3();
    if (axis === "x") dir.set(negative ? -1 : 1, 0, 0);
    if (axis === "y") dir.set(0, negative ? -1 : 1, 0);
    if (axis === "z") dir.set(0, 0, negative ? -1 : 1);

    const toPos = target.clone().add(dir.multiplyScalar(distance));

    const tempCam = camera.clone();
    tempCam.position.copy(toPos);
    tempCam.lookAt(target);

    animRef.current = {
      active: true,
      start: performance.now(),
      duration: 450,
      fromPos: camera.position.clone(),
      toPos,
      fromQuat: camera.quaternion.clone(),
      toQuat: tempCam.quaternion.clone(),
    };
  };

  useFrame(() => {
    if (!groupRef.current || !anchorRef.current) return;

    const controls = controlsRef.current;
    const anim = animRef.current;

    if (anim?.active && controls) {
      const t = Math.min((performance.now() - anim.start) / anim.duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(anim.fromPos, anim.toPos, eased);
      camera.quaternion.slerpQuaternions(anim.fromQuat, anim.toQuat, eased);
      controls.update();

      if (t >= 1) {
        anim.active = false;
      }
    }

    groupRef.current.quaternion.copy(camera.quaternion);

    const isMobile = size.width <= 768;

    const offset = isMobile
      ? new THREE.Vector3(0, -1.9, -5.5).applyQuaternion(camera.quaternion)
      : new THREE.Vector3(1.5, -2.0, -5.5).applyQuaternion(camera.quaternion);

    anchorRef.current.position.copy(camera.position).add(offset);
    anchorRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={anchorRef} renderOrder={999}>
      <group ref={groupRef} scale={0.42} renderOrder={999}>
        <mesh renderOrder={999}>
          <sphereGeometry args={[0.62, 48, 48]} />
          <meshStandardMaterial
            color="#f5f5f4"
            transparent
            opacity={0.14}
            roughness={0.25}
            metalness={0.0}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <mesh renderOrder={999}>
          <sphereGeometry args={[0.625, 24, 24]} />
          <meshBasicMaterial
            color="#a8a29e"
            wireframe
            transparent
            opacity={0.7}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <mesh renderOrder={999}>
          <sphereGeometry args={[0.07, 24, 24]} />
          <meshStandardMaterial
            color="#57534e"
            metalness={0.2}
            roughness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <mesh
          rotation={[0, 0, Math.PI / 2]}
          position={[0.31, 0, 0]}
          renderOrder={999}
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("x");
          }}
        >
          <cylinderGeometry args={[0.01, 0.01, 0.62, 16]} />
          <meshStandardMaterial
            color="#c2410c"
            emissive="#7c2d12"
            emissiveIntensity={0.18}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <mesh
          position={[0.66, 0, 0]}
          renderOrder={999}
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("x");
          }}
        >
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshStandardMaterial
            color="#c2410c"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <AxisLabel
          text="X"
          position={[0.9, 0, 0]}
          color="#ffffff"
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("x");
          }}
        />

        <mesh
          position={[0, 0.31, 0]}
          renderOrder={999}
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("y");
          }}
        >
          <cylinderGeometry args={[0.01, 0.01, 0.62, 16]} />
          <meshStandardMaterial
            color="#15803d"
            emissive="#14532d"
            emissiveIntensity={0.18}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <mesh
          position={[0, 0.66, 0]}
          renderOrder={999}
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("y");
          }}
        >
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshStandardMaterial
            color="#15803d"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <AxisLabel
          text="Y"
          position={[0, 0.9, 0]}
          color="#ffffff"
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("y");
          }}
        />

        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.31]}
          renderOrder={999}
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("z");
          }}
        >
          <cylinderGeometry args={[0.01, 0.01, 0.62, 16]} />
          <meshStandardMaterial
            color="#1d4ed8"
            emissive="#1e3a8a"
            emissiveIntensity={0.18}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <mesh
          position={[0, 0, 0.66]}
          renderOrder={999}
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("z");
          }}
        >
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshStandardMaterial
            color="#1d4ed8"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <AxisLabel
          text="Z"
          position={[0, 0, 0.9]}
          color="#ffffff"
          onClick={(e) => {
            e.stopPropagation();
            moveToAxis("z");
          }}
        />
      </group>
    </group>
  );
}

export default function Scene() {
  const panelOrientation = useDesignerStore((s) => s.panelOrientation);
  const fenceItems = useDesignerStore((s) => s.fenceItems);
  const fenceHeightCm = useDesignerStore((s) => s.fenceHeightCm);
  const rows = useDesignerStore((s) => s.rows);
  const singleModel = useDesignerStore((s) => s.singleModel);
  const singlePanel = useDesignerStore((s) => s.singlePanel);
  const activePillar = useDesignerStore((s) => s.activePillar);
  const houses = useDesignerStore((s) => s.houses);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  function getRow(rowIndex: number) {
    if (singleModel) {
      return { heightCm: fenceHeightCm, panel: singlePanel };
    }
    return rows[rowIndex] ?? rows[0];
  }

  return (
    <Canvas
      camera={{ position: [0, 15, 25], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ localClippingEnabled: true }}
      shadows
    >
     {/* 1. Environment Map for realistic reflections and global illumination */}
      <Environment preset="park" background={false} />

      {/* 2. Hemisphere light to simulate sky and ground bounce light */}
      <hemisphereLight skyColor="#ffffff" groundColor="#444444" intensity={0.6} />

      {/* 3. Main sun with optimized shadow properties */}
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40]} />
      </directionalLight>

      {/* 4. Soft fill light from the opposite angle to soften harsh shadows */}
      <directionalLight position={[-15, 10, -10]} intensity={0.5} />

      {houses.map((house) => (
        <ProceduralHouse
          key={house.id}
          x={house.x}
          z={house.z}
          widthPx={house.widthPx}
          depthPx={house.depthPx}
        />
      ))}

      {fenceItems.map((item, idx) => {
        const x = item.x / SCALE;
        const z = item.z / SCALE;
        const rotY = -item.rotation;

        if (item.type === "post") {
  const pillarOffset =
    panelOrientation === "inward" ? -0.12 : 0;

  const pillarX = x + pillarOffset * Math.sin(rotY);
  const pillarZ = z + pillarOffset * Math.cos(rotY);

  return (
    <Suspense fallback={null} key={`post-${idx}`}>
      <PillarModel
        modelPath={activePillar.modelPath}
        burialM={activePillar.burialCm / 100}
        fenceHeightM={fenceHeightCm / 100}
        position={[pillarX, 0, pillarZ]}
        rotation={[0, rotY, 0]}
        panelOrientation={panelOrientation}
      />
    </Suspense>
  );
}

        const row = getRow(item.rowIndex ?? 0);
        if (!row) return null;

        const is30 = row.panel.heightCm === 30;
        const isDouble = row.panel.side === "double";

        const panelOffset =
  is30
    ? panelOrientation === "inward"
      ? -0.06
      : -0.06
    : isDouble
    ? panelOrientation === "inward"
      ? -0.1
      : -0.02
    : panelOrientation === "inward"
    ? -0.12
    : 0;

        const px = x + panelOffset * Math.sin(rotY);
        const pz = z + panelOffset * Math.cos(rotY);

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

      <OrbitControls
  ref={controlsRef}
  makeDefault
  enableDamping
  dampingFactor={0.08}
  screenSpacePanning={false}
  minDistance={4}
  maxDistance={120}
  minPolarAngle={0}
  // Change this line from Math.PI to Math.PI / 2
  maxPolarAngle={Math.PI / 2}
  rotateSpeed={0.6} // Controls how fast the camera orbits
        zoomSpeed={0.5}   // Controls the scroll wheel zoom speed
        panSpeed={0.6}    // Controls the right-click drag speed
/>

      <CameraSphereGizmo controlsRef={controlsRef} />
        <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={80}
        blur={2}
        far={10}
        resolution={1024}
        color="#000000"
      />
      <Suspense fallback={null}>
        <GroundPlane />
      </Suspense>
    </Canvas>
  );
}

function GroundPlane() {
  const groundType = useDesignerStore((s) => s.groundType);

  if (groundType === "grid") {
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

function TexturedGround({ groundType }: { groundType: "grass" | "calcada" | "ground" }) {
  const texturePath = {
    grass: "/textures/grass.jpg",
    calcada: "/textures/calcada.jpg",
    ground: "/textures/ground.jpg",
  }[groundType];

  const texture = useTexture(texturePath);

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