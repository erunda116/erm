import { Line } from "react-konva";

type Props = {
  width: number;
  height: number;
  step?: number;
};

export default function Grid({ width, height, step = 50 }: Props) {
  const verticalLines = [];
  const horizontalLines = [];

  // вертикальные линии
  for (let i = 0; i < width / step; i++) {
    const x = i * step;

    verticalLines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, height]}
        stroke="#e6e6e6"
        strokeWidth={1}
      />
    );
  }

  // горизонтальные линии
  for (let i = 0; i < height / step; i++) {
    const y = i * step;

    horizontalLines.push(
      <Line
        key={`h-${i}`}
        points={[0, y, width, y]}
        stroke="#e6e6e6"
        strokeWidth={1}
      />
    );
  }

  return (
    <>
      {verticalLines}
      {horizontalLines}
    </>
  );
}