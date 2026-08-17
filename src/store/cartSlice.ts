import {
  createAsyncThunk,
  createSlice,
  isFulfilled,
  isPending,
  isRejected,
} from "@reduxjs/toolkit";

import * as cartApi from "../api/cart";
import type { Cart } from "../types/api";

const emptyCart: Cart = {
  items: [],
  summary: { item_count: 0, total_quantity: 0, subtotal: "0.00" },
};

interface CartState {
  cart: Cart;
  loading: boolean;
  pending: Record<string, boolean>;
  error: string | null;
}

const initialState: CartState = {
  cart: emptyCart,
  loading: false,
  pending: {},
  error: null,
};

const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const busyKey = (arg: unknown): string | null => {
  if (typeof arg === "string") return arg;

  if (arg && typeof arg === "object") {
    const { variantId, itemId } = arg as {
      variantId?: string;
      itemId?: string;
    };

    return variantId ?? itemId ?? null;
  }

  return null;
};

export const fetchCart = createAsyncThunk<Cart, void, { rejectValue: string }>(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await cartApi.getCart();
      return data;
    } catch (error) {
      return rejectWithValue(message(error, "Unable to load cart"));
    }
  }
);

export const addItem = createAsyncThunk<
  Cart,
  { variantId: string; quantity?: number },
  { rejectValue: string }
>("cart/addItem", async ({ variantId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.addCartItem(variantId, quantity);
    return data;
  } catch (error) {
    return rejectWithValue(message(error, "Unable to add item"));
  }
});

export const updateItem = createAsyncThunk<
  Cart,
  { itemId: string; quantity: number },
  { rejectValue: string }
>("cart/updateItem", async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.updateCartItem(itemId, quantity);
    return data;
  } catch (error) {
    return rejectWithValue(message(error, "Unable to update item"));
  }
});

export const removeItem = createAsyncThunk<
  Cart,
  string,
  { rejectValue: string }
>("cart/removeItem", async (itemId, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.removeCartItem(itemId);
    return data;
  } catch (error) {
    return rejectWithValue(message(error, "Unable to remove item"));
  }
});

export const emptyTheCart = createAsyncThunk<
  Cart,
  void,
  { rejectValue: string }
>("cart/clear", async (_, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.clearCart();
    return data;
  } catch (error) {
    return rejectWithValue(message(error, "Unable to clear cart"));
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCart(state) {
      state.cart = emptyCart;
      state.pending = {};
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    const thunks = [
      fetchCart,
      addItem,
      updateItem,
      removeItem,
      emptyTheCart,
    ] as const;

    builder
      .addMatcher(isPending(...thunks), (state, action) => {
        const key = busyKey(action.meta.arg);

        if (key) state.pending[key] = true;
        else state.loading = true;

        state.error = null;
      })
      .addMatcher(isFulfilled(...thunks), (state, action) => {
        const key = busyKey(action.meta.arg);

        if (key) delete state.pending[key];
        else state.loading = false;

        state.cart = action.payload;
      })
      .addMatcher(isRejected(...thunks), (state, action) => {
        const key = busyKey(action.meta.arg);

        if (key) delete state.pending[key];
        else state.loading = false;

        state.error = action.payload ?? "Cart request failed";
      });
  },
});

export const { resetCart } = cartSlice.actions;

export default cartSlice.reducer;
