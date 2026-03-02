"use client";

import { useEffect, useMemo, useState } from "react";

import { LeaderboardTable } from "@/components/LeaderboardTable";
import type { Driver } from "@/lib/fakeData"; // ✅ use the exact type LeaderboardTable expects

import { db } from "@/lib/firebaseClient";
import { collection, getDocs, limit, query } from "firebase/firestore";

const TIMEFRAMES = ["Today", "7 days", "30 days"] as const;
const CATEGORIES = [
  { id: "vibe", label: "Vibe score" },
  { id: "safety", label: "Safety" },
  { id: "fuel", label: "Fuel efficiency" },
  { id: "onTime", label: "On-time" },
] as const;

type Timeframe = (typeof TIMEFRAMES)[number];
type CategoryId = (typeof CATEGORIES)[number]["id"];

const TIMEFRAME_MULT: Record<Timeframe, number> = {
  Today: 0.6,
  "7 days": 1.0,
  "30 days": 1.35,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type AnyObj = Record<string, any>;

function normalizeDriver(docId: string, data: AnyObj): Driver {
  const id = String(data.id ?? data.driverId ?? data.driverID ?? docId);

  return {
    id,
    name: String(data.name ?? data.driverName ?? "Unknown Driver"),

    // ✅ required by fakeData Driver type / LeaderboardTable
    truckId: String(data.truckId ?? data.truckID ?? data.truck ?? ""),

    safetyScore: Number(data.safetyScore ?? 0) || 0,
    mpg: Number(data.mpg ?? 0) || 0,
    onTimePercent: Number(data.onTimePercent ?? data.onTime ?? 0) || 0,
    totalPoints: Number(data.totalPoints ?? data.vibeScore ?? 0) || 0,
    badges: Array.isArray(data.badges) ? data.badges.map(String) : [],
  };
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("7 days");
  const [category, setCategory] = useState<CategoryId>("vibe");
  const [search, setSearch] = useState("");

  const [baseDrivers, setBaseDrivers] = useState<Driver[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setIsLoaded(false);
        setLoadError(null);

        const qDrivers = query(collection(db, "drivers"), limit(500));
        const snap = await getDocs(qDrivers);

        const rows = snap.docs.map((doc) =>
          normalizeDriver(doc.id, doc.data() as AnyObj)
        );

        if (!alive) return;
        setBaseDrivers(rows);
        setIsLoaded(true);
      } catch (err: any) {
        console.error("Leaderboard Firestore load failed:", err);
        if (!alive) return;

        setLoadError(err?.message ?? "Failed to load drivers.");
        setIsLoaded(true);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const searchedDrivers = useMemo(() => {
    const q = norm(search);
    if (!q) return baseDrivers;

    return baseDrivers.filter((d) => {
      const name = norm(d.name ?? "");
      const id = norm(d.id ?? "");
      const truckId = norm(d.truckId ?? "");
      return name.includes(q) || id.includes(q) || truckId.includes(q);
    });
  }, [baseDrivers, search]);

  const drivers = useMemo(() => {
    const mult = TIMEFRAME_MULT[timeframe];
    const base = searchedDrivers.slice();

    const withWindowed: Driver[] = base.map((d) => {
      const safety = clamp(d.safetyScore * (0.9 + 0.1 * mult), 0, 100);
      const mpg = d.mpg * (0.95 + 0.05 * mult);
      const onTime = clamp(d.onTimePercent * (0.92 + 0.08 * mult), 0, 100);
      const vibe = Math.round(d.totalPoints * mult);

      return {
        ...d,
        safetyScore: safety,
        mpg,
        onTimePercent: onTime,
        totalPoints: vibe,
      };
    });

    switch (category) {
      case "safety":
        return withWindowed.sort((a, b) => b.safetyScore - a.safetyScore);
      case "fuel":
        return withWindowed.sort((a, b) => b.mpg - a.mpg);
      case "onTime":
        return withWindowed.sort((a, b) => b.onTimePercent - a.onTimePercent);
      case "vibe":
      default:
        return withWindowed.sort((a, b) => b.totalPoints - a.totalPoints);
    }
  }, [searchedDrivers, category, timeframe]);

  const categoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label ?? "Vibe score";

  return (
    <div className="min-h-full">
      <div className="space-y-8 p-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Leaderboard
          </h1>
          <p className="mt-1 text-primary/70">
            Ranked drivers based on safety, fuel efficiency, and on-time
            performance.
          </p>

          <p className="mt-2 text-xs text-primary/60">
            {loadError
              ? `Firestore error: ${loadError}`
              : isLoaded
              ? `Loaded ${baseDrivers.length} driver(s) from Firestore.`
              : "Loading leaderboard…"}
          </p>
        </header>

        {/* Search */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by driver name, id, or truck id…"
            className="w-full sm:w-96 rounded-lg border border-primary/15 bg-white px-4 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/10"
          />

          <div className="text-xs text-primary/60">
            Showing{" "}
            <span className="font-medium text-primary">
              {drivers.length.toLocaleString()}
            </span>{" "}
            result(s)
          </div>
        </div>

        {/* Timeframe */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-primary/70">Timeframe:</span>
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`border px-4 py-2 text-sm font-medium transition-colors ${
                timeframe === t
                  ? "border-accent bg-accent text-white"
                  : "border-primary/20 bg-white text-primary hover:bg-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-primary/70">Category:</span>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`border px-4 py-1.5 text-xs font-medium transition-colors ${
                category === c.id
                  ? "border-accent bg-accent text-white"
                  : "border-primary/20 bg-white text-primary hover:bg-surface"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <LeaderboardTable
          drivers={drivers}
          timeframe={timeframe}
          category={categoryLabel}
        />
      </div>
    </div>
  );
}