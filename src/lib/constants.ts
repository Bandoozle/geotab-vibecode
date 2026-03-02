// src/lib/constants.ts
export const VEHICLE_TYPES = ["Van", "Box Truck", "Semi", "Pickup"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const FUEL_MONTHS = ["Jan", "Feb", "Mar"] as const;
export type FuelMonth = (typeof FUEL_MONTHS)[number];

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayName = (typeof DAY_NAMES)[number];