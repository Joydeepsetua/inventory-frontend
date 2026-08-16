import { useEffect, useState } from "react";

import { searchProductOptions } from "../api/options";
import {
  createVariant,
  deleteVariant,
  listVariants,
  restoreVariant,
  updateVariant,
} from "../api/variants";
import type { VariantInput } from "../api/variants";
import AsyncSelect from "../components/AsyncSelect";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import VariantFormModal from "../components/VariantFormModal";
import {
  DEFAULT_PAGE_SIZE,
  STATUS_OPTIONS,
  STOCK_OPTIONS,
} from "../constants/options";
import type { StockFilter } from "../constants/options";
import {
  EditIcon,
  PlusIcon,
  RestoreIcon,
  SearchIcon,
  TrashIcon,
} from "../icons";
import type {
  Pagination as PaginationMeta,
  StatusFilter,
  Variant,
} from "../types/api";
import { errorMessage } from "../utils/error";
import { formatMoney } from "../utils/format";

export default function Variants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [productId, setProductId] = useState("");
  const [productLabel, setProductLabel] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pending, setPending] = useState<{
    variant: Variant;
    action: "delete" | "restore";
  } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const reload = () => setReloadToken((current) => current + 1);

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
        const result = await listVariants({
          page,
          limit: DEFAULT_PAGE_SIZE,
          search: search || undefined,
          status,
          product_id: productId || undefined,
          low_stock: stock === "all" ? undefined : stock === "low",
        });

        if (ignore) return;

        setVariants(result.data);
        setPagination(result.pagination ?? null);
      } catch (error) {
        if (ignore) return;

        setListError(errorMessage(error, "Unable to load variants"));
        setVariants([]);
        setPagination(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [page, search, status, stock, productId, reloadToken]);

  const handleSubmit = async (input: VariantInput) => {
    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await updateVariant(editing.id, input);
      } else {
        await createVariant(input);
      }

      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (error) {
      setFormError(errorMessage(error, "Unable to save variant"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;

    setActionBusy(true);

    try {
      if (pending.action === "delete") {
        await deleteVariant(pending.variant.id);
      } else {
        await restoreVariant(pending.variant.id);
      }

      setPending(null);
      reload();
    } catch (error) {
      setPending(null);
      setListError(errorMessage(error, "Action failed"));
    } finally {
      setActionBusy(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (variant: Variant) => {
    setEditing(variant);
    setFormError(null);
    setFormOpen(true);
  };

  const isDelete = pending?.action === "delete";
  const hasFilters =
    !!search || status !== "all" || stock !== "all" || !!productId;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Variants</h1>
          <p className="text-sm text-slate-500">
            {pagination ? `${pagination.total} total` : " "}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary-dark"
        >
          <PlusIcon className="h-4 w-4" />
          Add variant
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search SKU or name"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <AsyncSelect
            value={productId}
            selectedLabel={productLabel}
            label="Filter by product"
            className="w-52"
            allowClear
            clearLabel="All products"
            searchPlaceholder="Search products"
            fetchOptions={searchProductOptions}
            onChange={(next, option) => {
              setProductId(next);
              setProductLabel(option?.label ?? null);
              setPage(1);
            }}
          />

          <Select
            value={stock}
            label="Filter by stock"
            className="w-36"
            options={STOCK_OPTIONS}
            onChange={(next) => {
              setStock(next);
              setPage(1);
            }}
          />

          <Select
            value={status}
            label="Filter by status"
            className="w-32"
            options={STATUS_OPTIONS}
            onChange={(next) => {
              setStatus(next);
              setPage(1);
            }}
          />
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
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Variant</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
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

              {!loading && !variants.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    {hasFilters
                      ? "No variants match these filters."
                      : "No variants yet. Add the first one."}
                  </td>
                </tr>
              )}

              {!loading &&
                variants.map((variant, index) => (
                  <tr key={variant.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {variant.sku}
                    </td>
                    <td className="px-4 py-3 font-medium">{variant.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {variant.product?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(variant.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 tabular-nums ${
                          variant.is_low_stock
                            ? "font-medium text-amber-600"
                            : "text-slate-600"
                        }`}
                        title={
                          variant.is_low_stock
                            ? `At or below the low stock level of ${variant.low_stock_threshold}`
                            : undefined
                        }
                      >
                        {variant.stock_quantity}
                        {variant.is_low_stock && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          variant.is_active
                            ? "bg-primary-tint text-primary-dark"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {variant.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(variant)}
                          aria-label={`Edit ${variant.sku}`}
                          title="Edit"
                          className="rounded p-1.5 text-slate-500 transition hover:bg-primary-tint hover:text-primary-dark"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>

                        {variant.is_active ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ variant, action: "delete" })
                            }
                            aria-label={`Delete ${variant.sku}`}
                            title="Delete"
                            className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ variant, action: "restore" })
                            }
                            aria-label={`Restore ${variant.sku}`}
                            title="Restore"
                            className="rounded p-1.5 text-slate-500 transition hover:bg-primary-tint hover:text-primary-dark"
                          >
                            <RestoreIcon className="h-4 w-4" />
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

      {formOpen && (
        <VariantFormModal
          open
          key={editing?.id ?? "new"}
          variant={editing}
          saving={saving}
          error={formError}
          onSubmit={handleSubmit}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        tone={isDelete ? "danger" : "primary"}
        icon={isDelete ? TrashIcon : RestoreIcon}
        title={isDelete ? "Delete variant?" : "Restore variant?"}
        message={
          isDelete ? (
            <>
              <b>{pending?.variant.sku}</b> can no longer be added to a cart.
              Invoices that already include it stay intact.
            </>
          ) : (
            <>
              <b>{pending?.variant.sku}</b> will be sellable again.
            </>
          )
        }
        confirmLabel={isDelete ? "Delete" : "Restore"}
        loadingLabel={isDelete ? "Deleting…" : "Restoring…"}
        loading={actionBusy}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
