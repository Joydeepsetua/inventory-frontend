import { useState } from "react";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerLabel: string;
  emptyText?: string;
}

const SIZE = 168;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2;

export default function DonutChart({
  data,
  centerLabel,
  emptyText = "No data yet",
}: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (!total) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div
          className="rounded-full border-slate-100"
          style={{
            width: SIZE * 0.7,
            height: SIZE * 0.7,
            borderWidth: STROKE * 0.7,
          }}
        />
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  const visible = data.filter((slice) => slice.value > 0);

  const segments = visible.map((slice, index) => {
    const before = visible
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.value, 0);

    return {
      ...slice,
      length: (slice.value / total) * CIRCUMFERENCE,
      offset: (before / total) * CIRCUMFERENCE,
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${centerLabel}: ${total} total`}
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {segments.map((segment, index) => (
              <circle
                key={segment.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={hovered === index ? STROKE + 5 : STROKE}
                strokeDasharray={`${Math.max(segment.length - GAP, 0.5)} ${
                  CIRCUMFERENCE
                }`}
                strokeDashoffset={-segment.offset}
                className="transition-[stroke-width] duration-150"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hovered !== null && segments[hovered] ? (
            <>
              <span className="text-2xl font-semibold tabular-nums">
                {segments[hovered].value}
              </span>
              <span className="text-xs text-slate-500">
                {Math.round((segments[hovered].value / total) * 100)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold tabular-nums">
                {total}
              </span>
              <span className="text-xs text-slate-500">{centerLabel}</span>
            </>
          )}
        </div>
      </div>

      <ul className="w-full space-y-1.5 sm:w-auto sm:min-w-40">
        {data.map((slice) => (
          <li
            key={slice.label}
            onMouseEnter={() =>
              setHovered(segments.findIndex((s) => s.label === slice.label))
            }
            onMouseLeave={() => setHovered(null)}
            className="flex items-center justify-between gap-3 rounded px-1.5 py-0.5 text-sm transition hover:bg-slate-50"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-slate-600">{slice.label}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {slice.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
