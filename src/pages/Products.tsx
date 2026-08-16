import { useEffect, useState } from "react";

import {
  createProduct,
  deleteProduct,
  listProducts,
  restoreProduct,
  updateProduct,
} from "../api/products";
import { searchCategoryOptions } from "../api/options";
import type { ProductInput } from "../api/products";
import AsyncSelect from "../components/AsyncSelect";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import ProductFormModal from "../components/ProductFormModal";
import Select from "../components/Select";
import { DEFAULT_PAGE_SIZE, STATUS_OPTIONS } from "../constants/options";
import {
  EditIcon,
  PlusIcon,
  RestoreIcon,
  SearchIcon,
  TrashIcon,
} from "../icons";
import type {
  Pagination as PaginationMeta,
  Product,
  StatusFilter,
} from "../types/api";
import { errorMessage } from "../utils/error";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pending, setPending] = useState<{
    product: Product;
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
        const result = await listProducts({
          page,
          limit: DEFAULT_PAGE_SIZE,
          search: search || undefined,
          status,
          category_id: categoryId || undefined,
        });

        if (ignore) return;

        setProducts(result.data);
        setPagination(result.pagination ?? null);
      } catch (error) {
        if (ignore) return;

        setListError(errorMessage(error, "Unable to load products"));
        setProducts([]);
        setPagination(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [page, search, status, categoryId, reloadToken]);

  const handleSubmit = async (input: ProductInput) => {
    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await updateProduct(editing.id, input);
      } else {
        await createProduct(input);
      }

      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (error) {
      setFormError(errorMessage(error, "Unable to save product"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;

    setActionBusy(true);

    try {
      if (pending.action === "delete") {
        await deleteProduct(pending.product.id);
      } else {
        await restoreProduct(pending.product.id);
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

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormError(null);
    setFormOpen(true);
  };

  const isDelete = pending?.action === "delete";
  const hasFilters = !!search || status !== "all" || !!categoryId;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
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
          Add product
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name or brand"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <AsyncSelect
            value={categoryId}
            selectedLabel={categoryLabel}
            label="Filter by category"
            className="w-52"
            allowClear
            clearLabel="All categories"
            searchPlaceholder="Search categories"
            fetchOptions={searchCategoryOptions}
            onChange={(next, option) => {
              setCategoryId(next);
              setCategoryLabel(option?.label ?? null);
              setPage(1);
            }}
          />

          <Select
            value={status}
            label="Filter by status"
            className="w-36"
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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && !products.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    {hasFilters
                      ? "No products match these filters."
                      : "No products yet. Add the first one."}
                  </td>
                </tr>
              )}

              {!loading &&
                products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.brand ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.is_active
                            ? "bg-primary-tint text-primary-dark"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          aria-label={`Edit ${product.name}`}
                          title="Edit"
                          className="rounded p-1.5 text-slate-500 transition hover:bg-primary-tint hover:text-primary-dark"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>

                        {product.is_active ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ product, action: "delete" })
                            }
                            aria-label={`Delete ${product.name}`}
                            title="Delete"
                            className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ product, action: "restore" })
                            }
                            aria-label={`Restore ${product.name}`}
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

      <ProductFormModal
        open={formOpen}
        product={editing}
        saving={saving}
        error={formError}
        onSubmit={handleSubmit}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!pending}
        tone={isDelete ? "danger" : "primary"}
        icon={isDelete ? TrashIcon : RestoreIcon}
        title={isDelete ? "Delete product?" : "Restore product?"}
        message={
          isDelete ? (
            <>
              <b>{pending?.product.name}</b> will be marked inactive. Its
              variants can no longer be billed.
            </>
          ) : (
            <>
              <b>{pending?.product.name}</b> will be active again.
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
