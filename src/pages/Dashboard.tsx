import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listCustomers } from "../api/customers";
import { listInvoices } from "../api/invoices";
import { listVariants } from "../api/variants";
import BarChart from "../components/charts/BarChart";
import type { BarPoint } from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import type { DonutSlice } from "../components/charts/DonutChart";
import StatCard from "../components/StatCard";
import {
  CHART_PRIMARY,
  PAYMENT_STATUS_CHART_COLORS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_STYLES,
} from "../constants/options";
import {
  AlertIcon,
  CartIcon,
  ChevronRightIcon,
  InvoiceIcon,
  UsersIcon,
} from "../icons";
import { useAppSelector } from "../store/hooks";
import type { Invoice, Variant } from "../types/api";
import { errorMessage } from "../utils/error";
import { formatDate, formatMoney } from "../utils/format";

const TODAY_LIMIT = 100;

interface Stats {
  todaySales: number;
  todayCount: number;
  pendingCount: number;
  lowStockCount: number;
  customerCount: number;
  todayTruncated: boolean;
}

export default function Dashboard() {
  const user = useAppSelector((state) => state.auth.user);

  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Invoice[]>([]);
  const [lowStock, setLowStock] = useState<Variant[]>([]);
  const [statusSlices, setStatusSlices] = useState<DonutSlice[]>([]);
  const [weekSales, setWeekSales] = useState<BarPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      const asDay = (date: Date) => date.toLocaleDateString("en-CA");

      const dayStart = (date: Date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        return start.toISOString();
      };

      const dayEnd = (date: Date) => {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return end.toISOString();
      };

      const now = new Date();

      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        return date;
      });

      try {
        const [todayInv, pending, low, customers, recentInv, week, ...counts] =
          await Promise.all([
            listInvoices({
              date_from: dayStart(now),
              date_to: dayEnd(now),
              limit: TODAY_LIMIT,
            }),
            listInvoices({ payment_status: "PENDING", limit: 1 }),
            listVariants({ low_stock: true, status: "active", limit: 5 }),
            listCustomers({ status: "active", limit: 1 }),
            listInvoices({ limit: 5 }),
            listInvoices({
              date_from: dayStart(days[0]),
              date_to: dayEnd(now),
              limit: 100,
            }),
            ...PAYMENT_STATUS_OPTIONS.map((option) =>
              listInvoices({ payment_status: option.value, limit: 1 }),
            ),
          ]);

        if (ignore) return;

        setStatusSlices(
          PAYMENT_STATUS_OPTIONS.map((option, index) => ({
            label: option.label,
            value: counts[index].pagination?.total ?? 0,
            color: PAYMENT_STATUS_CHART_COLORS[option.value],
          })),
        );

        const byDay = new Map<string, number>();

        week.data
          .filter((invoice) => invoice.payment_status !== "CANCELLED")
          .forEach((invoice) => {
            const key = asDay(new Date(invoice.invoice_date));
            byDay.set(
              key,
              (byDay.get(key) ?? 0) + Number(invoice.total_amount),
            );
          });

        setWeekSales(
          days.map((date) => ({
            label: date.toLocaleDateString("en-IN", { weekday: "short" }),
            caption: date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            }),
            value: byDay.get(asDay(date)) ?? 0,
          })),
        );

        const billed = todayInv.data.filter(
          (invoice) => invoice.payment_status !== "CANCELLED",
        );

        setStats({
          todaySales: billed.reduce(
            (sum, invoice) => sum + Number(invoice.total_amount),
            0,
          ),
          todayCount: billed.length,
          pendingCount: pending.pagination?.total ?? 0,
          lowStockCount: low.pagination?.total ?? 0,
          customerCount: customers.pagination?.total ?? 0,
          todayTruncated: (todayInv.pagination?.total ?? 0) > TODAY_LIMIT,
        });
        setLowStock(low.data);
        setRecent(recentInv.data);
      } catch (caught) {
        if (ignore) return;
        setError(errorMessage(caught, "Unable to load dashboard"));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, []);

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
          value={formatMoney(stats?.todaySales ?? 0)}
          hint={
            stats?.todayTruncated
              ? `First ${TODAY_LIMIT} bills only`
              : "Cancelled bills excluded"
          }
          icon={CartIcon}
          tone="primary"
          loading={loading}
        />
        <StatCard
          label="Bills today"
          value={String(stats?.todayCount ?? 0)}
          icon={InvoiceIcon}
          tone="blue"
          loading={loading}
        />
        <StatCard
          label="Payment pending"
          value={String(stats?.pendingCount ?? 0)}
          hint="Across all dates"
          icon={AlertIcon}
          tone="amber"
          loading={loading}
        />
        <StatCard
          label="Customers"
          value={String(stats?.customerCount ?? 0)}
          hint="Active"
          icon={UsersIcon}
          tone="slate"
          loading={loading}
        />
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="font-semibold">Sales this week</h2>
              <p className="text-xs text-slate-400">
                Last 7 days · cancelled bills excluded
              </p>
            </div>
          </div>

          {loading ? (
            <p className="px-4 py-14 text-center text-sm text-slate-500">
              Loading…
            </p>
          ) : (
            <BarChart
              data={weekSales}
              color={CHART_PRIMARY}
              formatValue={formatMoney}
            />
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="font-semibold">Payment status</h2>
              <p className="text-xs text-slate-400">All invoices</p>
            </div>
          </div>

          {loading ? (
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
              {!loading && !!stats?.lowStockCount && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  {stats.lowStockCount}
                </span>
              )}
            </h2>
            {cardLink("/variants", "Manage")}
          </div>

          {loading ? (
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

          {loading ? (
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
