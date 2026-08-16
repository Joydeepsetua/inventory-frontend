import { useEffect, useState } from "react";

import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  restoreCustomer,
  updateCustomer,
} from "../api/customers";
import type { CustomerInput } from "../api/customers";
import ConfirmDialog from "../components/ConfirmDialog";
import CustomerFormModal from "../components/CustomerFormModal";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import type { SelectOption } from "../components/Select";
import {
  EditIcon,
  PlusIcon,
  RestoreIcon,
  SearchIcon,
  TrashIcon,
} from "../icons";
import type {
  Customer,
  Pagination as PaginationMeta,
  StatusFilter,
} from "../types/api";

const LIMIT = 10;

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pending, setPending] = useState<{
    customer: Customer;
    action: "delete" | "restore";
  } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((current) => current + 1);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setListError(null);

      try {
        const result = await listCustomers({
          page,
          limit: LIMIT,
          search: search || undefined,
          status,
        });

        if (ignore) return;

        setCustomers(result.data);
        setPagination(result.pagination ?? null);
      } catch (error) {
        if (ignore) return;

        setListError(errorMessage(error, "Unable to load customers"));
        setCustomers([]);
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

  const handleSubmit = async (input: CustomerInput) => {
    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await updateCustomer(editing.id, input);
      } else {
        await createCustomer(input);
      }

      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (error) {
      setFormError(errorMessage(error, "Unable to save customer"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;

    setActionBusy(true);

    try {
      if (pending.action === "delete") {
        await deleteCustomer(pending.customer.id);
      } else {
        await restoreCustomer(pending.customer.id);
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

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFormError(null);
    setFormOpen(true);
  };

  const isDelete = pending?.action === "delete";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="text-sm text-slate-500">
            {pagination ? `${pagination.total} total` : " "}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary-dark"
        >
          <PlusIcon className="h-4 w-4" />
          Add customer
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, phone or email"
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
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && !customers.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {search || status !== "all"
                      ? "No customers match these filters."
                      : "No customers yet. Add the first one."}
                  </td>
                </tr>
              )}

              {!loading &&
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {customer.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {customer.city ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          customer.is_active
                            ? "bg-primary-tint text-primary-dark"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          aria-label={`Edit ${customer.name}`}
                          title="Edit"
                          className="rounded p-1.5 text-slate-500 transition hover:bg-primary-tint hover:text-primary-dark"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>

                        {customer.is_active ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ customer, action: "delete" })
                            }
                            aria-label={`Delete ${customer.name}`}
                            title="Delete"
                            className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ customer, action: "restore" })
                            }
                            aria-label={`Restore ${customer.name}`}
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

      <CustomerFormModal
        open={formOpen}
        customer={editing}
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
        title={isDelete ? "Delete customer?" : "Restore customer?"}
        message={
          isDelete ? (
            <>
              <b>{pending?.customer.name}</b> will be marked inactive. Past
              invoices keep working.
            </>
          ) : (
            <>
              <b>{pending?.customer.name}</b> will be active again and can be
              billed.
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
