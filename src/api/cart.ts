import { api } from "./client";
import type { Cart } from "../types/api";

export const getCart = () => api.get<Cart>("/cart");

export const addCartItem = (variant_id: string, quantity = 1) =>
  api.post<Cart>("/cart/items", { variant_id, quantity });

export const updateCartItem = (itemId: string, quantity: number) =>
  api.put<Cart>(`/cart/items/${itemId}`, { quantity });

export const removeCartItem = (itemId: string) =>
  api.del<Cart>(`/cart/items/${itemId}`);

export const clearCart = () => api.del<Cart>("/cart");
