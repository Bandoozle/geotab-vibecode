"use client";

import { useState, useMemo } from "react";
import { getDrivers } from "@/lib/fakeData";
import { FilterBar } from "@/components/FilterBar";
import { LeaderboardTable } from "@/components/LeaderboardTable";

const TIMEFRAMES = ["Today", "7 days", "30 days"] as const;

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>("7 days");

  // Same drivers; in a real app we'd filter by timeframe. For demo we keep order consistent.
  const drivers = useMemo(() => getDrivers(), []);

  return (
    <div className="min-h-full">
      <FilterBar />
      <div className="space-y-8 p-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Leaderboard</h1>
          <p className="mt-1 text-primary/70">
            Top drivers by total points. Filter by timeframe (fake but consistent).
          </p>
        </header>

        <div className="border border-primary/15 bg-surface p-4 text-center">
          <p className="text-lg font-semibold text-primary">
            Winner gets promotion to Better Trucker (no pay raise) + trophy (placeholder)
          </p>
          <p className="mt-1 text-sm text-primary/70">
            All in good fun – this is a practice dashboard.
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

        <LeaderboardTable drivers={drivers} timeframe={timeframe} />
      </div>
    </div>
  );
}
