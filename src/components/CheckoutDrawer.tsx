import { useMemo, useState } from "react";

import { createCustomer } from "../api/customers";
import type { CustomerInput } from "../api/customers";
import { createInvoice } from "../api/invoices";
import { searchCustomerOptions } from "../api/options";
import {
  PAYMENT_METHOD_FIELD_OPTIONS,
  SETTABLE_PAYMENT_STATUS_OPTIONS,
} from "../constants/options";
import type { PaymentMethodValue } from "../constants/options";
import { CheckIcon, PlusIcon } from "../icons";
import type { Cart, Invoice, SettablePaymentStatus } from "../types/api";
import { errorMessage } from "../utils/error";
import { formatMoney } from "../utils/format";
import AsyncSelect from "./AsyncSelect";
import CustomerFormModal from "./CustomerFormModal";
import Drawer from "./Drawer";
import Select from "./Select";

interface CheckoutDrawerProps {
  open: boolean;
  cart: Cart;
  onClose: () => void;
  onInvoiced: () => void;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export default function CheckoutDrawer({
  open,
  cart,
  onClose,
  onInvoiced,
}: CheckoutDrawerProps) {
  const [customerId, setCustomerId] = useState("");
  const [customerLabel, setCustomerLabel] = useState<string | null>(null);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [paymentStatus, setPaymentStatus] =
    useState<SettablePaymentStatus>("PENDING");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Invoice | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddCustomer = async (input: CustomerInput) => {
    setAddSaving(true);
    setAddError(null);

    try {
      const result = await createCustomer(input);
      const customer = result.data;

      setCustomerId(customer.id);
      setCustomerLabel(`${customer.name} · ${customer.phone}`);
      setAddOpen(false);
    } catch (caught) {
      setAddError(errorMessage(caught, "Unable to add customer"));
    } finally {
      setAddSaving(false);
    }
  };

  const totals = useMemo(() => {
    const subtotal = Number(cart.summary.subtotal);
    const discountAmount = Number(discount) || 0;
    const rate = Number(taxRate) || 0;
    const taxable = Math.max(subtotal - discountAmount, 0);
    const taxAmount = round2((taxable * rate) / 100);

    return {
      subtotal,
      discountAmount,
      taxable,
      taxAmount,
      total: round2(taxable + taxAmount),
      discountTooBig: discountAmount > subtotal,
    };
  }, [cart.summary.subtotal, discount, taxRate]);

  const canSubmit =
    !!customerId && !!cart.items.length && !totals.discountTooBig && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      const result = await createInvoice({
        customer_id: customerId,
        discount_amount: totals.discountAmount,
        tax_rate: Number(taxRate) || 0,
        payment_status: paymentStatus,
        payment_method: paymentMethod || null,
        notes: notes.trim() || null,
      });

      setCreated(result.data);
      onInvoiced();
    } catch (caught) {
      setError(errorMessage(caught, "Unable to create invoice"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary";

  const row = (label: string, value: string, strong = false) => (
    <div
      className={`flex items-center justify-between ${
        strong ? "text-base font-semibold" : "text-sm text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );

  return (
    <>
      <Drawer
        open={open}
        busy={saving || addOpen}
        title={created ? "Invoice created" : "Checkout"}
        onClose={onClose}
        footer={
          created ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-primary py-2.5 text-sm text-white transition hover:bg-primary-dark"
            >
              Done
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                Total
                <span className="ml-2 text-base font-semibold text-slate-900 tabular-nums">
                  {formatMoney(totals.total)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? "Generating…" : "Generate invoice"}
              </button>
            </div>
          )
        }
      >
        {created ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
              <CheckIcon className="h-7 w-7" />
            </span>
            <p className="text-sm text-slate-500">Invoice number</p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {created.invoice_number}
            </p>

            <div className="mx-auto mt-6 max-w-xs space-y-2 rounded-lg border border-slate-200 p-4 text-left">
              {row("Customer", created.customer?.name ?? "—")}
              {row("Items", String(created.items?.length ?? 0))}
              {row("Total", formatMoney(created.total_amount), true)}
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Stock has been deducted and the cart is now empty.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-sm font-medium">
                  Customer<span className="text-red-600"> *</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAddError(null);
                    setAddOpen(true);
                  }}
                  className="group flex items-center gap-1.5 rounded-full bg-primary-tint py-2 pl-2.5 pr-3.5 text-xs font-medium text-primary-dark transition hover:bg-primary hover:text-white"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white transition group-hover:bg-white group-hover:text-primary">
                    <PlusIcon className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  New customer
                </button>
              </div>
              <AsyncSelect
                value={customerId}
                selectedLabel={customerLabel}
                fetchOptions={searchCustomerOptions}
                placeholder="Select a customer"
                searchPlaceholder="Search name, phone or email"
                emptyText="No active customers found"
                onChange={(next, option) => {
                  setCustomerId(next);
                  setCustomerLabel(option?.label ?? null);
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="checkout-discount"
                  className="mb-1 block text-sm font-medium"
                >
                  Discount
                </label>
                <input
                  id="checkout-discount"
                  value={discount}
                  inputMode="decimal"
                  onChange={(event) => setDiscount(event.target.value)}
                  className={inputClass}
                />
                {totals.discountTooBig && (
                  <p className="mt-1 text-xs text-red-600">
                    Cannot be more than the subtotal
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-tax"
                  className="mb-1 block text-sm font-medium"
                >
                  Tax rate (%)
                </label>
                <input
                  id="checkout-tax"
                  value={taxRate}
                  inputMode="decimal"
                  onChange={(event) => setTaxRate(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment status
                </label>
                <Select
                  value={paymentStatus}
                  options={SETTABLE_PAYMENT_STATUS_OPTIONS}
                  onChange={setPaymentStatus}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment method
                </label>
                <Select
                  value={paymentMethod}
                  options={PAYMENT_METHOD_FIELD_OPTIONS}
                  onChange={setPaymentMethod}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="checkout-notes"
                className="mb-1 block text-sm font-medium"
              >
                Notes
              </label>
              <textarea
                id="checkout-notes"
                value={notes}
                rows={2}
                maxLength={2000}
                placeholder="Counter sale"
                onChange={(event) => setNotes(event.target.value)}
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                {cart.summary.item_count} items · {cart.summary.total_quantity}{" "}
                units
              </p>

              <div className="space-y-2">
                {row("Subtotal", formatMoney(totals.subtotal))}
                {row("Discount", `− ${formatMoney(totals.discountAmount)}`)}
                {row(
                  `Tax (${Number(taxRate) || 0}%)`,
                  `+ ${formatMoney(totals.taxAmount)}`,
                )}
                <div className="border-t border-slate-200 pt-2">
                  {row("Total", formatMoney(totals.total), true)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {addOpen && (
        <CustomerFormModal
          open
          customer={null}
          saving={addSaving}
          error={addError}
          onSubmit={handleAddCustomer}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}
