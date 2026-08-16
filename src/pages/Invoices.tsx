import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { cancelInvoice, listInvoices } from "../api/invoices";
import { searchCustomerOptions } from "../api/options";
import AsyncSelect from "../components/AsyncSelect";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import {
  DEFAULT_PAGE_SIZE,
  PAYMENT_STATUS_FILTER_OPTIONS,
  PAYMENT_STATUS_STYLES,
} from "../constants/options";
import type { PaymentStatusFilter } from "../constants/options";
import { EyeIcon, SearchIcon, TrashIcon } from "../icons";
import { useAppSelector } from "../store/hooks";
import type { Invoice, Pagination as PaginationMeta } from "../types/api";
import { errorMessage } from "../utils/error";
import { formatDate, formatMoney } from "../utils/format";

export default function Invoices() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter>("");
  const [customerId, setCustomerId] = useState("");
  const [customerLabel, setCustomerLabel] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [pending, setPending] = useState<Invoice | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setListError(null);

      try {
        const result = await listInvoices({
          page,
          limit: DEFAULT_PAGE_SIZE,
          search: search || undefined,
          payment_status: paymentStatus || undefined,
          customer_id: customerId || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        });

        if (ignore) return;

        setInvoices(result.data);
        setPagination(result.pagination ?? null);
      } catch (error) {
        if (ignore) return;

        setListError(errorMessage(error, "Unable to load invoices"));
        setInvoices([]);
        setPagination(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [page, search, paymentStatus, customerId, dateFrom, dateTo, reloadToken]);

  const handleCancel = async () => {
    if (!pending) return;

    setActionBusy(true);

    try {
      await cancelInvoice(pending.id);
      setPending(null);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setPending(null);
      setListError(errorMessage(error, "Unable to cancel invoice"));
    } finally {
      setActionBusy(false);
    }
  };

  const canCancel = (invoice: Invoice) =>
    invoice.payment_status !== "CANCELLED" &&
    (user?.role === "OWNER" || invoice.created_by === user?.id);

  const hasFilters =
    !!search || !!paymentStatus || !!customerId || !!dateFrom || !!dateTo;

  const dateClass =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary";

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <p className="text-sm text-slate-500">
          {pagination ? `${pagination.total} total` : " "}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search invoice number"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <AsyncSelect
            value={customerId}
            selectedLabel={customerLabel}
            label="Filter by customer"
            className="w-52"
            allowClear
            clearLabel="All customers"
            searchPlaceholder="Search customers"
            fetchOptions={searchCustomerOptions}
            onChange={(next, option) => {
              setCustomerId(next);
              setCustomerLabel(option?.label ?? null);
              setPage(1);
            }}
          />

          <Select
            value={paymentStatus}
            label="Filter by payment status"
            className="w-36"
            options={PAYMENT_STATUS_FILTER_OPTIONS}
            onChange={(next) => {
              setPaymentStatus(next);
              setPage(1);
            }}
          />

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              aria-label="From date"
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className={dateClass}
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              aria-label="To date"
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className={dateClass}
            />
          </div>
        </div>

        {listError && (
          <p className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">SL</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Billed by</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && !invoices.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    {hasFilters
                      ? "No invoices match these filters."
                      : "No invoices yet. Create one from the Billing page."}
                  </td>
                </tr>
              )}

              {!loading &&
                invoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-500">
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-mono text-xs font-medium text-primary-dark hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.customer?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {invoice.creator?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatMoney(invoice.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          PAYMENT_STATUS_STYLES[invoice.payment_status]
                        }`}
                      >
                        {invoice.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`View ${invoice.invoice_number}`}
                          title="View"
                          className="rounded p-1.5 text-slate-500 transition hover:bg-primary-tint hover:text-primary-dark"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>

                        {canCancel(invoice) && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPending(invoice);
                            }}
                            aria-label={`Cancel ${invoice.invoice_number}`}
                            title="Cancel invoice"
                            className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <Pagination pagination={pagination} onPageChange={setPage} />
        )}
      </div>

      <ConfirmDialog
        open={!!pending}
        tone="danger"
        title="Cancel invoice?"
        message={
          <>
            Stock from <b>{pending?.invoice_number}</b> goes back to inventory
            and the bill is marked cancelled. This cannot be undone.
          </>
        }
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        loadingLabel="Cancelling…"
        loading={actionBusy}
        onConfirm={handleCancel}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
