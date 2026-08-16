import { useEffect, useState } from "react";

import type { CustomerInput } from "../api/customers";
import type { Customer } from "../types/api";
import Modal from "./Modal";

interface CustomerFormModalProps {
  open: boolean;
  customer: Customer | null;
  saving: boolean;
  error: string | null;
  onSubmit: (input: CustomerInput) => void;
  onClose: () => void;
}

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string;
};

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gst_number: "",
};

const PHONE_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (form: FormState) => {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (form.name.trim().length > 150) {
    errors.name = "Name must be at most 150 characters";
  }

  if (!PHONE_PATTERN.test(form.phone.trim())) {
    errors.phone = "Enter a valid 10 digit phone number";
  }

  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (form.address.length > 500) errors.address = "Max 500 characters";
  if (form.city.length > 100) errors.city = "Max 100 characters";
  if (form.state.length > 100) errors.state = "Max 100 characters";
  if (form.pincode.length > 10) errors.pincode = "Max 10 characters";
  if (form.gst_number.length > 20) errors.gst_number = "Max 20 characters";

  return errors;
};

export default function CustomerFormModal({
  open,
  customer,
  saving,
  error,
  onSubmit,
  onClose,
}: CustomerFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!open) return;

    setForm(
      customer
        ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            state: customer.state ?? "",
            pincode: customer.pincode ?? "",
            gst_number: customer.gst_number ?? "",
          }
        : EMPTY
    );
    setErrors({});
  }, [open, customer]);

  const set = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));

    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = () => {
    const found = validate(form);

    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    const orNull = (value: string) => value.trim() || null;

    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: orNull(form.email),
      address: orNull(form.address),
      city: orNull(form.city),
      state: orNull(form.state),
      pincode: orNull(form.pincode),
      gst_number: orNull(form.gst_number),
    });
  };

  const field = (
    label: string,
    key: keyof FormState,
    options: {
      required?: boolean;
      placeholder?: string;
      maxLength?: number;
      inputMode?: "numeric" | "text";
    } = {}
  ) => (
    <div>
      <label
        htmlFor={`customer-${key}`}
        className="mb-1 block text-sm font-medium"
      >
        {label}
        {options.required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={`customer-${key}`}
        value={form[key]}
        placeholder={options.placeholder}
        maxLength={options.maxLength}
        inputMode={options.inputMode}
        onChange={(event) => set(key, event.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-primary ${
          errors[key] ? "border-red-400" : "border-slate-300"
        }`}
      />
      {errors[key] && (
        <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      busy={saving}
      title={customer ? "Edit customer" : "Add customer"}
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
            type="submit"
            form="customer-form"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : customer ? "Save changes" : "Add customer"}
          </button>
        </>
      }
    >
      <form
        id="customer-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {field("Name", "name", {
            required: true,
            placeholder: "Joy Setua",
          })}
          {field("Phone", "phone", {
            required: true,
            placeholder: "9876543210",
            maxLength: 10,
            inputMode: "numeric",
          })}
        </div>

        {field("Email", "email", { placeholder: "joy@example.com" })}
        {field("Address", "address")}

        <div className="grid gap-4 sm:grid-cols-3">
          {field("City", "city")}
          {field("State", "state")}
          {field("Pincode", "pincode")}
        </div>

        {field("GST number", "gst_number", {
          placeholder: "27AAAAA0000A1Z5",
        })}
      </form>
    </Modal>
  );
}
