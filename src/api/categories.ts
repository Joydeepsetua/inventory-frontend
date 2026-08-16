import { api } from "./client";
import type { Category, ListQuery } from "../types/api";

export interface CategoryInput {
  name: string;
  description?: string | null;
}

export const listCategories = (query: ListQuery = {}) =>
  api.get<Category[]>("/product-categories", { ...query });

export const getCategory = (id: string) =>
  api.get<Category>(`/product-categories/${id}`);

export const createCategory = (input: CategoryInput) =>
  api.post<Category>("/product-categories", input);

export const updateCategory = (id: string, input: Partial<CategoryInput>) =>
  api.put<Category>(`/product-categories/${id}`, input);

export const deleteCategory = (id: string) =>
  api.del<Category>(`/product-categories/${id}`);

export const restoreCategory = (id: string) =>
  api.patch<Category>(`/product-categories/${id}/restore`);
