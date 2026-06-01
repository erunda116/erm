import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useDesignerStore } from "../../store/useDesignerStore";
import PillarSmooth28 from "./PillarSmooth28";
import Urban40Grey from "./urban40grey";

const SCALE = 50;

export default function Scene() {
  const fenceItems = useDesignerStore((s) => s.fenceItems);
  const fenceHeightM = useDesignerStore((s) => s.fenceHeightM); // ← берём высоту

  return (
    <Canvas
      camera={{ position: [0, 15, 25], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ localClippingEnabled: true }} // ← без этого clipping не работает
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 10]} intensity={2} />

      {fenceItems.map((item, idx) => {
        const x = item.x / SCALE;
        const z = item.z / SCALE;
        const y = item.y;
        const rotY = -item.rotation;

        if (item.type === "post") {
          return (
            <PillarSmooth28
              key={`post-${idx}`}
              position={[x, y, z]}
              rotation={[0, rotY, 0]}
              fenceHeightM={fenceHeightM} // ← передаём высоту
            />
          );
        }

        return (
          <Urban40Grey
            key={`panel-${idx}`}
            position={[x, y, z]}
            rotation={[0, rotY, 0]}
            widthRatio={item.widthRatio ?? 1}
          />
        );
      })}

      <OrbitControls makeDefault />
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
    </Canvas>
  );
}