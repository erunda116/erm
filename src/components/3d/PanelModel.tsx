import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useDesignerStore } from "../../store/useDesignerStore";

type Props = {
  modelPath: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  widthRatio?: number;
  side?: "one" | "double";

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

export default function PanelModel({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  widthRatio = 1,
  side = "one",
  ralControls = {},
}: Props) {
  const model = useGLTF(modelPath);

  const panelOrientation = useDesignerStore((s) => s.panelOrientation);
  const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
  const selectedRal = useDesignerStore((s) => s.selectedRal);
  const concreteColor = selectedRal ?? baseConcreteColor;

  const groupRef = useRef<THREE.Group>(null);

  const needsClip = widthRatio < 0.999;

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

  const localPlane = useMemo(() => {
    if (!needsClip) return null;

    const rightEdge = -1.0 + widthRatio * 2.0;

    return new THREE.Plane(
      new THREE.Vector3(-1, 0, 0),
      rightEdge
    );
  }, [widthRatio, needsClip]);

  const clonedScene = useMemo(() => {
    const clone = model.scene.clone(true);

    clone.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;

      const mesh = obj as THREE.Mesh;
      const sourceMaterial = mesh.material as THREE.MeshStandardMaterial;
      const mat = sourceMaterial.clone();

      if (concreteColor === "white") {
        mat.color = new THREE.Color("#ffffff");
        mat.emissive = new THREE.Color("#888888");
        mat.emissiveIntensity = 0.8;
        mat.transparent = false;
        mat.opacity = 1;
      } else if (concreteColor === "grey") {
        // --- ДЕЛАЕМ СЕРЫЙ ТЕМНЕЕ ---
        // Если #a3a3a3 будет слишком светлым, попробуйте #8a8a8a или #7a7a7a
        mat.color = new THREE.Color("#c0c0c0"); 
      } else {
        // Выполняется, если выбран RAL
        const base = new THREE.Color(concreteColor);
        const hsl = { h: 0, s: 0, l: 0 };

        base.getHSL(hsl);

        const nextH = (hsl.h + hue) % 1;
        const nextS = THREE.MathUtils.clamp(
          hsl.s * saturation,
          0,
          1
        );
        const nextL = THREE.MathUtils.clamp(
          hsl.l * lightness,
          0,
          1
        );

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

      if (localPlane) {
        const worldPlane = localPlane.clone();

        mat.clippingPlanes = [worldPlane];
        mat.clipShadows = true;

        mesh.onBeforeRender = () => {
          if (groupRef.current) {
            worldPlane
              .copy(localPlane)
              .applyMatrix4(groupRef.current.matrixWorld);
          }
        };
      }

      mat.needsUpdate = true;
      mesh.material = mat;
    });

    return clone;
  }, [
    model,
    concreteColor,
    localPlane,
    hue,
    saturation,
    lightness,
    opacity,
    emissiveIntensity,
    emissiveBoost,
    metalness,
    roughness,
  ]);

  const panelRotationY =
  side === "double" || panelOrientation === "outward"
    ? 0
    : Math.PI;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive
        object={clonedScene}
        rotation={[0, panelRotationY, 0]}
      />
    </group>
  );
}