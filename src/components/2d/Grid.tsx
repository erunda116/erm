import { Line, Text } from "react-konva";

type Props = {
  width: number;
  height: number;
  step: number;
  metersPerCell?: number;
  scale?: number;
};

export default function Grid({ step, metersPerCell = 1, scale = 1 }: Props) {
  const lines: React.ReactNode[] = [];
  let key = 0;

  const start = -5000;
  const end   =  5000;
  const fs    = 12 / scale;   // размер шрифта всегда одинаков на экране

  // Вертикальные линии
  for (let x = start; x <= end; x += step) {
    const isMajor = Math.round(x / step) % 5 === 0;
    lines.push(
      <Line
        key={key++}
        points={[x, start, x, end]}
        stroke={isMajor ? "#cccccc" : "#e5e5e5"}
        strokeWidth={(isMajor ? 1 : 0.5) / scale}
        listening={false}
      />
    );
    if (isMajor) {
      const meters = Math.round(x / step) * metersPerCell;
      lines.push(
        <Text
          key={key++}
          x={x + 3 / scale}
          y={4 / scale}
          text={`${meters}м`}
          fontSize={fs}
          fontStyle="bold"
          fill="#bbb"
          listening={false}
        />
      );
    }
  }

  // Горизонтальные линии
  for (let y = start; y <= end; y += step) {
    const isMajor = Math.round(y / step) % 5 === 0;
    lines.push(
      <Line
        key={key++}
        points={[start, y, end, y]}
        stroke={isMajor ? "#cccccc" : "#e5e5e5"}
        strokeWidth={(isMajor ? 1 : 0.5) / scale}
        listening={false}
      />
    );
    if (isMajor) {
      const meters = Math.round(y / step) * metersPerCell;
      lines.push(
        <Text
          key={key++}
          x={4 / scale}
          y={y + 3 / scale}
          text={`${meters}м`}
          fontSize={fs}
          fontStyle="bold"
          fill="#bbb"
          listening={false}
        />
      );
    }
  }

  return <>{lines}</>;
}