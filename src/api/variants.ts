import { api } from "./client";
import type { ListQuery, Variant } from "../types/api";

export interface VariantInput {
  product_id: string;
  sku: string;
  name: string;
  price?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
}

export interface VariantListQuery extends ListQuery {
  product_id?: string;
  category_id?: string;
  low_stock?: boolean;
}

export const listVariants = (query: VariantListQuery = {}) =>
  api.get<Variant[]>("/product-variants", { ...query });

export const getVariant = (id: string) =>
  api.get<Variant>(`/product-variants/${id}`);

export const createVariant = (input: VariantInput) =>
  api.post<Variant>("/product-variants", input);

export const updateVariant = (id: string, input: Partial<VariantInput>) =>
  api.put<Variant>(`/product-variants/${id}`, input);

export const deleteVariant = (id: string) =>
  api.del<Variant>(`/product-variants/${id}`);

export const restoreVariant = (id: string) =>
  api.patch<Variant>(`/product-variants/${id}/restore`);
