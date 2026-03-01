/**
 * Seeded PRNG for deterministic fake data (no external APIs).
 */

function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

const SEED = 12345;
const rng = seededRandom(SEED);

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return rng() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

// --- Types ---

export type TruckStatus = "Active" | "Idle" | "Service";

export interface Truck {
  id: string;
  driverId: string;
  status: TruckStatus;
  lastPingAt: string;
  speed: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  safetyScore: number;
  mpg: number;
  milesToday: number;
}

export interface Driver {
  id: string;
  name: string;
  truckId: string;
  safetyScore: number;
  mpg: number;
  onTimePercent: number;
  totalPoints: number;
  badges: string[];
}

export interface Ping {
  id: string;
  truckId: string;
  timestamp: string;
  x: number;
  y: number;
  speed: number;
}

export interface Fault {
  id: string;
  truckId: string;
  category: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface DailyMetric {
  date: string;
  miles: number;
}

// --- Data generation ---

const DRIVER_NAMES = [
  "Alex Rivera",
  "Jamie Chen",
  "Morgan Blake",
  "Jordan Hayes",
  "Riley Quinn",
  "Casey Brooks",
  "Drew Morgan",
  "Sam Taylor",
  "Pat Kim",
  "Chris Walsh",
  "Terry Lane",
  "Robin Cross",
];

const FAULT_CATEGORIES = ["Engine", "Brakes", "Tire", "Electrical", "Other"] as const;
const FAULT_MESSAGES: Record<string, string[]> = {
  Engine: ["Low oil pressure", "Check engine light", "Overheating"],
  Brakes: ["Pad wear warning", "ABS fault", "Brake fluid low"],
  Tire: ["Low pressure", "Tire wear alert", "Pressure sensor fault"],
  Electrical: ["Battery low", "Alternator warning", "Fuse blown"],
  Other: ["GPS offline", "Camera fault", "Sensor malfunction"],
};

function genId(prefix: string): string {
  return `${prefix}-${randInt(1000, 9999)}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoMinutesAgo(mins: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
}

// --- Base fake fleet data (used by other pages/components) ---

export function getTrucks(): Truck[] {
  const trucks: Truck[] = [];
  for (let i = 0; i < 12; i++) {
    const status = pick<TruckStatus>(["Active", "Active", "Active", "Idle", "Service"]);
    trucks.push({
      id: `TRK-${1000 + i}`,
      driverId: `DRV-${i}`,
      status,
      lastPingAt: isoMinutesAgo(randInt(1, 30)),
      speed: status === "Active" ? randInt(25, 68) : randInt(0, 5),
      x: randInt(50, 450),
      y: randInt(50, 350),
      lat: randFloat(37.5, 38.2),
      lng: randFloat(-122.5, -121.8),
      safetyScore: randInt(72, 98),
      mpg: randFloat(5.2, 7.8),
      milesToday: randInt(80, 420),
    });
  }
  return trucks;
}

export function getDrivers(): Driver[] {
  const drivers: Driver[] = [];
  for (let i = 0; i < 12; i++) {
    const safetyScore = randInt(72, 98);
    const mpg = randFloat(5.2, 7.8);
    const onTimePercent = randInt(85, 99);
    const badges: string[] = [];
    if (rng() > 0.6) badges.push("Safe Streak");
    if (rng() > 0.7) badges.push("Fuel Saver");
    if (rng() > 0.65) badges.push("On-Time Hero");
    if (rng() > 0.55) badges.push("Smooth Operator");
    if (rng() > 0.8) badges.push("Fix-It Fast");
    const totalPoints = Math.round(
      safetyScore * 0.5 + (mpg / 10) * 20 + onTimePercent * 0.2 - (badges.length === 0 ? 5 : 0)
    );

    drivers.push({
      id: `DRV-${i}`,
      name: DRIVER_NAMES[i] ?? `Driver ${i}`,
      truckId: `TRK-${1000 + i}`,
      safetyScore,
      mpg,
      onTimePercent,
      totalPoints: Math.max(0, totalPoints + randInt(-10, 30)),
      badges: Array.from(new Set(badges)),
    });
  }
  return drivers.sort((a, b) => b.totalPoints - a.totalPoints);
}

export function getPings(truckId: string, limit = 10): Ping[] {
  const pings: Ping[] = [];
  for (let i = 0; i < limit; i++) {
    pings.push({
      id: genId("P"),
      truckId,
      timestamp: isoMinutesAgo(i * 8 + randInt(0, 3)),
      x: randInt(50, 450),
      y: randInt(50, 350),
      speed: randInt(20, 65),
    });
  }
  return pings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getFaults(truckId?: string): Fault[] {
  const faults: Fault[] = [];
  const count = truckId ? randInt(0, 4) : 24;
  for (let i = 0; i < count; i++) {
    const cat = pick(Array.from(FAULT_CATEGORIES));
    const msg = pick(FAULT_MESSAGES[cat] ?? ["Unknown"]);
    const tid = truckId ?? `TRK-${1000 + (i % 12)}`;
    faults.push({
      id: genId("F"),
      truckId: tid,
      category: cat,
      message: msg,
      timestamp: isoMinutesAgo(randInt(10, 600)),
      resolved: rng() > 0.3,
    });
  }
  return faults;
}

export function getDailyMetrics(days = 7): DailyMetric[] {
  const out: DailyMetric[] = [];
  for (let d = days - 1; d >= 0; d--) {
    out.push({
      date: daysAgo(d),
      miles: randInt(1200, 3200),
    });
  }
  return out;
}

export function getSafetyScoreDistribution(): { range: string; count: number }[] {
  const ranges = ["70-75", "76-80", "81-85", "86-90", "91-95", "96-100"];
  return ranges.map((range) => ({
    range,
    count: randInt(1, 5),
  }));
}

export function getFaultsByCategory(): { name: string; value: number }[] {
  return (Array.from(FAULT_CATEGORIES) as string[]).map((name) => ({
    name,
    value: randInt(2, 12),
  }));
}

// Aggregates for dashboard KPIs (derived from same seed)
export function getDashboardKpis() {
  const trucks = getTrucks();
  const active = trucks.filter((t) => t.status === "Active").length;
  const milesToday = trucks.reduce((s, t) => s + t.milesToday, 0);
  const avgMpg = trucks.length > 0 ? trucks.reduce((s, t) => s + t.mpg, 0) / trucks.length : 0;
  const avgSafety =
    trucks.length > 0 ? trucks.reduce((s, t) => s + t.safetyScore, 0) / trucks.length : 0;
  const faults = getFaults();
  const faultAlerts = faults.filter((f) => !f.resolved).length;

  return {
    totalTrucks: trucks.length,
    activeTrucks: active,
    milesToday: Math.round(milesToday),
    avgMpg: Math.round(avgMpg * 10) / 10,
    avgSafetyScore: Math.round(avgSafety * 10) / 10,
    faultAlerts,
  };
}

// Points formula for gamification (DriverChallenge uses this)
export const SCORING_RULES = {
  safetyWeight: 0.5,
  fuelWeight: 0.2,
  onTimeWeight: 0.2,
  faultsPenaltyWeight: 0.1,
};

export const BADGES = [
  { id: "Safe Streak", desc: "7 days no harsh braking" },
  { id: "Fuel Saver", desc: "Top 10% MPG" },
  { id: "On-Time Hero", desc: "Perfect on-time delivery" },
  { id: "Smooth Operator", desc: "Low harsh events" },
  { id: "Fix-It Fast", desc: "Fast fault resolution" },
];

// --- Dashboard filtering dimensions ---

export const VEHICLE_TYPES = [
  "Multipurpose Vehicle",
  "Light-Duty Truck",
  "Heavy-Duty Truck",
  "Medium-Duty Truck",
  "Other",
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const FUEL_MONTHS = ["Oct 2024", "Nov 2024", "Dec 2024"] as const;
export type FuelMonth = (typeof FUEL_MONTHS)[number];

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type DayName = (typeof DAY_NAMES)[number];

// --- Chart data generators ---

export function getIdlingBreakdownByVehicleType(): { name: VehicleType; value: number }[] {
  const raw = VEHICLE_TYPES.map(() => randInt(5, 50));
  const total = raw.reduce((a, b) => a + b, 0);
  return VEHICLE_TYPES.map((name, i) => ({
    name,
    value: Math.round((raw[i] / total) * 1000) / 10,
  }));
}

/**
 * NEW: Weekly mileage, generated for EACH month (so month filtering is valid).
 * Shape includes: month + day + vehicleType.
 */
export function getFleetWeeklyMileageByMonth(): {
  month: FuelMonth;
  day: DayName;
  miles: number;
  vehicleType: VehicleType;
}[] {
  const baseWeek = [881, 786, 920, 1050, 1100, 950, 820];

  return (FUEL_MONTHS as readonly FuelMonth[]).flatMap((month) => {
    const monthMultiplier = month === "Oct 2024" ? 0.92 : month === "Nov 2024" ? 1.02 : 1.0;

    return (DAY_NAMES as readonly DayName[]).flatMap((day, i) => {
      return (VEHICLE_TYPES as readonly VehicleType[]).map((vehicleType) => {
        const typeMultiplier =
          vehicleType === "Heavy-Duty Truck"
            ? 1.25
            : vehicleType === "Medium-Duty Truck"
            ? 1.1
            : vehicleType === "Light-Duty Truck"
            ? 0.95
            : vehicleType === "Multipurpose Vehicle"
            ? 0.8
            : 0.6;

        return {
          month,
          day,
          vehicleType,
          miles: Math.round(
            (baseWeek[i] ?? 900) * monthMultiplier * typeMultiplier * randFloat(0.8, 1.05)
          ),
        };
      });
    });
  });
}

/**
 * Fuel: vehicleType + month
 */
export function getLast3MonthsFuelTrend(): {
  month: FuelMonth;
  fuelBurnt: number;
  trend: number;
  vehicleType: VehicleType;
}[] {
  return (FUEL_MONTHS as readonly FuelMonth[]).flatMap((month) => {
    return (VEHICLE_TYPES as readonly VehicleType[]).map((vehicleType) => {
      const base =
        vehicleType === "Heavy-Duty Truck"
          ? randInt(1100, 1800)
          : vehicleType === "Medium-Duty Truck"
          ? randInt(950, 1600)
          : vehicleType === "Light-Duty Truck"
          ? randInt(800, 1400)
          : vehicleType === "Multipurpose Vehicle"
          ? randInt(650, 1200)
          : randInt(500, 1000);

      const drift = randInt(-120, 120);

      return {
        month,
        vehicleType,
        fuelBurnt: base,
        trend: base + drift,
      };
    });
  });
}

/**
 * Aggressive: vehicleType + month + day
 */
export function getTop5AggressiveDrivers(): {
  driver: string;
  harshBraking: number;
  harshCornering: number;
  hardAcceleration: number;
  vehicleType: VehicleType;
  month: FuelMonth;
  day: DayName;
}[] {
  const driversByType: Record<VehicleType, string[]> = {
    "Multipurpose Vehicle": ["Driver 11", "Driver 6", "Driver 1", "Driver 21", "Driver 18"],
    "Light-Duty Truck": ["Driver 3", "Driver 7", "Driver 12", "Driver 9", "Driver 2"],
    "Heavy-Duty Truck": ["Driver 14", "Driver 5", "Driver 8", "Driver 16", "Driver 20"],
    "Medium-Duty Truck": ["Driver 4", "Driver 10", "Driver 13", "Driver 15", "Driver 17"],
    "Other": ["Driver 19", "Driver 22", "Driver 23", "Driver 24", "Driver 25"],
  };

  const rows: {
    driver: string;
    harshBraking: number;
    harshCornering: number;
    hardAcceleration: number;
    vehicleType: VehicleType;
    month: FuelMonth;
    day: DayName;
  }[] = [];

  for (const month of FUEL_MONTHS as readonly FuelMonth[]) {
    for (const day of DAY_NAMES as readonly DayName[]) {
      for (const vt of VEHICLE_TYPES as readonly VehicleType[]) {
        const bump =
          vt === "Heavy-Duty Truck"
            ? 1.2
            : vt === "Medium-Duty Truck"
            ? 1.1
            : vt === "Light-Duty Truck"
            ? 0.95
            : vt === "Multipurpose Vehicle"
            ? 0.9
            : 0.85;

        const monthShift = month === "Nov 2024" ? 1.05 : month === "Dec 2024" ? 0.95 : 1.0;
        const dayShift = day === "Fri" || day === "Sat" ? 1.06 : day === "Sun" ? 0.94 : 1.0;

        for (const driver of driversByType[vt]) {
          rows.push({
            driver,
            month,
            day,
            vehicleType: vt,
            harshBraking: Math.round(randInt(10, 45) * bump * monthShift * dayShift),
            harshCornering: Math.round(randInt(5, 25) * bump * monthShift * dayShift),
            hardAcceleration: Math.round(randInt(8, 35) * bump * monthShift * dayShift),
          });
        }
      }
    }
  }

  return rows;
}

/**
 * Seatbelt: vehicleType + month + day
 */
export function getTop5SeatbeltViolations(): {
  driver: string;
  count: number;
  vehicleType: VehicleType;
  month: FuelMonth;
  day: DayName;
}[] {
  const driversByType: Record<VehicleType, string[]> = {
    "Multipurpose Vehicle": ["Driver 31", "Driver 32", "Driver 33", "Driver 34", "Driver 35"],
    "Light-Duty Truck": ["Driver 3", "Driver 7", "Driver 12", "Driver 9", "Driver 2"],
    "Heavy-Duty Truck": ["Driver 36", "Driver 37", "Driver 38", "Driver 39", "Driver 40"],
    "Medium-Duty Truck": ["Driver 41", "Driver 42", "Driver 43", "Driver 44", "Driver 45"],
    "Other": ["Driver 46", "Driver 47", "Driver 48", "Driver 49", "Driver 50"],
  };

  const rows: {
    driver: string;
    count: number;
    vehicleType: VehicleType;
    month: FuelMonth;
    day: DayName;
  }[] = [];

  for (const month of FUEL_MONTHS as readonly FuelMonth[]) {
    for (const day of DAY_NAMES as readonly DayName[]) {
      for (const vt of VEHICLE_TYPES as readonly VehicleType[]) {
        const bump =
          vt === "Heavy-Duty Truck"
            ? 1.25
            : vt === "Medium-Duty Truck"
            ? 1.1
            : vt === "Light-Duty Truck"
            ? 1.0
            : vt === "Multipurpose Vehicle"
            ? 0.9
            : 0.85;

        const monthShift = month === "Nov 2024" ? 1.1 : month === "Dec 2024" ? 0.9 : 1.0;
        const dayShift = day === "Fri" || day === "Sat" ? 1.08 : day === "Sun" ? 0.92 : 1.0;

        for (const driver of driversByType[vt]) {
          rows.push({
            driver,
            month,
            day,
            vehicleType: vt,
            count: Math.round(randInt(3, 18) * bump * monthShift * dayShift),
          });
        }
      }
    }
  }

  return rows;
}