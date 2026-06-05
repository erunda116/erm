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
  panelOrientation?: 'outward' | 'inward';
};

export default function PillarModel({
  modelPath,
  burialM,
  fenceHeightM,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  panelOrientation = 'outward',
}: Props) {
  const model = useGLTF(modelPath);
  const concreteColor = useDesignerStore((s) => s.concreteColor); // ← ДОБАВИТЬ

  const clippingPlanes = useMemo(() => [
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), fenceHeightM),
  ], [fenceHeightM]);

  const clonedScene = useMemo(() => {
    const clone = model.scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.clippingPlanes = clippingPlanes;
        mat.clipShadows = true;

        // ← ДОБАВИТЬ: та же логика покраски
        if (concreteColor !== 'grey') {
          if (concreteColor === 'white') {
    mat.color = new THREE.Color('#ffffff');
    mat.emissive = new THREE.Color('#888888');
    mat.emissiveIntensity = 0.9; // ← то же значение что у панелей
  } else {
    const c = new THREE.Color(concreteColor);
    mat.color = c;
    mat.emissive = c.clone().multiplyScalar(0.3);
    mat.emissiveIntensity = 0.4;
  }
        }

        mesh.material = mat;
      }
    });
    return clone;
  }, [model, clippingPlanes, concreteColor]); // ← добавить concreteColor в deps

  const scaleZ = panelOrientation === 'inward' ? -1 : 1;
  return (
    <group
      position={[position[0], position[1] - burialM, position[2]]}
      rotation={rotation}
    >
      <primitive object={clonedScene} scale={[1, 1, scaleZ]} /> 
    </group>
  );
}