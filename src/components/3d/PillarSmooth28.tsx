import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

// Столб закапывается на 0.8м — эта часть уходит под землю
const BURIAL_DEPTH = 0.8;

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  fenceHeightM?: number;
};

export default function PillarSmooth28({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  fenceHeightM = 2.0,
}: Props) {
  const model = useGLTF("/models/posts/PillarSmooth28.glb");

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
      position={[position[0], position[1] - BURIAL_DEPTH, position[2]]}
      rotation={rotation}
    >
      <primitive object={clonedScene} />
    </group>
  );
}