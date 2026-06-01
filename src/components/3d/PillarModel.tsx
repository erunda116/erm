import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  modelPath: string;
  burialM: number;
  fenceHeightM: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export default function PillarModel({
  modelPath,
  burialM,
  fenceHeightM,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: Props) {
  const model = useGLTF(modelPath);

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
        mesh.material = mat;
      }
    });
    return clone;
  }, [model, clippingPlanes]);

  return (
    <group
      position={[position[0], position[1] - burialM, position[2]]}
      rotation={rotation}
    >
      <primitive object={clonedScene} />
    </group>
  );
}