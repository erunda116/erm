import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { useDesignerStore } from "../../store/useDesignerStore";

type Props = {
  modelPath: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  widthRatio?: number;
};

export default function PanelModel({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  widthRatio = 1,
}: Props) {
  const model = useGLTF(modelPath);
  const panelOrientation = useDesignerStore((s) => s.panelOrientation);
  const concreteColor = useDesignerStore((s) => s.concreteColor);

  const clonedScene = useMemo(() => {
    const clone = model.scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();

        if (concreteColor !== 'grey') {
          if (concreteColor === 'white') {
            mat.color = new THREE.Color('#ffffff');
            mat.emissive = new THREE.Color('#888888');
            mat.emissiveIntensity = 0.9; // подбери 0.4–0.8
          } else {
            const c = new THREE.Color(concreteColor);
            mat.color = c;
            mat.emissive = c.clone().multiplyScalar(0.3);
            mat.emissiveIntensity = 0.4;
          }
          mat.needsUpdate = true;
        }

        mesh.material = mat;
      }
    });
    return clone;
  }, [model, concreteColor]);

  const scaleZ = panelOrientation === 'inward' ? -1 : 1;

  return (
    <group position={position} rotation={rotation}>
      <primitive object={clonedScene} scale={[widthRatio, 1, scaleZ]} />
    </group>
  );
}