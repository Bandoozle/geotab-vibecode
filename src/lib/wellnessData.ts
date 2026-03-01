/**
 * Ready to Roll — Driver Readiness Scoring Engine
 *
 * Combines 4 objective + subjective dimensions into a single Drive Readiness Score.
 * Self-reported wellness is intentionally the LOWEST weight (15%) to prevent
 * drivers from "lying fine" to keep working. Objective data (behavior, compliance,
 * vehicle) drives 85% of the score.
 *
 * In production: replace coaching message with Geotab Ace API call.
 */

import type { Driver, Truck } from "./fakeData";

// ─── Separate PRNG (does NOT share state with fakeData's rng) ─────────────────
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const wrng = seededRng(99887);
const wRandInt = (min: number, max: number) =>
  Math.floor(wrng() * (max - min + 1)) + min;
const wRandFloat = (min: number, max: number) => wrng() * (max - min) + min;

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = "green" | "yellow" | "red";

export interface WellnessCheckin {
  driverId: string;
  mood: number;       // 1–5  (1 = exhausted, 5 = energised)
  stress: number;     // 1–5  (1 = very calm, 5 = very stressed)
  sleepHours: number; // 4–9+
  note?: string;
  timestamp: string;
}

export interface DriverReadiness {
  driver: Driver;
  truck: Truck;
  checkin: WellnessCheckin | null;
  behavioralScore: number;  // 0–100  (35 % weight)
  complianceScore: number;  // 0–100  (30 % weight)
  vehicleScore: number;     // 0–100  (20 % weight)
  wellnessScore: number;    // 0–100  (15 % weight)
  totalScore: number;       // 0–100  composite
  riskLevel: RiskLevel;
  triggers: string[];       // which dimensions flagged
  coachingMessage: string;
}

export interface CorrelationPoint {
  name: string;
  moodScore: number;
  safetyScore: number;
  riskLevel: RiskLevel;
}

// ─── Pre-computed module-level data (uses wrng only, never advances fakeData's rng) ──

const CONSECUTIVE_DAYS: Record<string, number> = {};
const HOURS_THIS_WEEK: Record<string, number> = {};
const VEHICLE_ACTIVE_FAULTS: Record<string, number> = {};
const FAKE_CHECKIN_DATA: Omit<WellnessCheckin, "timestamp">[] = [];

for (let i = 0; i < 12; i++) {
  CONSECUTIVE_DAYS[`DRV-${i}`] = wRandInt(2, 8);
  HOURS_THIS_WEEK[`DRV-${i}`] = wRandInt(28, 68);
  VEHICLE_ACTIVE_FAULTS[`TRK-${1000 + i}`] = wRandInt(0, 3);
}

// 9 out of 12 drivers have checked in today (3 haven't yet)
for (let i = 0; i < 9; i++) {
  FAKE_CHECKIN_DATA.push({
    driverId: `DRV-${i}`,
    mood: wRandInt(1, 5),
    stress: wRandInt(1, 5),
    sleepHours: wRandInt(4, 9),
  });
}

// Correlation scatter data (historical, pre-seeded)
const CORRELATION_DATA: CorrelationPoint[] = (() => {
  const DRIVER_NAMES = [
    "Alex", "Jamie", "Morgan", "Jordan", "Riley",
    "Casey", "Drew", "Sam", "Pat", "Chris", "Terry", "Robin",
  ];
  return DRIVER_NAMES.map((name) => {
    const safetyScore = Math.round(wRandFloat(70, 99));
    const moodScore = Math.round(
      Math.max(5, Math.min(100, safetyScore * wRandFloat(0.7, 1.3) - wRandFloat(-10, 20)))
    );
    const riskLevel: RiskLevel =
      moodScore < 40 || safetyScore < 76 ? "red" : moodScore < 62 ? "yellow" : "green";
    return { name, moodScore, safetyScore, riskLevel };
  });
})();

// ─── Exported accessors for compliance data ───────────────────────────────────

export function getConsecutiveDaysWorked(driverId: string): number {
  return CONSECUTIVE_DAYS[driverId] ?? 5;
}

export function getHoursThisWeek(driverId: string): number {
  return HOURS_THIS_WEEK[driverId] ?? 45;
}

// ─── Scoring functions ────────────────────────────────────────────────────────

function scoreBehavioral(driver: Driver): number {
  // safetyScore 72–98 → scaled to 0–100
  // 98 → 100, 85 → 61, 75 → 30
  return Math.round(Math.min(100, Math.max(0, ((driver.safetyScore - 65) / 33) * 100)));
}

function scoreCompliance(driverId: string): number {
  const days = getConsecutiveDaysWorked(driverId);
  const hours = getHoursThisWeek(driverId);
  // HOS limits: 70 hrs/8-day cycle
  const daysScore = Math.max(0, ((8 - days) / 6) * 100);
  const hoursScore = Math.max(0, ((70 - hours) / 42) * 100);
  return Math.round(daysScore * 0.5 + hoursScore * 0.5);
}

function scoreVehicle(truck: Truck): number {
  const faults = VEHICLE_ACTIVE_FAULTS[truck.id] ?? 0;
  if (faults === 0) return 100;
  if (faults === 1) return 72;
  if (faults === 2) return 44;
  return 18;
}

function scoreWellness(checkin: WellnessCheckin | null): number {
  if (!checkin) return 60; // neutral — no self-report available
  const moodScore = ((checkin.mood - 1) / 4) * 100;
  const stressScore = ((5 - checkin.stress) / 4) * 100; // inverted: calm = 100
  const sleepScore = Math.min(100, ((checkin.sleepHours - 4) / 5) * 100);
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
  if (behavioral < 62)          out.push("behavioral");
  if (compliance < 52)          out.push("compliance");
  if (vehicle < 50)             out.push("vehicle");
  if (hasCheckin && wellness < 50) out.push("wellness");
  return out;
}

/**
 * Returns a coaching message targeted at the driver's primary trigger.
 * In production: replace with a Geotab Ace API call passing driver history + check-in.
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
  if (riskLevel === "green")
    return "Everything looks good. Stay focused and drive safe.";
  return "A few factors are slightly elevated today. Stay alert, take your breaks, and don't rush.";
}

// ─── Core computation ─────────────────────────────────────────────────────────

export function computeReadiness(
  driver: Driver,
  truck: Truck,
  checkin: WellnessCheckin | null,
): DriverReadiness {
  const behavioral = scoreBehavioral(driver);
  const compliance = scoreCompliance(driver.id);
  const vehicle    = scoreVehicle(truck);
  const wellness   = scoreWellness(checkin);

  let total = Math.round(
    behavioral * 0.35 +
    compliance * 0.30 +
    vehicle    * 0.20 +
    wellness   * 0.15,
  );

  // Override: objective data wins over self-report.
  // Even if a driver reports feeling fine, flag them if behavior or compliance is poor.
  if (total > 54 && (behavioral < 48 || compliance < 38)) {
    total = 54;
  }

  const triggers       = getTriggers(behavioral, compliance, vehicle, wellness, checkin !== null);
  const riskLevel      = getRiskLevel(total);
  const coachingMessage = buildCoachingMessage(triggers, riskLevel);

  return {
    driver,
    truck,
    checkin,
    behavioralScore: behavioral,
    complianceScore: compliance,
    vehicleScore:    vehicle,
    wellnessScore:   wellness,
    totalScore:      total,
    riskLevel,
    triggers,
    coachingMessage,
  };
}

// ─── Fleet-level helpers ──────────────────────────────────────────────────────

export function generateFakeCheckins(): WellnessCheckin[] {
  const now = new Date();
  return FAKE_CHECKIN_DATA.map((d, i) => ({
    ...d,
    timestamp: new Date(now.getTime() - (i * 7 + 5) * 60 * 1000).toISOString(),
  }));
}

export function getFleetReadiness(drivers: Driver[], trucks: Truck[]): DriverReadiness[] {
  const checkins = generateFakeCheckins();
  return drivers.map((driver) => {
    const truck   = trucks.find((t) => t.id === driver.truckId) ?? trucks[0]!;
    const checkin = checkins.find((c) => c.driverId === driver.id) ?? null;
    return computeReadiness(driver, truck, checkin);
  });
}

export function getAtRiskDrivers(drivers: Driver[], trucks: Truck[]): DriverReadiness[] {
  return getFleetReadiness(drivers, trucks).filter((r) => r.riskLevel !== "green");
}

export function getCorrelationData(): CorrelationPoint[] {
  return CORRELATION_DATA;
}

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
