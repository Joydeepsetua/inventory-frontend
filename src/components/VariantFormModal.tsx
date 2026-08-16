import { useEffect, useState } from "react";

import { searchProductOptions } from "../api/options";
import type { VariantInput } from "../api/variants";
import type { Variant } from "../types/api";
import AsyncSelect from "./AsyncSelect";
import Modal from "./Modal";

interface VariantFormModalProps {
  open: boolean;
  variant: Variant | null;
  saving: boolean;
  error: string | null;
  onSubmit: (input: VariantInput) => void;
  onClose: () => void;
}

type FormState = {
  product_id: string;
  sku: string;
  name: string;
  price: string;
  stock_quantity: string;
  low_stock_threshold: string;
};

const EMPTY: FormState = {
  product_id: "",
  sku: "",
  name: "",
  price: "",
  stock_quantity: "0",
  low_stock_threshold: "10",
};

const SKU_PATTERN = /^[A-Za-z0-9._-]+$/;

const isWholeNumber = (value: string) =>
  /^\d+$/.test(value.trim()) && Number(value) >= 0;

const validate = (form: FormState) => {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.product_id) errors.product_id = "Pick a product";

  const sku = form.sku.trim();

  if (!sku) errors.sku = "SKU is required";
  else if (sku.length > 64) errors.sku = "Max 64 characters";
  else if (!SKU_PATTERN.test(sku))
    errors.sku = "Only letters, numbers, dot, dash and underscore";

  if (!form.name.trim()) errors.name = "Name is required";
  else if (form.name.trim().length > 150) errors.name = "Max 150 characters";

  const price = Number(form.price);

  if (form.price.trim() === "" || Number.isNaN(price)) {
    errors.price = "Enter a price";
  } else if (price < 0) {
    errors.price = "Price cannot be negative";
  } else if (price > 99999999.99) {
    errors.price = "Price is too large";
  }

  if (!isWholeNumber(form.stock_quantity)) {
    errors.stock_quantity = "Enter a whole number";
  }

  if (!isWholeNumber(form.low_stock_threshold)) {
    errors.low_stock_threshold = "Enter a whole number";
  }

  return errors;
};

export default function VariantFormModal({
  open,
  variant,
  saving,
  error,
  onSubmit,
  onClose,
}: VariantFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [productLabel, setProductLabel] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!open) return;

    setForm(
      variant
        ? {
            product_id: variant.product_id,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            stock_quantity: String(variant.stock_quantity),
            low_stock_threshold: String(variant.low_stock_threshold),
          }
        : EMPTY
    );

    const product = variant?.product;

    setProductLabel(
      product
        ? product.brand
          ? `${product.name} · ${product.brand}`
          : product.name
        : null
    );
    setErrors({});
  }, [open, variant]);

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

    onSubmit({
      product_id: form.product_id,
      sku: form.sku.trim(),
      name: form.name.trim(),
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
    });
  };

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-primary ${
      errors[field] ? "border-red-400" : "border-slate-300"
    }`;

  const field = (
    label: string,
    key: keyof FormState,
    options: {
      required?: boolean;
      placeholder?: string;
      maxLength?: number;
      inputMode?: "numeric" | "decimal" | "text";
      hint?: string;
    } = {}
  ) => (
    <div>
      <label
        htmlFor={`variant-${key}`}
        className="mb-1 block text-sm font-medium"
      >
        {label}
        {options.required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={`variant-${key}`}
        value={form[key]}
        placeholder={options.placeholder}
        maxLength={options.maxLength}
        inputMode={options.inputMode}
        onChange={(event) => set(key, event.target.value)}
        className={inputClass(key)}
      />
      {errors[key] ? (
        <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
      ) : options.hint ? (
        <p className="mt-1 text-xs text-slate-400">{options.hint}</p>
      ) : null}
    </div>
  );

  return (
    <Modal
      open={open}
      busy={saving}
      title={variant ? "Edit variant" : "Add variant"}
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
            form="variant-form"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : variant ? "Save changes" : "Add variant"}
          </button>
        </>
      }
    >
      <form
        id="variant-form"
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

        <div>
          <label className="mb-1 block text-sm font-medium">
            Product<span className="text-red-600"> *</span>
          </label>
          <AsyncSelect
            value={form.product_id}
            selectedLabel={productLabel}
            fetchOptions={searchProductOptions}
            placeholder="Select a product"
            searchPlaceholder="Search products"
            emptyText="No active products found"
            invalid={!!errors.product_id}
            onChange={(next, option) => {
              set("product_id", next);
              setProductLabel(option?.label ?? null);
            }}
          />
          {errors.product_id && (
            <p className="mt-1 text-xs text-red-600">{errors.product_id}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("SKU", "sku", {
            required: true,
            placeholder: "APPLE-IPHONE-19-RED-128",
            maxLength: 64,
            hint: "Saved in uppercase, must be unique",
          })}
          {field("Variant name", "name", {
            required: true,
            placeholder: "Red / 128GB",
            maxLength: 150,
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {field("Price", "price", {
            required: true,
            placeholder: "5049.00",
            inputMode: "decimal",
          })}
          {field("Stock", "stock_quantity", {
            required: true,
            placeholder: "0",
            inputMode: "numeric",
          })}
          {field("Low stock at", "low_stock_threshold", {
            required: true,
            placeholder: "10",
            inputMode: "numeric",
          })}
        </div>
      </form>
    </Modal>
  );
}
