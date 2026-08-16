import { useEffect, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon, SearchIcon } from "../icons";
import type { SelectOption } from "./Select";

interface AsyncSelectProps {
  value: string;
  selectedLabel?: string | null;
  onChange: (value: string, option: SelectOption<string> | null) => void;
  fetchOptions: (search: string) => Promise<SelectOption<string>[]>;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  invalid?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
}

export default function AsyncSelect({
  value,
  selectedLabel,
  onChange,
  fetchOptions,
  label,
  placeholder = "Select",
  searchPlaceholder = "Type to search",
  emptyText = "No results",
  className = "",
  invalid = false,
  disabled = false,
  allowClear = false,
  clearLabel = "All",
}: AsyncSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<SelectOption<string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<SelectOption<string> | null>(null);
  const [dropUp, setDropUp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const pickedLabel =
    picked && picked.value === value ? picked.label : (selectedLabel ?? null);

  useEffect(() => {
    if (!open) return;

    const rect = containerRef.current?.getBoundingClientRect();

    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < 330 && rect.top > below);
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    searchRef.current?.focus();

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const result = await fetchOptions(search.trim());
        if (!ignore) setOptions(result);
      } catch {
        if (!ignore) setOptions([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [open, search, fetchOptions]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  const pick = (option: SelectOption<string> | null) => {
    setPicked(option);
    onChange(option?.value ?? "", option);
    close();
  };

  const triggerText = value
    ? (pickedLabel ?? placeholder)
    : allowClear
      ? clearLabel
      : placeholder;
  const isPlaceholder = !value && !allowClear;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition disabled:bg-slate-50 disabled:text-slate-400 ${
          invalid
            ? "border-red-400"
            : open
              ? "border-primary"
              : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <span className={`truncate ${isPlaceholder ? "text-slate-400" : ""}`}>
          {triggerText}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-30 w-full min-w-56 rounded-lg border border-slate-200 bg-white shadow-lg ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className="relative border-b border-slate-100 p-2">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {allowClear && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() => pick(null)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                    !value
                      ? "bg-primary-tint font-medium text-primary-dark"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{clearLabel}</span>
                  {!value && <CheckIcon className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            )}

            {loading && (
              <li className="px-3 py-3 text-sm text-slate-400">Searching…</li>
            )}

            {!loading && !options.length && (
              <li className="px-3 py-3 text-sm text-slate-400">{emptyText}</li>
            )}

            {!loading &&
              options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => pick(option)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-primary-tint font-medium text-primary-dark"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
