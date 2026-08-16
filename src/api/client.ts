import type { ApiEnvelope, Pagination } from "../types/api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const TOKEN_KEY = "auth_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

export interface ApiResult<T> {
  data: T;
  message: string;
  pagination?: Pagination;
}

type Query = Record<string, string | number | boolean | undefined | null>;

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(BASE_URL + path, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

const request = async <T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Query } = {}
): Promise<ApiResult<T>> => {
  const token = getToken();

  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new ApiError(
      navigator.onLine
        ? "Cannot reach the server. Please make sure it is running and try again."
        : "You are offline. Check your internet connection and try again.",
      0
    );
  }

  if (response.status === 401) {
    clearToken();
    onUnauthorized?.();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  let envelope: ApiEnvelope<T>;

  try {
    envelope = await response.json();
  } catch {
    throw new ApiError(
      `Server returned ${response.status} with no readable body`,
      response.status
    );
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(
      envelope.message || `Request failed (${response.status})`,
      response.status
    );
  }

  return {
    data: envelope.data as T,
    message: envelope.message,
    pagination: envelope.pagination,
  };
};

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { body }),
  del: <T>(path: string) => request<T>("DELETE", path),
};
