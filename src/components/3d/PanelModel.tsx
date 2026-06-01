import { useGLTF } from "@react-three/drei";

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

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model.scene.clone()} scale={[widthRatio, 1, 1]} />
    </group>
  );
}