import { api } from "./client";
import type { LoginResponse } from "../types/api";

export const login = (email: string, password: string) =>
  api.post<LoginResponse>("/auth/login", { email, password });
