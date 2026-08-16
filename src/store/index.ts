import { configureStore } from "@reduxjs/toolkit";

import { setUnauthorizedHandler } from "../api/client";
import authReducer, { logout } from "./authSlice";
import cartReducer from "./cartSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
});


setUnauthorizedHandler(() => {
  store.dispatch(logout());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
