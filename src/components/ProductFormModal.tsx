import { useEffect, useState } from "react";

import { searchCategoryOptions } from "../api/options";
import type { ProductInput } from "../api/products";
import type { Product } from "../types/api";
import AsyncSelect from "./AsyncSelect";
import Modal from "./Modal";

interface ProductFormModalProps {
  open: boolean;
  product: Product | null;
  saving: boolean;
  error: string | null;
  onSubmit: (input: ProductInput) => void;
  onClose: () => void;
}

type FormState = {
  category_id: string;
  name: string;
  brand: string;
  description: string;
};

const EMPTY: FormState = {
  category_id: "",
  name: "",
  brand: "",
  description: "",
};

const validate = (form: FormState) => {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.category_id) errors.category_id = "Pick a category";

  if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (form.name.trim().length > 150) {
    errors.name = "Name must be at most 150 characters";
  }

  if (form.brand.length > 100) errors.brand = "Max 100 characters";
  if (form.description.length > 2000) errors.description = "Max 2000 characters";

  return errors;
};

export default function ProductFormModal({
  open,
  product,
  saving,
  error,
  onSubmit,
  onClose,
}: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!open) return;

    setForm(
      product
        ? {
            category_id: product.category_id,
            name: product.name,
            brand: product.brand ?? "",
            description: product.description ?? "",
          }
        : EMPTY
    );
    setCategoryLabel(product?.category?.name ?? null);
    setErrors({});
  }, [open, product]);

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
      category_id: form.category_id,
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      description: form.description.trim() || null,
    });
  };

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-primary ${
      errors[field] ? "border-red-400" : "border-slate-300"
    }`;

  return (
    <Modal
      open={open}
      busy={saving}
      title={product ? "Edit product" : "Add product"}
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
            form="product-form"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
        </>
      }
    >
      <form
        id="product-form"
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
            Category<span className="text-red-600"> *</span>
          </label>
          <AsyncSelect
            value={form.category_id}
            selectedLabel={categoryLabel}
            fetchOptions={searchCategoryOptions}
            placeholder="Select a category"
            searchPlaceholder="Search categories"
            emptyText="No active categories found"
            invalid={!!errors.category_id}
            onChange={(next, option) => {
              set("category_id", next);
              setCategoryLabel(option?.label ?? null);
            }}
          />
          {errors.category_id && (
            <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="product-name"
              className="mb-1 block text-sm font-medium"
            >
              Name<span className="text-red-600"> *</span>
            </label>
            <input
              id="product-name"
              value={form.name}
              placeholder="iPhone 19"
              maxLength={150}
              onChange={(event) => set("name", event.target.value)}
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="product-brand"
              className="mb-1 block text-sm font-medium"
            >
              Brand
            </label>
            <input
              id="product-brand"
              value={form.brand}
              placeholder="Apple"
              maxLength={100}
              onChange={(event) => set("brand", event.target.value)}
              className={inputClass("brand")}
            />
            {errors.brand && (
              <p className="mt-1 text-xs text-red-600">{errors.brand}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="product-description"
            className="mb-1 block text-sm font-medium"
          >
            Description
          </label>
          <textarea
            id="product-description"
            value={form.description}
            placeholder="Flagship phone with a 6.7 inch display"
            rows={3}
            maxLength={2000}
            onChange={(event) => set("description", event.target.value)}
            className={`${inputClass("description")} resize-y`}
          />
          <div className="mt-1 flex justify-between gap-2">
            <p className="text-xs text-red-600">{errors.description}</p>
            <p className="shrink-0 text-xs text-slate-400">
              {form.description.length}/2000
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
