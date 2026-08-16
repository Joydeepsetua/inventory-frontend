import { useEffect, useRef } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { AlertIcon, QuestionIcon } from "../icons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  icon,
  loading = false,
  loadingLabel = "Working…",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    confirmRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const isDanger = tone === "danger";

  const confirmClass = isDanger
    ? "bg-red-600 hover:bg-red-700"
    : "bg-primary hover:bg-primary-dark";

  const badgeClass = isDanger
    ? "bg-red-100 text-red-600"
    : "bg-primary-tint text-primary";

  const Icon = icon ?? (isDanger ? AlertIcon : QuestionIcon);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg"
      >
        <div className="flex gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${badgeClass}`}
          >
            <Icon />
          </span>

          <div className="min-w-0">
            <h2 id="confirm-title" className="text-base font-semibold">
              {title}
            </h2>
            <p id="confirm-message" className="mt-1 text-sm text-slate-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-3 py-1.5 text-sm text-white transition disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
