import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getDashboardSummary } from "../api/dashboard";
import { listInvoices } from "../api/invoices";
import { listVariants } from "../api/variants";
import BarChart from "../components/charts/BarChart";
import type { BarPoint } from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import type { DonutSlice } from "../components/charts/DonutChart";
import Select from "../components/Select";
import StatCard from "../components/StatCard";
import {
  CHART_PRIMARY,
  DEFAULT_TREND_RANGE,
  PAYMENT_STATUS_CHART_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  TREND_RANGE_OPTIONS,
} from "../constants/options";
import type { TrendRange } from "../constants/options";
import {
  AlertIcon,
  CartIcon,
  ChevronRightIcon,
  InvoiceIcon,
  UsersIcon,
} from "../icons";
import { useAppSelector } from "../store/hooks";
import type { DashboardSummary, Invoice, Variant } from "../types/api";
import { errorMessage } from "../utils/error";
import { formatDate, formatMoney } from "../utils/format";

export default function Dashboard() {
  const user = useAppSelector((state) => state.auth.user);

  const [range, setRange] = useState<TrendRange>(DEFAULT_TREND_RANGE);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [recent, setRecent] = useState<Invoice[]>([]);
  const [lowStock, setLowStock] = useState<Variant[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [listsLoading, setListsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setSummaryLoading(true);

      try {
        const result = await getDashboardSummary({ days: Number(range) });

        if (ignore) return;

        setSummary(result.data);
      } catch (caught) {
        if (ignore) return;
        setError(errorMessage(caught, "Unable to load dashboard"));
      } finally {
        if (!ignore) setSummaryLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [range]);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setListsLoading(true);

      try {
        const [low, recentInv] = await Promise.all([
          listVariants({ low_stock: true, status: "active", limit: 5 }),
          listInvoices({ limit: 5 }),
        ]);

        if (ignore) return;

        setLowStock(low.data);
        setLowStockCount(low.pagination?.total ?? 0);
        setRecent(recentInv.data);
      } catch (caught) {
        if (ignore) return;
        setError(errorMessage(caught, "Unable to load dashboard"));
      } finally {
        if (!ignore) setListsLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = summary?.stats;

  const statusSlices = useMemo<DonutSlice[]>(
    () =>
      (summary?.payment_status ?? []).map((entry) => ({
        label: PAYMENT_STATUS_LABELS[entry.status],
        value: entry.count,
        color: PAYMENT_STATUS_CHART_COLORS[entry.status],
      })),
    [summary],
  );

  const trend = useMemo<BarPoint[]>(() => {
    const points = summary?.sales_trend ?? [];

    const labelEvery = Math.ceil(points.length / 7);

    return points.map((point, index) => {
      const date = new Date(`${point.date}T00:00:00`);

      const caption = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      const labelled = (points.length - 1 - index) % labelEvery === 0;

      return {
        id: point.date,
        label: labelled
          ? points.length > 7
            ? caption
            : date.toLocaleDateString("en-IN", { weekday: "short" })
          : "",
        caption,
        value: Number(point.total),
      };
    });
  }, [summary]);

  const cardLink = (to: string, label: string) => (
    <Link
      to={to}
      className="flex items-center gap-1 text-xs font-medium text-primary-dark transition hover:underline"
    >
      {label}
      <ChevronRightIcon className="h-3.5 w-3.5" />
    </Link>
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">
          Hello, {user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-slate-500">
          Here is how the shop is doing today
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's sales"
          value={formatMoney(stats?.today_sales ?? 0)}
          hint="Cancelled bills excluded"
          icon={CartIcon}
          tone="primary"
          loading={summaryLoading && !summary}
        />
        <StatCard
          label="Bills today"
          value={String(stats?.today_count ?? 0)}
          icon={InvoiceIcon}
          tone="blue"
          loading={summaryLoading && !summary}
        />
        <StatCard
          label="Payment pending"
          value={String(stats?.pending_invoice_count ?? 0)}
          hint="Across all dates"
          icon={AlertIcon}
          tone="amber"
          loading={summaryLoading && !summary}
        />
        <StatCard
          label="Customers"
          value={String(stats?.customer_count ?? 0)}
          hint="Active"
          icon={UsersIcon}
          tone="slate"
          loading={summaryLoading && !summary}
        />
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <h2 className="font-semibold">Sales</h2>
              <p className="text-xs text-slate-400">
                Cancelled bills excluded
              </p>
            </div>

            <Select
              value={range}
              options={TREND_RANGE_OPTIONS}
              onChange={setRange}
              label="Sales date range"
              className="w-36 shrink-0"
            />
          </div>

          {!summary ? (
            <p className="px-4 py-14 text-center text-sm text-slate-500">
              Loading…
            </p>
          ) : (
            <div
              aria-busy={summaryLoading}
              className={`transition-opacity ${summaryLoading ? "opacity-50" : ""}`}
            >
              <BarChart
                data={trend}
                color={CHART_PRIMARY}
                formatValue={formatMoney}
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="font-semibold">Payment status</h2>
              <p className="text-xs text-slate-400">All invoices</p>
            </div>
          </div>

          {!summary ? (
            <p className="px-4 py-14 text-center text-sm text-slate-500">
              Loading…
            </p>
          ) : (
            <div className="p-4">
              <DonutChart
                data={statusSlices}
                centerLabel="invoices"
                emptyText="No invoices yet"
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold">
              Low stock
              {!listsLoading && !!lowStockCount && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  {lowStockCount}
                </span>
              )}
            </h2>
            {cardLink("/variants", "Manage")}
          </div>

          {listsLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Loading…
            </p>
          ) : !lowStock.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Every item is well stocked.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {variant.name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-slate-400">
                      {variant.sku}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
                      variant.stock_quantity === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {variant.stock_quantity === 0
                      ? "Out"
                      : `${variant.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div>
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold">Recent invoices</h2>
            {cardLink("/invoices", "View all")}
          </div>

          {listsLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Loading…
            </p>
          ) : !recent.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No invoices yet.{" "}
              <Link to="/billing" className="text-primary-dark hover:underline">
                Start billing
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-slate-500">
                        {invoice.invoice_number}
                      </p>
                      <p className="truncate text-sm font-medium">
                        {invoice.customer?.name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(invoice.invoice_date)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-medium tabular-nums">
                        {formatMoney(invoice.total_amount)}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          PAYMENT_STATUS_STYLES[invoice.payment_status]
                        }`}
                      >
                        {invoice.payment_status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
