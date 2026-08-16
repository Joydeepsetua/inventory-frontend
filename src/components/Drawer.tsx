import { useEffect } from "react";
import type { ReactNode } from "react";

import { CloseIcon } from "../icons";

interface DrawerProps {
  open: boolean;
  title: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Drawer({
  open,
  title,
  busy = false,
  onClose,
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-lg lg:w-1/2 lg:max-w-2xl"
      >
        <div className="flex shrink-0 items-center justify-between bg-primary px-5 py-3 text-white">
          <h2 id="drawer-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded p-1 text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-200 px-5 py-3">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
