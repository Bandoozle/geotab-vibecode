/**
 * Ready to Roll — Driver Readiness Scoring Engine
 *
 * PURE logic.
 * Fetch drivers/trucks/checkins from Firestore in your data layer, then pass them in.
 *
 * Fixes included:
 * - Robust matching for driver/truck ids (driver.id vs driver.driverId, truckId vs id)
 * - Safe fallbacks when trucks/checkins are missing (no more trucks[0]! crash)
 * - Safer scoring when safetyScore is missing / non-numeric
 * - Index latest checkins safely (bad timestamps won’t break ordering)
 * - Uses driverId consistently for checkins lookup
 */

import type { DriverDoc, TruckDoc } from "./firestoreTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = "green" | "yellow" | "red";

/**
 * Match this to your Firestore "checkins" collection.
 * If your Firestore stores Timestamp, convert it to ISO string in your fetch layer.
 */
export type WellnessCheckinDoc = {
  driverId: string;
  mood: number; // 1–5  (1 = exhausted, 5 = energised)
  stress: number; // 1–5  (1 = very calm, 5 = very stressed)
  sleepHours: number; // 4–9+
  note?: string;
  timestamp: string; // ISO string
};

export interface DriverReadiness {
  driver: DriverDoc;
  truck: TruckDoc | null; // ✅ allow null when not found
  checkin: WellnessCheckinDoc | null;
  behavioralScore: number; // 0–100  (35 % weight)
  complianceScore: number; // 0–100  (30 % weight)
  vehicleScore: number; // 0–100  (20 % weight)
  wellnessScore: number; // 0–100  (15 % weight)
  totalScore: number; // 0–100  composite
  riskLevel: RiskLevel;
  triggers: string[]; // which dimensions flagged
  coachingMessage: string;
}

export interface CorrelationPoint {
  name: string;
  moodScore: number;
  safetyScore: number;
  riskLevel: RiskLevel;
}

// ─── Optional: Compliance / vehicle signals ───────────────────────────────────
// Replace with real Firestore-driven inputs later (or pass them in)
const CONSECUTIVE_DAYS: Record<string, number> = {};
const HOURS_THIS_WEEK: Record<string, number> = {};
const VEHICLE_ACTIVE_FAULTS: Record<string, number> = {};

// ─── Exported accessors ───────────────────────────────────────────────────────

export function getConsecutiveDaysWorked(driverId: string): number {
  return CONSECUTIVE_DAYS[driverId] ?? 5;
}

export function getHoursThisWeek(driverId: string): number {
  return HOURS_THIS_WEEK[driverId] ?? 45;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function clamp100(x: number) {
  return Math.min(100, Math.max(0, x));
}

function safeTimeMs(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function getDriverId(driver: DriverDoc): string {
  // Support either shape
  return (driver as any).id ?? (driver as any).driverId ?? "";
}

function getTruckId(driver: DriverDoc): string {
  // Support either shape
  return (driver as any).truckId ?? (driver as any).truck_id ?? (driver as any).vehicleId ?? "";
}

function getTruckPrimaryId(truck: TruckDoc): string {
  return (truck as any).id ?? (truck as any).truckId ?? "";
}

// ─── Scoring functions ────────────────────────────────────────────────────────

function scoreBehavioral(driver: DriverDoc): number {
  // Expect something like driver.safetyScore (0-100-ish). If missing, return neutral.
  const safety = num((driver as any).safetyScore, NaN);
  if (!Number.isFinite(safety)) return 60;

  // safetyScore 65–98 → scaled to 0–100
  const scaled = ((safety - 65) / 33) * 100;
  return Math.round(clamp100(scaled));
}

function scoreCompliance(driverId: string): number {
  if (!driverId) return 60;

  const days = getConsecutiveDaysWorked(driverId);
  const hours = getHoursThisWeek(driverId);

  // HOS limits: 70 hrs/8-day cycle
  // More days/hours => worse score
  const daysScore = clamp100(((8 - num(days, 8)) / 6) * 100);
  const hoursScore = clamp100(((70 - num(hours, 70)) / 42) * 100);

  return Math.round(daysScore * 0.5 + hoursScore * 0.5);
}

function scoreVehicle(truck: TruckDoc | null): number {
  if (!truck) return 60;

  const tid = getTruckPrimaryId(truck);
  const faults = VEHICLE_ACTIVE_FAULTS[tid] ?? 0;

  if (faults === 0) return 100;
  if (faults === 1) return 72;
  if (faults === 2) return 44;
  return 18;
}

function scoreWellness(checkin: WellnessCheckinDoc | null): number {
  if (!checkin) return 60; // neutral — no self-report available

  const mood = num(checkin.mood, 3);
  const stress = num(checkin.stress, 3);
  const sleep = num(checkin.sleepHours, 7);

  const moodScore = clamp100(clamp01((mood - 1) / 4) * 100);
  const stressScore = clamp100(clamp01((5 - stress) / 4) * 100); // inverted: calm = 100
  const sleepScore = clamp100(clamp01((sleep - 4) / 5) * 100);

  return Math.round(moodScore * 0.4 + stressScore * 0.3 + sleepScore * 0.3);
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "green";
  if (score >= 55) return "yellow";
  return "red";
}

function getTriggers(
  behavioral: number,
  compliance: number,
  vehicle: number,
  wellness: number,
  hasCheckin: boolean,
): string[] {
  const out: string[] = [];
  if (behavioral < 62) out.push("behavioral");
  if (compliance < 52) out.push("compliance");
  if (vehicle < 50) out.push("vehicle");
  if (hasCheckin && wellness < 50) out.push("wellness");
  return out;
}

/**
 * Returns a coaching message targeted at the driver's primary trigger.
 */
function buildCoachingMessage(triggers: string[], riskLevel: RiskLevel): string {
  if (triggers.includes("compliance"))
    return "You've had a long week. Your mandatory breaks exist for a reason — take them. Rest is part of the job.";
  if (triggers.includes("behavioral"))
    return "Your recent safety score has room to improve. Focus on smooth, predictable braking and generous following distance today.";
  if (triggers.includes("vehicle"))
    return "Your truck has an active fault. Confirm with maintenance before heading out — a short delay beats a roadside breakdown.";
  if (triggers.includes("wellness"))
    return "You mentioned feeling off today — that honesty takes courage. Take it easier out there and pull over if things don't feel right.";
  if (riskLevel === "green") return "Everything looks good. Stay focused and drive safe.";
  return "A few factors are slightly elevated today. Stay alert, take your breaks, and don't rush.";
}

// ─── Core computation ─────────────────────────────────────────────────────────

export function computeReadiness(
  driver: DriverDoc,
  truck: TruckDoc | null,
  checkin: WellnessCheckinDoc | null,
): DriverReadiness {
  const driverId = getDriverId(driver);

  const behavioral = scoreBehavioral(driver);
  const compliance = scoreCompliance(driverId);
  const vehicle = scoreVehicle(truck);
  const wellness = scoreWellness(checkin);

  let total = Math.round(
    behavioral * 0.35 + compliance * 0.30 + vehicle * 0.20 + wellness * 0.15,
  );

  // Override: objective data wins over self-report.
  if (total > 54 && (behavioral < 48 || compliance < 38)) {
    total = 54;
  }

  const triggers = getTriggers(
    behavioral,
    compliance,
    vehicle,
    wellness,
    checkin !== null,
  );
  const riskLevel = getRiskLevel(total);
  const coachingMessage = buildCoachingMessage(triggers, riskLevel);

  return {
    driver,
    truck,
    checkin,
    behavioralScore: behavioral,
    complianceScore: compliance,
    vehicleScore: vehicle,
    wellnessScore: wellness,
    totalScore: total,
    riskLevel,
    triggers,
    coachingMessage,
  };
}

// ─── Fleet-level helpers (Firestore-driven) ───────────────────────────────────

/**
 * Build a map of latest checkin per driver.
 * Assumes `timestamp` is an ISO string.
 */
export function indexLatestCheckins(
  checkins: WellnessCheckinDoc[],
): Record<string, WellnessCheckinDoc> {
  const latest: Record<string, WellnessCheckinDoc> = {};

  for (const c of checkins ?? []) {
    if (!c?.driverId) continue;

    const prev = latest[c.driverId];
    if (!prev) {
      latest[c.driverId] = c;
      continue;
    }

    if (safeTimeMs(c.timestamp) > safeTimeMs(prev.timestamp)) {
      latest[c.driverId] = c;
    }
  }

  return latest;
}

/**
 * ✅ Main Firestore-driven fleet readiness.
 * - drivers: from Firestore drivers collection
 * - trucks: from Firestore trucks collection
 * - checkins: from Firestore checkins collection (today or recent)
 */
export function getFleetReadiness(
  drivers: DriverDoc[],
  trucks: TruckDoc[],
  checkins: WellnessCheckinDoc[],
): DriverReadiness[] {
  const latestByDriver = indexLatestCheckins(checkins);

  // Pre-index trucks for speed + reliability
  const truckById = new Map<string, TruckDoc>();
  for (const t of trucks ?? []) {
    const id = getTruckPrimaryId(t);
    if (id) truckById.set(id, t);
  }

  return (drivers ?? []).map((driver) => {
    const driverId = getDriverId(driver);
    const truckId = getTruckId(driver);

    const truck = (truckId ? truckById.get(truckId) : null) ?? null;
    const checkin = (driverId ? latestByDriver[driverId] : null) ?? null;

    return computeReadiness(driver, truck, checkin);
  });
}

export function getAtRiskDrivers(
  drivers: DriverDoc[],
  trucks: TruckDoc[],
  checkins: WellnessCheckinDoc[],
): DriverReadiness[] {
  return getFleetReadiness(drivers, trucks, checkins).filter(
    (r) => r.riskLevel !== "green",
  );
}

// Keeping the API, but returning empty for now (so nothing breaks).
export function getCorrelationData(): CorrelationPoint[] {
  return [];
}

// ─── Styling helpers ──────────────────────────────────────────────────────────

export function riskColor(level: RiskLevel): string {
  return level === "green" ? "#16a34a" : level === "yellow" ? "#ca8a04" : "#dc2626";
}

export function riskBg(level: RiskLevel): string {
  return level === "green" ? "#f0fdf4" : level === "yellow" ? "#fefce8" : "#fef2f2";
}

export function riskBorder(level: RiskLevel): string {
  return level === "green" ? "#bbf7d0" : level === "yellow" ? "#fef08a" : "#fecaca";
}

export function riskLabel(level: RiskLevel): string {
  return level === "green" ? "Ready" : level === "yellow" ? "Caution" : "At Risk";
}