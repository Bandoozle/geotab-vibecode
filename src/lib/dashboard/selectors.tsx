import type { DashboardFilters } from "@/components/dashboard/types";
import type { DriverReadiness } from "@/lib/wellnessData";
import type { VehicleType, FuelMonth, DayName } from "@/lib/fakeData";

export function applyOpFilters<T extends Record<string, any>>(
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

export function applyReadinessFilters(rows: DriverReadiness[], filters: DashboardFilters) {
  let out = rows;

  if (filters.vehicleType) {
    out = out.filter((r) => ((r.truck as any)?.vehicleType ?? null) === filters.vehicleType);
  }
  if (filters.risk !== "all") {
    out = out.filter((r) => r.riskLevel === filters.risk);
  }

  return out;
}

export function countsByRisk(readiness: DriverReadiness[]) {
  const green = readiness.filter((r) => r.riskLevel === "green").length;
  const yellow = readiness.filter((r) => r.riskLevel === "yellow").length;
  const red = readiness.filter((r) => r.riskLevel === "red").length;
  return { green, yellow, red };
}

export function riskPieData(readiness: DriverReadiness[]) {
  const c = countsByRisk(readiness);
  return [
    { name: "Ready", key: "green", value: c.green },
    { name: "Caution", key: "yellow", value: c.yellow },
    { name: "At Risk", key: "red", value: c.red },
  ];
}

// ✅ fixes your MapIterator downlevelIteration error
export function triggerCounts(redDrivers: DriverReadiness[]) {
  const m = new Map<string, number>();
  for (const r of redDrivers) {
    for (const t of r.triggers ?? []) {
      m.set(t, (m.get(t) ?? 0) + 1);
    }
  }
  return Array.from(m.entries()).map(([key, value]) => ({ key, value }));
}