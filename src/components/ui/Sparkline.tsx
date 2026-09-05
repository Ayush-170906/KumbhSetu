export function Sparkline({
  values,
  width = 120,
  height = 32,
  stroke = "var(--color-primary)",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MiniBarChart({
  data,
  width = 260,
  height = 90,
  color = "var(--color-primary)",
}: {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = width / data.length - 8;

  return (
    <svg width={width} height={height + 16} viewBox={`0 0 ${width} ${height + 16}`}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * height;
        const x = i * (width / data.length) + 4;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={height - barHeight}
              width={Math.max(barWidth, 4)}
              height={barHeight}
              fill={color}
              rx={1.5}
              opacity={0.85}
            />
            <text x={x + barWidth / 2} y={height + 12} fontSize={9} textAnchor="middle" fill="var(--color-ink-soft)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
