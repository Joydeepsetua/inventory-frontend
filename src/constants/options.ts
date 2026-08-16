import type { SelectOption } from "../components/Select";
import type {
  PaymentMethod,
  PaymentStatus,
  SettablePaymentStatus,
  StatusFilter,
} from "../types/api";

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS: SelectOption<string>[] = [
  { value: "10", label: "10 per page" },
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
];

export const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const PAYMENT_STATUS_OPTIONS: SelectOption<PaymentStatus>[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const SETTABLE_PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_OPTIONS.filter(
  (option) => option.value !== "CANCELLED"
) as SelectOption<SettablePaymentStatus>[];

export type PaymentStatusFilter = PaymentStatus | "";

export const PAYMENT_STATUS_FILTER_OPTIONS: SelectOption<PaymentStatusFilter>[] =
  [{ value: "", label: "All" }, ...PAYMENT_STATUS_OPTIONS];

export const PAYMENT_METHOD_OPTIONS: SelectOption<PaymentMethod>[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
];

export type PaymentMethodValue = PaymentMethod | "";

export const PAYMENT_METHOD_FIELD_OPTIONS: SelectOption<PaymentMethodValue>[] =
  [{ value: "", label: "Not set" }, ...PAYMENT_METHOD_OPTIONS];

export type StockFilter = "all" | "low" | "healthy";

export const STOCK_OPTIONS: SelectOption<StockFilter>[] = [
  { value: "all", label: "All stock" },
  { value: "low", label: "Low stock" },
  { value: "healthy", label: "In stock" },
];

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-primary-tint text-primary-dark",
  PARTIAL: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};
