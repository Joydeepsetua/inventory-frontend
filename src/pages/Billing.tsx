import { useEffect, useMemo, useState } from "react";

import { listCategories } from "../api/categories";
import { listVariants } from "../api/variants";
import CheckoutDrawer from "../components/CheckoutDrawer";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  CartIcon,
  ImageIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../icons";
import {
  addItem,
  emptyTheCart,
  fetchCart,
  removeItem,
  updateItem,
} from "../store/cartSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { CartItem, Category, Variant } from "../types/api";
import { formatMoney } from "../utils/format";

const VARIANT_LIMIT = 100;

export default function Billing() {
  const dispatch = useAppDispatch();
  const {
    cart,
    loading: cartLoading,
    pending,
    error: cartError,
  } = useAppSelector((state) => state.cart);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        const result = await listCategories({ status: "active", limit: 100 });
        if (!ignore) setCategories(result.data);
      } catch {
        if (!ignore) setCategories([]);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setListError(null);

      try {
        const result = await listVariants({
          status: "active",
          limit: VARIANT_LIMIT,
          search: search || undefined,
          category_id: categoryId || undefined,
        });

        if (ignore) return;

        setVariants(result.data);
      } catch {
        if (ignore) return;
        setListError("Unable to load products");
        setVariants([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [search, categoryId, reloadToken]);

  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      { name: string; category: string | null; items: Variant[] }
    >();

    variants.forEach((variant) => {
      const key = variant.product_id;

      if (!groups.has(key)) {
        groups.set(key, {
          name: variant.product?.name ?? "Unknown product",
          category: variant.product?.category?.name ?? null,
          items: [],
        });
      }

      groups.get(key)!.items.push(variant);
    });

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [variants]);

  const inCart = useMemo(() => {
    const map = new Map<string, CartItem>();
    cart.items.forEach((item) => map.set(item.variant_id, item));
    return map;
  }, [cart.items]);

  const isBusy = (key: string) => pending[key] === true;

  const tabClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition ${
      active
        ? "bg-primary text-white"
        : "border border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary-dark"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <h1 className="text-xl font-semibold">Billing</h1>
            <p className="text-sm text-slate-500">
              Pick products, then generate the invoice
            </p>
          </div>

          <div className="relative mb-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search SKU or variant name"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryId("")}
              className={tabClass(!categoryId)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={tabClass(categoryId === category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {listError && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {listError}
            </p>
          )}

          {loading && (
            <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Loading products…
            </p>
          )}

          {!loading && !grouped.length && (
            <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No sellable products here.
            </p>
          )}

          <div className="space-y-5">
            {!loading &&
              grouped.map((group, groupIndex) => (
                <section
                  key={group.name}
                  className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <span
                    aria-hidden="true"
                    style={{ animationDelay: `${groupIndex * 70}ms` }}
                    className="animate-grow-down absolute inset-y-0 left-0 w-1 bg-primary"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary-tint bg-primary-tint px-4 py-2.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-primary-dark">
                        {group.name}
                      </h2>
                      {group.category && (
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-primary-dark">
                          {group.category}
                        </span>
                      )}
                    </div>

                    <span className="shrink-0 text-xs text-primary-dark/70">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "SKU" : "SKUs"}
                    </span>
                  </div>

                  <div className="grid gap-3 p-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((variant) => {
                      const outOfStock = variant.stock_quantity === 0;
                      const cartRow = inCart.get(variant.id);
                      const added = cartRow?.quantity ?? 0;
                      const atStockLimit =
                        !outOfStock && added >= variant.stock_quantity;
                      const cardBusy =
                        isBusy(variant.id) ||
                        (cartRow ? isBusy(cartRow.id) : false);

                      return (
                        <div
                          key={variant.id}
                          className={`flex gap-3 rounded-lg border p-3 transition ${
                            added
                              ? "border-primary bg-primary-tint/40"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-lg ${
                              added
                                ? "bg-primary-tint text-primary"
                                : "bg-slate-100 text-slate-300"
                            }`}
                          >
                            <ImageIcon className="h-8 w-8" />
                            {added > 0 && (
                              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-white">
                                {added}
                              </span>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <p className="min-w-0 truncate font-mono text-[11px] text-slate-400">
                                {variant.sku}
                              </p>
                              <span
                                className={`shrink-0 text-xs tabular-nums ${
                                  outOfStock
                                    ? "text-red-600"
                                    : variant.is_low_stock
                                      ? "text-amber-600"
                                      : "text-slate-500"
                                }`}
                              >
                                {outOfStock
                                  ? "Out of stock"
                                  : `${variant.stock_quantity} left`}
                              </span>
                            </div>

                            <p className="truncate text-sm font-medium">
                              {variant.name}
                            </p>

                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                              <span className="font-semibold tabular-nums">
                                {formatMoney(variant.price)}
                              </span>

                              <button
                                type="button"
                                disabled={
                                  outOfStock ||
                                  atStockLimit ||
                                  cardBusy ||
                                  cartLoading
                                }
                                title={
                                  atStockLimit
                                    ? "Cart already has all available stock"
                                    : undefined
                                }
                                onClick={() =>
                                  dispatch(addItem({ variantId: variant.id }))
                                }
                                className="flex shrink-0 items-center gap-1 rounded-lg border border-primary px-2.5 py-1 text-xs font-medium text-primary-dark transition hover:bg-primary hover:text-white disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent"
                              >
                                {atStockLimit ? (
                                  "Max"
                                ) : (
                                  <>
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    Add
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
          </div>
        </div>

        <aside className="w-full shrink-0 md:sticky md:top-[85px] md:h-[calc(100vh-109px)] md:w-72 md:self-start lg:w-80">
          <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <CartIcon className="h-5 w-5 text-primary" />
                Cart
              </h2>
              {!!cart.items.length && (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-slate-500 transition hover:text-red-600"
                >
                  Clear
                </button>
              )}
            </div>

            {cartError && (
              <p className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {cartError}
              </p>
            )}

            {!cart.items.length ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <CartIcon className="h-7 w-7" />
                </span>
                <p className="text-sm font-medium text-slate-600">
                  Cart is empty
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Add a product to start billing.
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto max-md:max-h-[50vh]">
                {cart.items.map((item) => {
                  const rowBusy = isBusy(item.id) || isBusy(item.variant_id);
                  const rowStock = item.variant?.stock_quantity;
                  const atStockLimit =
                    rowStock !== undefined && item.quantity >= rowStock;

                  return (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.product_name}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            {item.sku}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={rowBusy || cartLoading}
                          onClick={() => dispatch(removeItem(item.id))}
                          aria-label={`Remove ${item.sku}`}
                          className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-lg border border-slate-300">
                          <button
                            type="button"
                            disabled={
                              item.quantity <= 1 || rowBusy || cartLoading
                            }
                            onClick={() =>
                              dispatch(
                                updateItem({
                                  itemId: item.id,
                                  quantity: item.quantity - 1,
                                })
                              )
                            }
                            aria-label="Decrease quantity"
                            className="px-2 py-1 text-slate-500 transition hover:text-primary-dark disabled:opacity-30"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={atStockLimit || rowBusy || cartLoading}
                            title={
                              atStockLimit
                                ? `Only ${rowStock} in stock`
                                : undefined
                            }
                            onClick={() =>
                              dispatch(
                                updateItem({
                                  itemId: item.id,
                                  quantity: item.quantity + 1,
                                })
                              )
                            }
                            aria-label="Increase quantity"
                            className="px-2 py-1 text-slate-500 transition hover:text-primary-dark disabled:opacity-30"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <span className="text-sm font-medium tabular-nums">
                          {formatMoney(item.line_total)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="shrink-0 rounded-b-lg border-t border-slate-200 bg-white px-4 py-3 max-md:sticky max-md:bottom-0 max-md:shadow-[0_-6px_16px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Subtotal</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatMoney(cart.summary.subtotal)}
                </span>
              </div>

              <button
                type="button"
                disabled={!cart.items.length}
                onClick={() => setCheckoutOpen(true)}
                className="w-full rounded-lg bg-primary py-2.5 text-sm text-white transition hover:bg-primary-dark disabled:opacity-40"
              >
                Proceed to checkout
              </button>
            </div>
          </div>
        </aside>
      </div>

      {checkoutOpen && (
        <CheckoutDrawer
          open
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onInvoiced={() => {
            dispatch(fetchCart());
            setReloadToken((current) => current + 1);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        icon={TrashIcon}
        title="Clear cart?"
        message="Every item will be removed. Nothing is billed."
        confirmLabel="Clear"
        loadingLabel="Clearing…"
        loading={cartLoading}
        onConfirm={async () => {
          await dispatch(emptyTheCart());
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
