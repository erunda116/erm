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
  const fs    = 11 / scale;

  // Адаптивный интервал подписей в зависимости от масштаба
  // При scale=1 подписи каждые 5м, при отдалении реже
  const labelIntervalMeters =
    scale > 0.8  ? 5  :
    scale > 0.4  ? 10 :
    scale > 0.2  ? 20 :
    scale > 0.1  ? 50 : 100;

  const labelIntervalPx = labelIntervalMeters * step; // метры → пиксели

  // Вертикальные линии
  for (let x = start; x <= end; x += step) {
    const cellIndex = Math.round(x / step);
    const isLabel = x % labelIntervalPx === 0;  // ← линия с подписью
const isMajor = Math.round(x / step) % 5 === 0;

lines.push(
  <Line
    key={key++}
    points={[x, start, x, end]}
    stroke={isLabel ? "#b0b0b0" : isMajor ? "#cccccc" : "#e5e5e5"}  // ← isLabel жирнее
    strokeWidth={(isLabel ? 1.5 : isMajor ? 1 : 0.5) / scale}       // ← isLabel толще
    listening={false}
  />
);

    // Метка — только по адаптивному интервалу, только ≥ 0
    if (x % labelIntervalPx === 0) {  // ← убрали x >= 0
  const meters = Math.abs(Math.round(x / step) * metersPerCell);  // ← Math.abs
  lines.push(
    <Text
      key={key++}
      x={x + 3 / scale}
      y={4 / scale}
      text={`${meters}м`}
      fontSize={fs}
      fontStyle="bold"
      fill="#aaa"  // ← чуть темнее для читаемости
      listening={false}
    />
  );
}
  }

  // Горизонтальные линии
  for (let y = start; y <= end; y += step) {
    const cellIndex = Math.round(y / step);
    const isLabel = y % labelIntervalPx === 0;
const isMajor = Math.round(y / step) % 5 === 0;

lines.push(
  <Line
    key={key++}
    points={[start, y, end, y]}
    stroke={isLabel ? "#b0b0b0" : isMajor ? "#cccccc" : "#e5e5e5"}
    strokeWidth={(isLabel ? 1.5 : isMajor ? 1 : 0.5) / scale}
    listening={false}
  />
);

    // Метка — только по адаптивному интервалу, только ≥ 0, пропускаем y=0 (уже есть на X)
    if (y !== 0 && y % labelIntervalPx === 0) {  // ← убрали y > 0, добавили y !== 0
  const meters = Math.abs(Math.round(y / step) * metersPerCell);  // ← Math.abs
  lines.push(
    <Text
      key={key++}
      x={4 / scale}
      y={y + 3 / scale}
      text={`${meters}м`}
      fontSize={fs}
      fontStyle="bold"
      fill="#aaa"
      listening={false}
    />
  );
}
  }

  return <>{lines}</>;
}