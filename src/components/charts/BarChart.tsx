import { useState } from "react";

export interface BarPoint {
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

export default function BarChart({
  data,
  color = "#008000",
  formatValue,
  emptyText = "Nothing billed in this range",
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

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

        <div className="relative flex h-full items-end gap-2">
          {data.map((point, index) => {
            const heightPercent = max ? (point.value / max) * 100 : 0;
            const isHovered = hovered === index;

            return (
              <div
                key={point.label}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
              >
                {(isHovered || index === peakIndex) && point.value > 0 && (
                  <span
                    className="absolute inset-x-0 -top-1 text-center text-[11px] font-medium tabular-nums text-slate-600"
                    style={{
                      bottom: `calc(${heightPercent}% + 6px)`,
                      top: "auto",
                    }}
                  >
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

      <div className="mt-2 flex gap-2">
        {data.map((point, index) => (
          <div
            key={point.label}
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
            <tr key={point.label}>
              <th scope="row">{point.caption}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
