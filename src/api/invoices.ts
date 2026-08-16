import { api } from "./client";
import type {
  Invoice,
  PaymentMethod,
  PaymentStatus,
  SettablePaymentStatus,
} from "../types/api";


export interface CreateInvoiceInput {
  customer_id: string;
  discount_amount?: number;
  tax_rate?: number;
  payment_status?: SettablePaymentStatus;
  payment_method?: PaymentMethod | null;
  notes?: string | null;
}

export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  payment_status?: PaymentStatus;
  customer_id?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export const listInvoices = (query: InvoiceListQuery = {}) =>
  api.get<Invoice[]>("/invoices", { ...query });

export const getInvoice = (id: string) => api.get<Invoice>(`/invoices/${id}`);

export const createInvoice = (input: CreateInvoiceInput) =>
  api.post<Invoice>("/invoices", input);

export const updateInvoicePayment = (
  id: string,
  payment_status: SettablePaymentStatus,
  payment_method?: PaymentMethod | null
) => api.patch<Invoice>(`/invoices/${id}/payment`, {
  payment_status,
  payment_method,
});

export const cancelInvoice = (id: string) =>
  api.patch<Invoice>(`/invoices/${id}/cancel`);
