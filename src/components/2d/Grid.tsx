import { Line, Text } from "react-konva";

type Props = {
  width: number;
  height: number;
  step: number; // пикселей на клетку
  metersPerCell: number; // сколько метров = 1 клетка
};

export default function Grid({ width, height, step, metersPerCell }: Props) {
  const lines = [];
  const labels = [];

  // Вертикальные линии
  for (let x = 0; x <= width; x += step) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={x % (step * 5) === 0 ? "#cccccc" : "#e8e8e8"}
        strokeWidth={x % (step * 5) === 0 ? 1 : 0.5}
      />
    );
    // Подпись каждые 5 клеток
    if (x % (step * 5) === 0 && x > 0) {
      labels.push(
        <Text
          key={`vl-${x}`}
          x={x + 3}
          y={4}
          text={`${(x / step) * metersPerCell}м`}
          fontSize={10}
          fill="#999"
        />
      );
    }
  }

  // Горизонтальные линии
  for (let y = 0; y <= height; y += step) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={y % (step * 5) === 0 ? "#cccccc" : "#e8e8e8"}
        strokeWidth={y % (step * 5) === 0 ? 1 : 0.5}
      />
    );
    if (y % (step * 5) === 0 && y > 0) {
      labels.push(
        <Text
          key={`hl-${y}`}
          x={4}
          y={y + 3}
          text={`${(y / step) * metersPerCell}м`}
          fontSize={10}
          fill="#999"
        />
      );
    }
  }

  return <>{[...lines, ...labels]}</>;
}