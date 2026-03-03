import type { DriverReadiness } from "@/lib/wellnessData";
import type { DashboardFilters } from "./types";

export function applyGenericFilters<T extends Record<string, any>>(
  rows: T[],
  filters: DashboardFilters
): T[] {
  let out = rows;

  if (filters.vehicleType && out.length && "vehicleType" in out[0]) {
    out = out.filter((r) => r.vehicleType === filters.vehicleType);
  }
  if (filters.month && out.length && "month" in out[0]) {
    out = out.filter((r) => r.month === filters.month);
  }
  if (filters.day && out.length && "day" in out[0]) {
    out = out.filter((r) => r.day === filters.day);
  }

  return out;
}

export function matchesReadinessFilters(
  r: DriverReadiness,
  filters: DashboardFilters
): boolean {
  if (filters.risk !== "all" && r.riskLevel !== filters.risk) return false;
  const vt = (r.driver as any)?.vehicleType ?? (r.driver as any)?.vehicle ?? null;
  if (filters.vehicleType && vt && vt !== filters.vehicleType) return false;
  return true;
}

export function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function avg(nums: number[]) {
  return nums.length ? sum(nums) / nums.length : 0;
}

// object-based groupBy to avoid TS downlevelIteration issues
export function groupSum(
  rows: any[],
  key: string,
  valueKey: string
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = String(r?.[key] ?? "");
    if (!k) continue;
    out[k] = (out[k] ?? 0) + (Number(r?.[valueKey] ?? 0) || 0);
  }
  return out;
}
