import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { useDesignerStore } from "../../store/useDesignerStore";

type Props = {
  modelPath: string;
  burialM: number;
  fenceHeightM: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  panelOrientation?: "outward" | "inward";

  ralControls?: {
    hue?: number;
    saturation?: number;
    lightness?: number;
    opacity?: number;
    emissiveIntensity?: number;
    emissiveBoost?: number;
    metalness?: number;
    roughness?: number;
  };
};

export default function PillarModel({
  modelPath,
  burialM,
  fenceHeightM,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  panelOrientation = "outward",
  ralControls = {},
}: Props) {
  const model = useGLTF(modelPath);

  const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
  const selectedRal = useDesignerStore((s) => s.selectedRal);
  const concreteColor = selectedRal ?? baseConcreteColor;

  const {
    hue = 1,
    saturation = 0.8,
    lightness = 1,
    opacity = 1,
    emissiveIntensity = 1,
    emissiveBoost = 0.2,
    metalness = 0.05,
    roughness = 0.9,
  } = ralControls;

  const clippingPlanes = useMemo(
    () => [
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), fenceHeightM),
    ],
    [fenceHeightM]
  );

  const clonedScene = useMemo(() => {
    const clone = model.scene.clone(true);

    clone.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;

      const mesh = obj as THREE.Mesh;
      const sourceMaterial = mesh.material as THREE.MeshStandardMaterial;
      const mat = sourceMaterial.clone();

      mat.clippingPlanes = clippingPlanes;
      mat.clipShadows = true;

      if (concreteColor === "white") {
        mat.color = new THREE.Color("#ffffff");
        mat.emissive = new THREE.Color("#888888");
        mat.emissiveIntensity = 0.9;
        mat.transparent = false;
        mat.opacity = 1;
      } else if (concreteColor !== "grey") {
        const base = new THREE.Color(concreteColor);
        const hsl = { h: 0, s: 0, l: 0 };

        base.getHSL(hsl);

        const nextH = (hsl.h + hue) % 1;
        const nextS = THREE.MathUtils.clamp(hsl.s * saturation, 0, 1);
        const nextL = THREE.MathUtils.clamp(hsl.l * lightness, 0, 1);

        const finalColor = new THREE.Color().setHSL(
          nextH < 0 ? nextH + 1 : nextH,
          nextS,
          nextL
        );

        mat.color = finalColor;
        mat.emissive = finalColor.clone().multiplyScalar(emissiveBoost);
        mat.emissiveIntensity = emissiveIntensity;

        mat.transparent = opacity < 1;
        mat.opacity = THREE.MathUtils.clamp(opacity, 0, 1);

        mat.metalness = metalness;
        mat.roughness = roughness;
      }

      mat.needsUpdate = true;
      mesh.material = mat;
    });

    return clone;
  }, [
    model,
    clippingPlanes,
    concreteColor,
    hue,
    saturation,
    lightness,
    opacity,
    emissiveIntensity,
    emissiveBoost,
    metalness,
    roughness,
  ]);

  const scaleZ = panelOrientation === "inward" ? -1 : 1;

  return (
    <group
      position={[position[0], position[1] - burialM, position[2]]}
      rotation={rotation}
    >
      <primitive object={clonedScene} scale={[1, 1, scaleZ]} />
    </group>
  );
}