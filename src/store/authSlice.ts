import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import * as authApi from "../api/auth";
import { clearToken, getToken, saveToken } from "../api/client";
import type { User } from "../types/api";

const USER_KEY = "auth_user";

const readStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: readStoredUser(),
  token: getToken(),
  loading: false,
  error: null,
};

export const login = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(email, password);

    return { user: data.user, token: data.token.access_token };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Login failed"
    );
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Also called by the client's 401 handler, not just the logout button.
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;

      clearToken();
      localStorage.removeItem(USER_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;

        saveToken(action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
