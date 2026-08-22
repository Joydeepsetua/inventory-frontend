import { api } from "./client";
import type { DashboardSummary } from "../types/api";

export interface DashboardSummaryQuery {
  days?: number;
  tz_offset?: number;
}

export const getDashboardSummary = (query: DashboardSummaryQuery = {}) =>
  api.get<DashboardSummary>("/dashboard/summary", {
    tz_offset: new Date().getTimezoneOffset(),
    ...query,
  });
