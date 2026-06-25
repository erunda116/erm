import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useDesignerStore } from "../../store/useDesignerStore";

type Props = {
  modelPath: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  widthRatio?: number;
  side?: 'one' | 'double';
};

export default function PanelModel({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  widthRatio = 1,
  side = 'one',
}: Props) {
  const model = useGLTF(modelPath);
  const panelOrientation = useDesignerStore((s) => s.panelOrientation);
 const baseConcreteColor = useDesignerStore((s) => s.baseConcreteColor);
const selectedRal = useDesignerStore((s) => s.selectedRal);
const concreteColor = selectedRal ?? baseConcreteColor;
  const groupRef = useRef<THREE.Group>(null);

  const scaleZ = side === 'double' ? 1 : (panelOrientation === 'inward' ? -1 : 1);
  const needsClip = widthRatio < 0.999;

  // GLB панель от X=-1 до X=+1 (2м, центр 0)
  // Правый край обрезки: -1 + widthRatio*2
  const localPlane = useMemo(() => {
    if (!needsClip) return null;
    const rightEdge = -1.0 + widthRatio * 2.0;
    return new THREE.Plane(new THREE.Vector3(-1, 0, 0), rightEdge);
  }, [widthRatio, needsClip]);

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
            mat.emissiveIntensity = 0.8;
          } else {
            const c = new THREE.Color(concreteColor);
            mat.color = c;
            mat.emissive = c.clone().multiplyScalar(0.3);
            mat.emissiveIntensity = 0.4;
          }
        }

        if (localPlane) {
          const worldPlane = localPlane.clone();
          mat.clippingPlanes = [worldPlane];
          mat.clipShadows = true;
          mesh.onBeforeRender = () => {
            if (groupRef.current) {
              worldPlane.copy(localPlane).applyMatrix4(groupRef.current.matrixWorld);
            }
          };
        }

        mat.needsUpdate = true;
        mesh.material = mat;
      }
    });

    return clone;
  }, [model, concreteColor, localPlane]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive object={clonedScene} scale={[1, 1, scaleZ]} />
    </group>
  );
}