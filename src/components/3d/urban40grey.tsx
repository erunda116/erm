import { useGLTF } from "@react-three/drei";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  widthRatio?: number;
};

export default function Urban40Grey({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  widthRatio = 1,
}: Props) {
  const model = useGLTF("/models/panels/urban40grey.glb");

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model.scene.clone()} scale={[widthRatio, 1, 1]} />
    </group>
  );
}