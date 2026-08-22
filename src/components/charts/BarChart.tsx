import { useState } from "react";

export interface BarPoint {
  id: string;
  label: string;
  caption: string;
  value: number;
}

interface BarChartProps {
  data: BarPoint[];
  color?: string;
  formatValue: (value: number) => string;
  emptyText?: string;
}

const HEIGHT = 180;
const BAR_WIDTH = 34;
const BAR_SCALE = 0.78;

const gapFor = (count: number) => (count > 15 ? 2 : count > 7 ? 4 : 8);

const alignFor = (index: number, count: number) => {
  if (index === 0) return "left-0";
  if (index === count - 1) return "right-0";
  return "left-1/2 -translate-x-1/2";
};

export default function BarChart({
  data,
  color = "#008000",
  formatValue,
  emptyText = "Nothing billed in this range",
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const gap = gapFor(data.length);
  const max = Math.max(...data.map((point) => point.value), 0);
  const peakIndex = data.findIndex((point) => point.value === max && max > 0);

  if (!max) {
    return (
      <p className="px-4 py-14 text-center text-sm text-slate-500">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="relative" style={{ height: HEIGHT }}>
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-slate-100" />
          ))}
        </div>

        <div className="relative flex h-full items-end" style={{ gap }}>
          {data.map((point, index) => {
            const heightPercent = max
              ? (point.value / max) * 100 * BAR_SCALE
              : 0;
            const isHovered = hovered === index;

            return (
              <div
                key={point.id}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
              >
                {(isHovered || index === peakIndex) && point.value > 0 && (
                  <span
                    className={`pointer-events-none absolute z-10 whitespace-nowrap text-center text-[11px] font-medium tabular-nums text-slate-600 ${alignFor(
                      index,
                      data.length,
                    )}`}
                    style={{ bottom: `calc(${heightPercent}% + 6px)` }}
                  >
                    {isHovered && (
                      <span className="block font-normal text-slate-400">
                        {point.caption}
                      </span>
                    )}
                    {formatValue(point.value)}
                  </span>
                )}

                <div
                  className="mx-auto w-full rounded-t transition-opacity"
                  style={{
                    maxWidth: BAR_WIDTH,
                    height: `${Math.max(heightPercent, point.value > 0 ? 2 : 0)}%`,
                    backgroundColor: color,
                    opacity: hovered === null || isHovered ? 1 : 0.45,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex" style={{ gap }}>
        {data.map((point, index) => (
          <div
            key={point.id}
            className={`flex-1 text-center text-[11px] transition ${
              hovered === index
                ? "font-medium text-slate-700"
                : "text-slate-400"
            }`}
          >
            {point.label}
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>Sales by day</caption>
        <tbody>
          {data.map((point) => (
            <tr key={point.id}>
              <th scope="row">{point.caption}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
