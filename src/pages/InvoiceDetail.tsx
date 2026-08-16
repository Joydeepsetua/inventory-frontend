import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  cancelInvoice,
  getInvoice,
  updateInvoicePayment,
} from "../api/invoices";
import ConfirmDialog from "../components/ConfirmDialog";
import PaymentModal from "../components/PaymentModal";
import { PAYMENT_STATUS_STYLES } from "../constants/options";
import type { PaymentMethodValue } from "../constants/options";
import { ChevronLeftIcon, EditIcon, TrashIcon } from "../icons";
import { useAppSelector } from "../store/hooks";
import type { Invoice, SettablePaymentStatus } from "../types/api";
import { errorMessage } from "../utils/error";
import { formatDate, formatMoney } from "../utils/format";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    const run = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const result = await getInvoice(id);
        if (!ignore) setInvoice(result.data);
      } catch (error) {
        if (ignore) return;
        setLoadError(errorMessage(error, "Unable to load invoice"));
        setInvoice(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [id, reloadToken]);

  const handlePayment = async (
    status: SettablePaymentStatus,
    method: PaymentMethodValue
  ) => {
    if (!id) return;

    setPaymentSaving(true);
    setPaymentError(null);

    try {
      await updateInvoicePayment(id, status, method || null);
      setPaymentOpen(false);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setPaymentError(errorMessage(error, "Unable to update payment"));
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;

    setCancelBusy(true);
    setActionError(null);

    try {
      await cancelInvoice(id);
      setConfirmCancel(false);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setConfirmCancel(false);
      setActionError(errorMessage(error, "Unable to cancel invoice"));
    } finally {
      setCancelBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        Loading invoice…
      </p>
    );
  }

  if (loadError || !invoice) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
        <p className="text-sm text-red-700">{loadError ?? "Invoice not found"}</p>
        <button
          type="button"
          onClick={() => navigate("/invoices")}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm transition hover:bg-slate-50"
        >
          Back to invoices
        </button>
      </div>
    );
  }

  const isCancelled = invoice.payment_status === "CANCELLED";
  const mayCancel =
    !isCancelled &&
    (user?.role === "OWNER" || invoice.created_by === user?.id);

  const totalRow = (label: string, value: string, strong = false) => (
    <div
      className={`flex items-center justify-between ${
        strong
          ? "border-t border-slate-200 pt-2 text-base font-semibold"
          : "text-sm text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );

  return (
    <div>
      <Link
        to="/invoices"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-primary-dark"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to invoices
      </Link>

      {actionError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-lg font-semibold">
                {invoice.invoice_number}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  PAYMENT_STATUS_STYLES[invoice.payment_status]
                }`}
              >
                {invoice.payment_status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(invoice.invoice_date)}
              {invoice.payment_method && ` · ${invoice.payment_method}`}
            </p>
          </div>

          <div className="flex gap-2">
            {!isCancelled && (
              <button
                type="button"
                onClick={() => {
                  setPaymentError(null);
                  setPaymentOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-50"
              >
                <EditIcon className="h-4 w-4" />
                Payment
              </button>
            )}

            {mayCancel && (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-5 border-b border-slate-200 p-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Billed to
            </p>
            <p className="font-medium">{invoice.customer?.name ?? "—"}</p>
            <p className="text-sm text-slate-600">{invoice.customer?.phone}</p>
            {invoice.customer?.email && (
              <p className="text-sm text-slate-600">{invoice.customer.email}</p>
            )}
            {invoice.customer?.address && (
              <p className="mt-1 text-sm text-slate-500">
                {invoice.customer.address}
              </p>
            )}
            {invoice.customer?.gst_number && (
              <p className="mt-1 text-sm text-slate-500">
                GST: {invoice.customer.gst_number}
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Billed by
            </p>
            <p className="font-medium">{invoice.creator?.name ?? "—"}</p>
            <p className="text-sm text-slate-600">{invoice.creator?.email}</p>
            {invoice.notes && (
              <p className="mt-3 text-sm text-slate-500">{invoice.notes}</p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-16 px-5 py-3 font-medium">SL</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
                <th className="px-5 py-3 text-right font-medium">Qty</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="font-mono text-[11px] text-slate-400">
                      {item.sku}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatMoney(item.unit_price)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {formatMoney(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-slate-200 p-5">
          <div className="w-full max-w-xs space-y-2">
            {totalRow("Subtotal", formatMoney(invoice.subtotal))}
            {totalRow("Discount", `− ${formatMoney(invoice.discount_amount)}`)}
            {totalRow(
              `Tax (${Number(invoice.tax_rate)}%)`,
              `+ ${formatMoney(invoice.tax_amount)}`
            )}
            {totalRow("Total", formatMoney(invoice.total_amount), true)}
          </div>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        invoice={invoice}
        saving={paymentSaving}
        error={paymentError}
        onSubmit={handlePayment}
        onClose={() => setPaymentOpen(false)}
      />

      <ConfirmDialog
        open={confirmCancel}
        tone="danger"
        title="Cancel invoice?"
        message={
          <>
            Stock from <b>{invoice.invoice_number}</b> goes back to inventory
            and the bill is marked cancelled. This cannot be undone.
          </>
        }
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        loadingLabel="Cancelling…"
        loading={cancelBusy}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
