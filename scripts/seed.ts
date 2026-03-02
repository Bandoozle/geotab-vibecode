import "dotenv/config";
import { adminDb } from "../src/lib/firebaseAdmin";

// Import deterministic generators + constants from your fake data file
import {
  VEHICLE_TYPES,
  FUEL_MONTHS,
  DAY_NAMES,
  type VehicleType,
  type FuelMonth,
  type DayName,

  getTrucks,
  getDrivers,
  getFaults,
  getDailyMetrics,

  getFleetWeeklyMileageByMonth,
  getLast3MonthsFuelTrend,
  getTop5AggressiveDrivers,
  getTop5SeatbeltViolations,
} from "../src/lib/fakeData";

/**
 * Collections in Firestore.
 * We'll delete and recreate them.
 */
const COLLECTIONS = [
  "aggressiveEvents",
  "dailyMetrics",
  "drivers",
  "faults",
  "fuelTrend",
  "seatbeltViolations",
  "trucks",
  "weeklyMileage",
  "idlingBreakdown",
  "driverSignalsDaily",
] as const;

type CollectionName = (typeof COLLECTIONS)[number];

// ---------------------------
// Helpers
// ---------------------------
const BATCH_LIMIT = 450; // keep under 500

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Delete an entire collection in pages.
 * IMPORTANT: Only use this on DEV/demo data.
 */
async function deleteCollection(name: CollectionName, pageSize = 300) {
  const col = adminDb.collection(name);

  while (true) {
    const snap = await col.limit(pageSize).get();
    if (snap.empty) break;

    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function upsertMany(
  collectionName: CollectionName,
  docs: { id: string; data: any }[]
) {
  for (const group of chunk(docs, BATCH_LIMIT)) {
    const batch = adminDb.batch();
    for (const doc of group) {
      batch.set(adminDb.collection(collectionName).doc(doc.id), doc.data, {
        merge: false,
      });
    }
    await batch.commit();
  }
}

// yyyy-mm-dd
function dateKey(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// stable-ish pseudo random from integers
function pseudo(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x); // 0..1
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Map demo months/days to a real-ish date range so events can have timestamps.
// We’ll treat:
// Oct 2024 -> ~30 days ago
// Nov 2024 -> ~20 days ago
// Dec 2024 -> ~10 days ago
function baseDaysAgoForMonth(month: FuelMonth) {
  if (month === "Oct 2024") return 30;
  if (month === "Nov 2024") return 20;
  return 10; // Dec 2024
}
function dayIndex(day: DayName) {
  return (DAY_NAMES as readonly DayName[]).indexOf(day);
}
function isoAtNoonFromDateKey(date: string) {
  // create a stable timestamp for that date (noon local-ish)
  const d = new Date(`${date}T12:00:00.000Z`);
  return d.toISOString();
}

// Pick a stable driver for a row based on month/day/vehicleType + idx
function pickDriverForRow(
  drivers: { id: string; name: string; truckId: string }[],
  month: FuelMonth,
  day: DayName,
  vehicleType: VehicleType,
  idx: number
) {
  const m = (FUEL_MONTHS as readonly FuelMonth[]).indexOf(month);
  const d = dayIndex(day);
  const v = (VEHICLE_TYPES as readonly VehicleType[]).indexOf(vehicleType);
  const seed = m * 100000 + d * 1000 + v * 37 + idx * 7;
  const pickIdx = Math.floor(pseudo(seed) * drivers.length);
  return drivers[Math.min(drivers.length - 1, Math.max(0, pickIdx))];
}

// ---------------------------
// MASTER SEED
// ---------------------------
async function main() {
  console.log("env loaded?", Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON));

  // 1) WIPE ALL COLLECTIONS
  console.log("🧹 Deleting collections...");
  for (const c of COLLECTIONS) {
    await deleteCollection(c);
  }
  console.log("✅ Delete complete");

  // 2) GENERATE STABLE BASE ENTITIES
  const drivers = getDrivers();
  const trucks = getTrucks();

  const nowIso = new Date().toISOString();

  const driverDocs = drivers.map((d) => ({
    id: d.id, // DRV-0
    data: {
      driverId: d.id,
      name: d.name,
      truckId: d.truckId,

      safetyScore: d.safetyScore,
      mpg: d.mpg,
      onTimePercent: d.onTimePercent,
      totalPoints: d.totalPoints,
      badges: d.badges ?? [],

      updatedAt: nowIso,
    },
  }));

  const truckDocs = trucks.map((t) => ({
    id: t.id, // TRK-1000
    data: {
      truckId: t.id,
      driverId: t.driverId,

      status: t.status,
      lastPingAt: t.lastPingAt,
      speed: t.speed,
      x: t.x,
      y: t.y,
      lat: t.lat,
      lng: t.lng,

      safetyScore: t.safetyScore,
      mpg: t.mpg,
      milesToday: t.milesToday,

      updatedAt: nowIso,
    },
  }));

  // 3) OTHER COLLECTIONS (same as your dashboard)
  const faults = getFaults();
  const faultDocs = faults.map((f) => ({
    id: f.id,
    data: {
      ...f,
      truckId: f.truckId,
      updatedAt: nowIso,
    },
  }));

  const dailyMetrics = getDailyMetrics(7);
  const dailyMetricDocs = dailyMetrics.map((m) => ({
    id: m.date, // stable doc id
    data: {
      ...m,
      updatedAt: nowIso,
    },
  }));

  const weeklyMileage = getFleetWeeklyMileageByMonth();
  const weeklyMileageDocs = weeklyMileage.map((r, idx) => ({
    id: `wm_${r.month}_${r.day}_${r.vehicleType}_${idx}`,
    data: {
      ...r,
      month: r.month as FuelMonth,
      day: r.day as DayName,
      vehicleType: r.vehicleType as VehicleType,
      updatedAt: nowIso,
    },
  }));

  const fuelTrend = getLast3MonthsFuelTrend();
  const fuelTrendDocs = fuelTrend.map((r, idx) => ({
    id: `ft_${r.month}_${r.vehicleType}_${idx}`,
    data: {
      ...r,
      month: r.month as FuelMonth,
      vehicleType: r.vehicleType as VehicleType,
      updatedAt: nowIso,
    },
  }));

  // ---------------------------
  // 3a) UPGRADED EVENTS (joins!)
  // ---------------------------
  const aggressiveEvents = getTop5AggressiveDrivers();
  const aggressiveDocs = aggressiveEvents.map((r, idx) => {
    const picked = pickDriverForRow(
      drivers.map((d) => ({ id: d.id, name: d.name, truckId: d.truckId })),
      r.month as FuelMonth,
      r.day as DayName,
      r.vehicleType as VehicleType,
      idx
    );

    const daysAgo =
      baseDaysAgoForMonth(r.month as FuelMonth) + (6 - dayIndex(r.day as DayName));
    const date = dateKey(daysAgo);
    const timestamp = isoAtNoonFromDateKey(date);

    const docId = `ag_${r.month}_${r.day}_${r.vehicleType}_${picked.id}_${idx}`;

    return {
      id: docId,
      data: {
        ...r,

        // ✅ keep original field name for charts, but make it real
        driver: picked.name,

        // ✅ NEW: real join keys
        driverId: picked.id,
        driverName: picked.name,
        truckId: picked.truckId,

        // ✅ NEW: timeframe support
        date,
        timestamp,

        month: r.month as FuelMonth,
        day: r.day as DayName,
        vehicleType: r.vehicleType as VehicleType,

        updatedAt: nowIso,
      },
    };
  });

  const seatbeltViolations = getTop5SeatbeltViolations();
  const seatbeltDocs = seatbeltViolations.map((r, idx) => {
    const picked = pickDriverForRow(
      drivers.map((d) => ({ id: d.id, name: d.name, truckId: d.truckId })),
      r.month as FuelMonth,
      r.day as DayName,
      r.vehicleType as VehicleType,
      idx + 999 // different stream than aggressive
    );

    const daysAgo =
      baseDaysAgoForMonth(r.month as FuelMonth) + (6 - dayIndex(r.day as DayName));
    const date = dateKey(daysAgo);
    const timestamp = isoAtNoonFromDateKey(date);

    const docId = `sb_${r.month}_${r.day}_${r.vehicleType}_${picked.id}_${idx}`;

    return {
      id: docId,
      data: {
        ...r,

        // ✅ keep original field name for charts, but make it real
        driver: picked.name,

        // ✅ NEW: real join keys
        driverId: picked.id,
        driverName: picked.name,
        truckId: picked.truckId,

        // ✅ NEW: timeframe support
        date,
        timestamp,

        month: r.month as FuelMonth,
        day: r.day as DayName,
        vehicleType: r.vehicleType as VehicleType,

        updatedAt: nowIso,
      },
    };
  });

  // 4) OPTIONAL BUT VERY “MANAGER USEFUL” DATA
  // 4a) idlingBreakdown (counts, not percentages)
  const idlingBreakdownDocs = (VEHICLE_TYPES as readonly VehicleType[]).map((vt, i) => {
    const idleMinutes = 300 + Math.round(pseudo(i + 50) * 1200); // 300..1500
    return {
      id: vt, // stable doc id
      data: {
        vehicleType: vt,
        idleMinutes,
        updatedAt: nowIso,
      },
    };
  });

  // 4b) driverSignalsDaily (makes timeframe leaderboard REAL)
  const driverSignalsDailyDocs: { id: string; data: any }[] = [];
  for (let dayAgo = 0; dayAgo < 30; dayAgo++) {
    const date = dateKey(dayAgo);
    const timestamp = isoAtNoonFromDateKey(date);

    drivers.forEach((d, idx) => {
      const seed = dayAgo * 1000 + idx * 7;

      const safetyScore = clamp(
        Math.round(d.safetyScore + (pseudo(seed + 1) - 0.5) * 8),
        60,
        100
      );

      const mpg = clamp(d.mpg + (pseudo(seed + 2) - 0.5) * 0.5, 4.5, 9.5);
      const onTimePercent = clamp(
        Math.round(d.onTimePercent + (pseudo(seed + 3) - 0.5) * 10),
        70,
        100
      );

      const harshBraking = Math.max(0, Math.round(pseudo(seed + 4) * 6));
      const harshCornering = Math.max(0, Math.round(pseudo(seed + 5) * 5));
      const hardAcceleration = Math.max(0, Math.round(pseudo(seed + 6) * 6));
      const seatbelt = Math.max(0, Math.round(pseudo(seed + 7) * 3));

      const miles = 70 + Math.round(pseudo(seed + 8) * 380);
      const idleMinutes = 10 + Math.round(pseudo(seed + 9) * 120);

      const vibe =
        safetyScore * 0.5 +
        (mpg / 10) * 20 +
        onTimePercent * 0.2 -
        (harshBraking + harshCornering + hardAcceleration) * 0.6 -
        seatbelt * 2;

      const totalPoints = Math.max(0, Math.round(vibe));

      const docId = `${d.id}_${date}`;

      driverSignalsDailyDocs.push({
        id: docId,
        data: {
          driverId: d.id,
          driverName: d.name,
          truckId: d.truckId,

          date,
          timestamp,

          safetyScore,
          mpg: Number(mpg.toFixed(2)),
          onTimePercent,

          harshBraking,
          harshCornering,
          hardAcceleration,
          seatbeltViolations: seatbelt,

          miles,
          idleMinutes,

          totalPoints,
          updatedAt: nowIso,
        },
      });
    });
  }

  // 5) WRITE EVERYTHING
  console.log("✍️ Writing docs...");

  await upsertMany("drivers", driverDocs);
  await upsertMany("trucks", truckDocs);
  await upsertMany("faults", faultDocs);
  await upsertMany("dailyMetrics", dailyMetricDocs);
  await upsertMany("weeklyMileage", weeklyMileageDocs);
  await upsertMany("fuelTrend", fuelTrendDocs);
  await upsertMany("aggressiveEvents", aggressiveDocs);
  await upsertMany("seatbeltViolations", seatbeltDocs);
  await upsertMany("idlingBreakdown", idlingBreakdownDocs);
  await upsertMany("driverSignalsDaily", driverSignalsDailyDocs);

  console.log("✅ Seed complete:", {
    drivers: driverDocs.length,
    trucks: truckDocs.length,
    faults: faultDocs.length,
    dailyMetrics: dailyMetricDocs.length,
    weeklyMileage: weeklyMileageDocs.length,
    fuelTrend: fuelTrendDocs.length,
    aggressiveEvents: aggressiveDocs.length,
    seatbeltViolations: seatbeltDocs.length,
    idlingBreakdown: idlingBreakdownDocs.length,
    driverSignalsDaily: driverSignalsDailyDocs.length,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});