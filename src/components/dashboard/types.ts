import type { VehicleType, FuelMonth, DayName } from "@/lib/fakeData";
import type { RiskLevel } from "@/lib/wellnessData";

export type RiskFilter = RiskLevel | "all";

export type DashboardFilters = {
  vehicleType: VehicleType | null;
  month: FuelMonth | null;
  day: DayName | null;
  risk: RiskLevel | "all";
};