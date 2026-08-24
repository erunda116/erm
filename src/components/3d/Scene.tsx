import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useDesignerStore } from "../../store/useDesignerStore";
import PillarModel from "./PillarModel";
import PanelModel from "./PanelModel";
import ProceduralHouse from "./ProceduralHouse";
import ProceduralGate from "./ProceduralGate";
import * as THREE from "three";

const SCALE = 50;

function getElevationAt(vx: number, vz: number, posts: any[]) {
  if (posts.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (let i = 0; i < posts.length; i++) {
    const pt = posts[i];
    const px = pt.x / SCALE;
    const pz = pt.z / SCALE;
    const groundEl = pt.y - (pt.extraBurial || 0); 

    const d = Math.hypot(vx - px, vz - pz);
    if (d < 0.05) return groundEl; 
    
    const w = 1 / (d * d); 
    num += w * groundEl;
    den += w;
  }
  return num / den;
}

function CameraCollider({ posts }: { posts: any[] }) {
  const { camera } = useThree();
  useFrame(() => {
    const groundY = getElevationAt(camera.position.x, camera.position.z, posts);
    if (camera.position.y < groundY + 0.5) {
      camera.position.y = groundY + 0.5;
    }
  });
  return null;
}

function AxisLabel({ text, position, color, onClick }: { text: string; position: [number, number, number]; color: string; onClick?: (e: any) => void; }) {
  const canvas = useMemo(() => {
    const size = 160, c = document.createElement("canvas"), ctx = c.getContext("2d");
    if (!ctx) return c;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); ctx.arc(size / 2, size / 2, 122, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(158,158,158,0.96)"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(15,23,42,0.12)"; ctx.stroke();
    ctx.fillStyle = color; ctx.font = "bold 154px Inter, Arial, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, size / 2, size / 2 + 1);
    return c;
  }, [text, color]);
  const texture = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.needsUpdate = true; return t; }, [canvas]);
  return (
    <sprite position={position} scale={[0.28, 0.28, 0.28]} renderOrder={999} onClick={onClick}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function CameraSphereGizmo({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null>; }) {
  const { camera, size } = useThree();
  const groupRef = useRef<THREE.Group>(null), anchorRef = useRef<THREE.Group>(null);
  const animRef = useRef<{ active: boolean; start: number; duration: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromQuat: THREE.Quaternion; toQuat: THREE.Quaternion; } | null>(null);

  const moveToAxis = (axis: "x" | "y" | "z", negative = false) => {
    const controls = controlsRef.current; if (!controls) return;
    const target = controls.target.clone();
    const currentOffset = camera.position.clone().sub(target);
    const distance = Math.max(currentOffset.length(), 8);
    const dir = new THREE.Vector3();
    if (axis === "x") dir.set(negative ? -1 : 1, 0, 0);
    if (axis === "y") dir.set(0, negative ? -1 : 1, 0);
    if (axis === "z") dir.set(0, 0, negative ? -1 : 1);
    const toPos = target.clone().add(dir.multiplyScalar(distance));
    const tempCam = camera.clone(); tempCam.position.copy(toPos); tempCam.lookAt(target);
    animRef.current = { active: true, start: performance.now(), duration: 450, fromPos: camera.position.clone(), toPos, fromQuat: camera.quaternion.clone(), toQuat: tempCam.quaternion.clone() };
  };

  useFrame(() => {
    if (!groupRef.current || !anchorRef.current) return;
    const controls = controlsRef.current, anim = animRef.current;
    if (anim?.active && controls) {
      const t = Math.min((performance.now() - anim.start) / anim.duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(anim.fromPos, anim.toPos, eased);
      camera.quaternion.slerpQuaternions(anim.fromQuat, anim.toQuat, eased);
      controls.update();
      if (t >= 1) anim.active = false;
    }
    groupRef.current.quaternion.copy(camera.quaternion);
    const offset = size.width <= 768 ? new THREE.Vector3(0, -1.9, -5.5).applyQuaternion(camera.quaternion) : new THREE.Vector3(1.5, -2.0, -5.5).applyQuaternion(camera.quaternion);
    anchorRef.current.position.copy(camera.position).add(offset);
    anchorRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={anchorRef} renderOrder={999}>
      <group ref={groupRef} scale={0.42} renderOrder={999}>
        <mesh renderOrder={999}><sphereGeometry args={[0.62, 48, 48]} /><meshStandardMaterial color="#f5f5f4" transparent opacity={0.14} roughness={0.25} metalness={0.0} depthTest={false} depthWrite={false} /></mesh>
        <mesh renderOrder={999}><sphereGeometry args={[0.625, 24, 24]} /><meshBasicMaterial color="#a8a29e" wireframe transparent opacity={0.7} depthTest={false} depthWrite={false} /></mesh>
        <mesh renderOrder={999}><sphereGeometry args={[0.07, 24, 24]} /><meshStandardMaterial color="#57534e" metalness={0.2} roughness={0.4} depthTest={false} depthWrite={false} /></mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.31, 0, 0]} renderOrder={999} onClick={(e) => { e.stopPropagation(); moveToAxis("x"); }}><cylinderGeometry args={[0.01, 0.01, 0.62, 16]} /><meshStandardMaterial color="#c2410c" emissive="#7c2d12" emissiveIntensity={0.18} depthTest={false} depthWrite={false} /></mesh>
        <mesh position={[0.66, 0, 0]} renderOrder={999} onClick={(e) => { e.stopPropagation(); moveToAxis("x"); }}><sphereGeometry args={[0.055, 20, 20]} /><meshStandardMaterial color="#c2410c" depthTest={false} depthWrite={false} /></mesh>
        <AxisLabel text="X" position={[0.9, 0, 0]} color="#ffffff" onClick={(e) => { e.stopPropagation(); moveToAxis("x"); }} />
        <mesh position={[0, 0.31, 0]} renderOrder={999} onClick={(e) => { e.stopPropagation(); moveToAxis("y"); }}><cylinderGeometry args={[0.01, 0.01, 0.62, 16]} /><meshStandardMaterial color="#15803d" emissive="#14532d" emissiveIntensity={0.18} depthTest={false} depthWrite={false} /></mesh>
        <mesh position={[0, 0.66, 0]} renderOrder={999} onClick={(e) => { e.stopPropagation(); moveToAxis("y"); }}><sphereGeometry args={[0.055, 20, 20]} /><meshStandardMaterial color="#15803d" depthTest={false} depthWrite={false} /></mesh>
        <AxisLabel text="Y" position={[0, 0.9, 0]} color="#ffffff" onClick={(e) => { e.stopPropagation(); moveToAxis("y"); }} />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.31]} renderOrder={999} onClick={(e) => { e.stopPropagation(); moveToAxis("z"); }}><cylinderGeometry args={[0.01, 0.01, 0.62, 16]} /><meshStandardMaterial color="#1d4ed8" emissive="#1e3a8a" emissiveIntensity={0.18} depthTest={false} depthWrite={false} /></mesh>
        <mesh position={[0, 0, 0.66]} renderOrder={999} onClick={(e) => { e.stopPropagation(); moveToAxis("z"); }}><sphereGeometry args={[0.055, 20, 20]} /><meshStandardMaterial color="#1d4ed8" depthTest={false} depthWrite={false} /></mesh>
        <AxisLabel text="Z" position={[0, 0, 0.9]} color="#ffffff" onClick={(e) => { e.stopPropagation(); moveToAxis("z"); }} />
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
  const boundaryPoints = useDesignerStore((s) => s.boundaryPoints);
  const gates = useDesignerStore((s) => s.gates);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const posts = useMemo(() => fenceItems.filter(i => i.type === "post"), [fenceItems]);

  function getRow(rowIndex: number) {
    if (singleModel) return { heightCm: fenceHeightCm, panel: singlePanel };
    return rows[rowIndex] ?? rows[0];
  }

  return (
    <Canvas camera={{ position: [0, 15, 25], fov: 50 }} style={{ width: "100%", height: "100%" }} gl={{ localClippingEnabled: true }} shadows>
      <Environment preset="park" background={false} />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
      <directionalLight position={[15, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001}>
        <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40]} />
      </directionalLight>
      <directionalLight position={[-15, 10, -10]} intensity={0.5} />

      <CameraCollider posts={posts} />

      {gates.map((gate) => {
        const gx = gate.x / SCALE;
        const gz = gate.z / SCALE;
        const widthM = gate.widthPx / SCALE;
        const gy = getElevationAt(gx, gz, posts);

        return (
          <ProceduralGate
            key={gate.id}
            x={gx}
            y={gy}
            z={gz}
            width={widthM}
            height={fenceHeightCm / 100} // ПЕРЕДАЕМ ДИНАМИЧЕСКУЮ ВЫСОТУ!
            rotation={gate.rotation}
          />
        );
      })}

      {houses.map((house) => {
        const hx = house.x / SCALE;
        const hz = house.z / SCALE;
        const hw = house.widthPx / SCALE;
        const hd = house.depthPx / SCALE;

        let maxHy = 0;
        if (boundaryPoints.length > 1) {
          const checkPoints = [
            [hx, hz], 
            [hx - hw/2, hz - hd/2], [hx + hw/2, hz - hd/2],
            [hx - hw/2, hz + hd/2], [hx + hw/2, hz + hd/2],
            [hx, hz - hd/2], [hx, hz + hd/2],
            [hx - hw/2, hz], [hx + hw/2, hz]
          ];
          maxHy = Math.max(...checkPoints.map(([cx, cz]) => getElevationAt(cx, cz, posts)));
        }

        return (
          <group key={house.id} position={[0, maxHy, 0]}>
            <ProceduralHouse x={house.x} z={house.z} widthPx={house.widthPx} depthPx={house.depthPx} />
            {/* ИСПРАВЛЕННЫЙ ФУНДАМЕНТ: сдвигается на hx и hz вместе с домом */}
            <mesh position={[hx, -2.5, hz]}>
              <boxGeometry args={[hw, 5, hd]} />
              <meshStandardMaterial color="#b3b3b3" roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {fenceItems.map((item, idx) => {
        const x = item.x / SCALE, z = item.z / SCALE, rotY = -item.rotation;

        if (item.type === "post") {
          const pillarOffset = panelOrientation === "inward" ? -0.12 : 0;
          return (
            <Suspense fallback={null} key={`post-${idx}`}>
              <PillarModel
                modelPath={activePillar.modelPath}
                burialM={activePillar.burialCm / 100}
                fenceHeightM={fenceHeightCm / 100}
                position={[x + pillarOffset * Math.sin(rotY), item.y, z + pillarOffset * Math.cos(rotY)]}
                rotation={[0, rotY, 0]}
                panelOrientation={panelOrientation}
                extraBurial={item.extraBurial}
              />
            </Suspense>
          );
        }

        const row = getRow(item.rowIndex ?? 0);
        if (!row) return null;
        const panelOffset = row.panel.heightCm === 30 ? (panelOrientation === "inward" ? -0.06 : -0.06) : row.panel.side === "double" ? (panelOrientation === "inward" ? -0.1 : -0.02) : (panelOrientation === "inward" ? -0.12 : 0);

        return (
          <Suspense fallback={null} key={`panel-${idx}`}>
            <PanelModel modelPath={row.panel.modelPath} position={[x + panelOffset * Math.sin(rotY), item.y, z + panelOffset * Math.cos(rotY)]} rotation={[0, rotY, 0]} widthRatio={item.widthRatio ?? 1} />
          </Suspense>
        );
      })}

      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} screenSpacePanning={false} minDistance={4} maxDistance={120} minPolarAngle={0} maxPolarAngle={Math.PI / 2} rotateSpeed={0.6} zoomSpeed={0.5} panSpeed={0.6} />
      <CameraSphereGizmo controlsRef={controlsRef} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={80} blur={2} far={10} resolution={1024} color="#000000" />
      <Suspense fallback={null}><GroundPlane posts={posts} /></Suspense>
    </Canvas>
  );
}

function GroundPlane({ posts }: { posts: any[] }) {
  const groundType = useDesignerStore((s) => s.groundType);
  const boundaryPoints = useDesignerStore((s) => s.boundaryPoints);

  const { topGeo, blockGeo } = useMemo(() => {
    const top = new THREE.PlaneGeometry(200, 200, 100, 100);
    top.rotateX(-Math.PI / 2);

    const block = new THREE.BoxGeometry(200, 50, 200, 100, 1, 100);
    block.translate(0, -25, 0); 

    if (boundaryPoints.length > 1) {
      const pTop = top.attributes.position.array;
      for (let i = 0; i < pTop.length; i += 3) {
        pTop[i + 1] = getElevationAt(pTop[i], pTop[i + 2], posts);
      }
      top.computeVertexNormals();

      const pBlock = block.attributes.position.array;
      for (let i = 0; i < pBlock.length; i += 3) {
        if (pBlock[i + 1] > -5) { 
          pBlock[i + 1] = getElevationAt(pBlock[i], pBlock[i + 2], posts);
        }
      }
      block.computeVertexNormals();
    }
    return { topGeo: top, blockGeo: block };
  }, [boundaryPoints, posts]);

  if (groundType === "grid") {
    return (
      <>
        <mesh position={[0, -0.02, 0]} receiveShadow geometry={blockGeo}>
          <meshStandardMaterial color="#e8e8e8" side={THREE.DoubleSide} />
        </mesh>
        <BendingGridLines geometry={topGeo} />
      </>
    );
  }

  return <TexturedGround groundType={groundType} geometry={blockGeo} />;
}

function TexturedGround({ groundType, geometry }: { groundType: "grass" | "calcada" | "ground", geometry: THREE.BufferGeometry }) {
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
    <mesh position={[0, -0.02, 0]} receiveShadow geometry={geometry}>
      <meshStandardMaterial map={texture} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function BendingGridLines({ geometry }: { geometry: THREE.BufferGeometry }) {
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#888888";
      ctx.lineWidth = 2; 
      for (let i = 0; i <= 512; i += 51.2) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      }
    }
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 40);
    return t;
  }, []);

  return (
    <mesh position={[0, -0.015, 0]} receiveShadow={false} geometry={geometry}>
      <meshBasicMaterial map={tex} transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}