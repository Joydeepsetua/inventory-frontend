import type { ComponentType, SVGProps } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "primary" | "amber" | "blue" | "slate";
  loading?: boolean;
}

const TONES = {
  primary: "bg-primary-tint text-primary",
  amber: "bg-amber-100 text-amber-600",
  blue: "bg-blue-100 text-blue-600",
  slate: "bg-slate-100 text-slate-500",
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  loading = false,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
          )}
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
