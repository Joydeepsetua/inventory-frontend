import { api } from "./client";
import type { Customer, ListQuery } from "../types/api";

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gst_number?: string | null;
}

export const listCustomers = (query: ListQuery = {}) =>
  api.get<Customer[]>("/customers", { ...query });

export const getCustomer = (id: string) => api.get<Customer>(`/customers/${id}`);

export const createCustomer = (input: CustomerInput) =>
  api.post<Customer>("/customers", input);

export const updateCustomer = (id: string, input: Partial<CustomerInput>) =>
  api.put<Customer>(`/customers/${id}`, input);

export const deleteCustomer = (id: string) =>
  api.del<Customer>(`/customers/${id}`);

export const restoreCustomer = (id: string) =>
  api.patch<Customer>(`/customers/${id}/restore`);
