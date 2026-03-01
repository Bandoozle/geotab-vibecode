"use client";

import { useEffect, useMemo, useState } from "react";
import { getDrivers, type Driver } from "@/lib/fakeData";
import { FilterBar } from "@/components/FilterBar";
import { LeaderboardTable } from "@/components/LeaderboardTable";

const TIMEFRAMES = ["Today", "7 days", "30 days"] as const;
const CATEGORIES = [
  { id: "vibe", label: "Vibe score" },
  { id: "safety", label: "Safety" },
  { id: "fuel", label: "Fuel efficiency" },
  { id: "onTime", label: "On-time" },
] as const;

type Timeframe = (typeof TIMEFRAMES)[number];
type CategoryId = (typeof CATEGORIES)[number]["id"];

// Demo weighting: makes timeframe "do something" without new backend data
const TIMEFRAME_MULT: Record<Timeframe, number> = {
  Today: 0.6,
  "7 days": 1.0,
  "30 days": 1.35,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("7 days");
  const [category, setCategory] = useState<CategoryId>("vibe");

  // IMPORTANT: load once on client to prevent RNG drift / hydration mismatch
  const [baseDrivers, setBaseDrivers] = useState<Driver[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setBaseDrivers(getDrivers());
    setIsLoaded(true);
  }, []);

  const drivers = useMemo(() => {
    const mult = TIMEFRAME_MULT[timeframe];
    const base = baseDrivers.slice();

    // Create a derived "windowed" view so timeframe changes ranking
    const withWindowed = base.map((d) => {
      // Safety / MPG / onTime are stable inputs; we scale them a bit by timeframe.
      // For vibe, we scale totalPoints but keep it realistic.
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
  }, [baseDrivers, category, timeframe]);

  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? "Vibe score";

  return (
    <div className="min-h-full">
      <FilterBar />

      <div className="space-y-8 p-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Leaderboard</h1>
          <p className="mt-1 text-primary/70">
            Ranked drivers with a transparent Vibe score based on safety, fuel efficiency, and on-time performance.
          </p>
          <p className="mt-2 text-xs text-primary/60">
            {isLoaded
              ? "Demo data is seeded and loaded once for stable rankings."
              : "Loading leaderboard…"}
          </p>
        </header>

        <div className="border border-primary/15 bg-surface p-4 text-center">
          <p className="text-lg font-semibold text-primary">
            Winner gets promotion to Better Trucker (no pay raise) + trophy (placeholder)
          </p>
          <p className="mt-1 text-sm text-primary/70">
            Use this board for healthy competition and coaching conversations.
          </p>
        </div>

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

        <LeaderboardTable drivers={drivers} timeframe={timeframe} category={categoryLabel} />
      </div>
    </div>
  );
}