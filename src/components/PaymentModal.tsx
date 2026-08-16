import { useState } from "react";

import {
  PAYMENT_METHOD_FIELD_OPTIONS,
  SETTABLE_PAYMENT_STATUS_OPTIONS,
} from "../constants/options";
import type { PaymentMethodValue } from "../constants/options";
import type { Invoice, SettablePaymentStatus } from "../types/api";
import Modal from "./Modal";
import Select from "./Select";

interface PaymentModalProps {
  open: boolean;
  invoice: Invoice | null;
  saving: boolean;
  error: string | null;
  onSubmit: (
    status: SettablePaymentStatus,
    method: PaymentMethodValue
  ) => void;
  onClose: () => void;
}

export default function PaymentModal({
  open,
  invoice,
  saving,
  error,
  onSubmit,
  onClose,
}: PaymentModalProps) {
  const [status, setStatus] = useState<SettablePaymentStatus>(() =>
    !invoice || invoice.payment_status === "CANCELLED"
      ? "PENDING"
      : (invoice.payment_status as SettablePaymentStatus)
  );
  const [method, setMethod] = useState<PaymentMethodValue>(
    () => invoice?.payment_method ?? ""
  );

  return (
    <Modal
      open={open}
      busy={saving}
      title="Update payment"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(status, method)}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="text-sm text-slate-500">
          Invoice{" "}
          <span className="font-mono font-medium text-slate-900">
            {invoice?.invoice_number}
          </span>
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Payment status
          </label>
          <Select
            value={status}
            options={SETTABLE_PAYMENT_STATUS_OPTIONS}
            onChange={setStatus}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Payment method
          </label>
          <Select
            value={method}
            options={PAYMENT_METHOD_FIELD_OPTIONS}
            onChange={setMethod}
          />
        </div>
      </div>
    </Modal>
  );
}
