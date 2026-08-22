
export interface Pagination {
  total: number;
  current_page: number;
  total_pages: number;
  limit: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: Pagination;
}

export type Role = "OWNER" | "SALESMAN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  user: User;
  token: {
    access_token: string;
    refresh_token: string;
    token_expiry: string;
    refresh_token_expiry: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  brand: string | null;
  is_active: boolean;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_active: boolean;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export type CartStatus = "ACTIVE" | "CONVERTED" | "ABANDONED";

export interface CartItem {
  id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  status: CartStatus;
  customer: Customer | null;
  variant?: Variant;
}

export interface CartSummary {
  item_count: number;
  total_quantity: number;
  subtotal: string;
}

export interface Cart {
  items: CartItem[];
  summary: CartSummary;
}

export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "UPI";

export type SettablePaymentStatus = Exclude<PaymentStatus, "CANCELLED">;

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  created_by: string;
  subtotal: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  notes: string | null;
  invoice_date: string;
  customer?: Customer;
  creator?: User;
  items?: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  today_sales: string;
  today_count: number;
  pending_invoice_count: number;
  customer_count: number;
}

export interface PaymentStatusCount {
  status: PaymentStatus;
  count: number;
}

export interface SalesTrendPoint {
  date: string;
  total: string;
  count: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  payment_status: PaymentStatusCount[];
  sales_trend: SalesTrendPoint[];
}

export type StatusFilter = "active" | "inactive" | "all";

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: StatusFilter;
}
