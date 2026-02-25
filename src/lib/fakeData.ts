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
  "Alex Rivera", "Jamie Chen", "Morgan Blake", "Jordan Hayes",
  "Riley Quinn", "Casey Brooks", "Drew Morgan", "Sam Taylor",
  "Pat Kim", "Chris Walsh", "Terry Lane", "Robin Cross",
];

const FAULT_CATEGORIES = ["Engine", "Brakes", "Tire", "Electrical", "Other"];
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
  return pings.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getFaults(truckId?: string): Fault[] {
  const faults: Fault[] = [];
  const count = truckId ? randInt(0, 4) : 24;
  for (let i = 0; i < count; i++) {
    const cat = pick(FAULT_CATEGORIES);
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
  return FAULT_CATEGORIES.map((name) => ({
    name,
    value: randInt(2, 12),
  }));
}

// Aggregates for dashboard KPIs (derived from same seed)
export function getDashboardKpis() {
  const trucks = getTrucks();
  const active = trucks.filter((t) => t.status === "Active").length;
  const milesToday = trucks.reduce((s, t) => s + t.milesToday, 0);
  const avgMpg =
    trucks.length > 0
      ? trucks.reduce((s, t) => s + t.mpg, 0) / trucks.length
      : 0;
  const avgSafety =
    trucks.length > 0
      ? trucks.reduce((s, t) => s + t.safetyScore, 0) / trucks.length
      : 0;
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

// Points formula for gamification (shown in UI)
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

// --- GEOTAB-style dashboard data ---

const VEHICLE_TYPES = [
  "Multipurpose Vehicle",
  "Light-Duty Truck",
  "Heavy-Duty Truck",
  "Medium-Duty Truck",
  "Other",
];

export function getIdlingBreakdownByVehicleType(): { name: string; value: number }[] {
  const raw = VEHICLE_TYPES.map(() => randInt(5, 50));
  const total = raw.reduce((a, b) => a + b, 0);
  return VEHICLE_TYPES.map((name, i) => ({
    name,
    value: Math.round((raw[i] / total) * 1000) / 10,
  }));
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getFleetMileageLastWeek(): { day: string; miles: number }[] {
  return DAY_NAMES.map((day, i) => ({
    day,
    miles: [881, 786, 920, 1050, 1100, 950, 820][i] ?? randInt(700, 1200),
  }));
}

export function getLast3MonthsFuelTrend(): { month: string; fuelBurnt: number; trend: number }[] {
  const months = ["Oct 2024", "Nov 2024", "Dec 2024"];
  return months.map((month, i) => {
    const fuel = randInt(800, 1500);
    return {
      month,
      fuelBurnt: fuel,
      trend: fuel + randInt(-100, 100),
    };
  });
}

export function getTop5AggressiveDrivers(): {
  driver: string;
  harshBraking: number;
  harshCornering: number;
  hardAcceleration: number;
}[] {
  const drivers = ["Driver 11", "Driver 6", "Driver 1", "Driver 21", "Driver 18"];
  return drivers.map((driver) => ({
    driver,
    harshBraking: randInt(10, 45),
    harshCornering: randInt(5, 25),
    hardAcceleration: randInt(8, 35),
  }));
}

export function getTop5SeatbeltViolations(): { driver: string; count: number }[] {
  const drivers = ["Driver 3", "Driver 7", "Driver 12", "Driver 9", "Driver 2"];
  return drivers.map((driver) => ({
    driver,
    count: randInt(3, 18),
  }));
}
