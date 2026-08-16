import { api } from "./client";
import type { ListQuery, Product } from "../types/api";

export interface ProductInput {
  category_id: string;
  name: string;
  description?: string | null;
  brand?: string | null;
}

export interface ProductListQuery extends ListQuery {
  category_id?: string;
}

export const listProducts = (query: ProductListQuery = {}) =>
  api.get<Product[]>("/products", { ...query });

export const getProduct = (id: string) => api.get<Product>(`/products/${id}`);

export const createProduct = (input: ProductInput) =>
  api.post<Product>("/products", input);

export const updateProduct = (id: string, input: Partial<ProductInput>) =>
  api.put<Product>(`/products/${id}`, input);

export const deleteProduct = (id: string) => api.del<Product>(`/products/${id}`);

export const restoreProduct = (id: string) =>
  api.patch<Product>(`/products/${id}/restore`);
