import { useEffect, useState } from "react";

import {
  createCategory,
  deleteCategory,
  listCategories,
  restoreCategory,
  updateCategory,
} from "../api/categories";
import type { CategoryInput } from "../api/categories";
import CategoryFormModal from "../components/CategoryFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
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
  Category,
  Pagination as PaginationMeta,
  StatusFilter,
} from "../types/api";
import { errorMessage } from "../utils/error";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pending, setPending] = useState<{
    category: Category;
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
        const result = await listCategories({
          page,
          limit: DEFAULT_PAGE_SIZE,
          search: search || undefined,
          status,
        });

        if (ignore) return;

        setCategories(result.data);
        setPagination(result.pagination ?? null);
      } catch (error) {
        if (ignore) return;

        setListError(errorMessage(error, "Unable to load categories"));
        setCategories([]);
        setPagination(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [page, search, status, reloadToken]);

  const handleSubmit = async (input: CategoryInput) => {
    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await updateCategory(editing.id, input);
      } else {
        await createCategory(input);
      }

      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (error) {
      setFormError(errorMessage(error, "Unable to save category"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;

    setActionBusy(true);

    try {
      if (pending.action === "delete") {
        await deleteCategory(pending.category.id);
      } else {
        await restoreCategory(pending.category.id);
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

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormError(null);
    setFormOpen(true);
  };

  const isDelete = pending?.action === "delete";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Categories</h1>
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
          Add category
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search category name"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && !categories.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    {search || status !== "all"
                      ? "No categories match these filters."
                      : "No categories yet. Add the first one."}
                  </td>
                </tr>
              )}

              {!loading &&
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="max-w-md px-4 py-3 text-slate-600">
                      <span className="line-clamp-2">
                        {category.description || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          category.is_active
                            ? "bg-primary-tint text-primary-dark"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          aria-label={`Edit ${category.name}`}
                          title="Edit"
                          className="rounded p-1.5 text-slate-500 transition hover:bg-primary-tint hover:text-primary-dark"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>

                        {category.is_active ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ category, action: "delete" })
                            }
                            aria-label={`Delete ${category.name}`}
                            title="Delete"
                            className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ category, action: "restore" })
                            }
                            aria-label={`Restore ${category.name}`}
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

      <CategoryFormModal
        open={formOpen}
        category={editing}
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
        title={isDelete ? "Delete category?" : "Restore category?"}
        message={
          isDelete ? (
            <>
              <b>{pending?.category.name}</b> will be marked inactive. Products
              already in it keep working.
            </>
          ) : (
            <>
              <b>{pending?.category.name}</b> will be active again.
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
