import { useState } from "react";

import type { CategoryInput } from "../api/categories";
import type { Category } from "../types/api";
import Modal from "./Modal";

interface CategoryFormModalProps {
  open: boolean;
  category: Category | null;
  saving: boolean;
  error: string | null;
  onSubmit: (input: CategoryInput) => void;
  onClose: () => void;
}

type FormState = {
  name: string;
  description: string;
};

const EMPTY: FormState = { name: "", description: "" };

const validate = (form: FormState) => {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (form.name.trim().length > 100) {
    errors.name = "Name must be at most 100 characters";
  }

  if (form.description.length > 2000) {
    errors.description = "Max 2000 characters";
  }

  return errors;
};

export default function CategoryFormModal({
  open,
  category,
  saving,
  error,
  onSubmit,
  onClose,
}: CategoryFormModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    category
      ? { name: category.name, description: category.description ?? "" }
      : EMPTY
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

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
      name: form.name.trim(),
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
      title={category ? "Edit category" : "Add category"}
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
            form="category-form"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : category ? "Save changes" : "Add category"}
          </button>
        </>
      }
    >
      <form
        id="category-form"
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
          <label
            htmlFor="category-name"
            className="mb-1 block text-sm font-medium"
          >
            Name<span className="text-red-600"> *</span>
          </label>
          <input
            id="category-name"
            value={form.name}
            placeholder="Mobiles"
            maxLength={100}
            onChange={(event) => set("name", event.target.value)}
            className={inputClass("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="category-description"
            className="mb-1 block text-sm font-medium"
          >
            Description
          </label>
          <textarea
            id="category-description"
            value={form.description}
            placeholder="Phones, tablets and accessories"
            rows={4}
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
