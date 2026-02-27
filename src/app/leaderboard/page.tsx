"use client";

import { useState, useMemo } from "react";
import { getDrivers } from "@/lib/fakeData";
import { FilterBar } from "@/components/FilterBar";
import { LeaderboardTable } from "@/components/LeaderboardTable";

const TIMEFRAMES = ["Today", "7 days", "30 days"] as const;
const CATEGORIES = [
  { id: "vibe", label: "Vibe score" },
  { id: "safety", label: "Safety" },
  { id: "fuel", label: "Fuel efficiency" },
  { id: "onTime", label: "On-time" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>("7 days");
  const [category, setCategory] = useState<CategoryId>("vibe");

  const drivers = useMemo(() => {
    const base = getDrivers().slice();
    switch (category) {
      case "safety":
        return base.sort((a, b) => b.safetyScore - a.safetyScore);
      case "fuel":
        return base.sort((a, b) => b.mpg - a.mpg);
      case "onTime":
        return base.sort((a, b) => b.onTimePercent - a.onTimePercent);
      case "vibe":
      default:
        return base.sort((a, b) => b.totalPoints - a.totalPoints);
    }
  }, [category]);

  return (
    <div className="min-h-full">
      <FilterBar />
      <div className="space-y-8 p-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Leaderboard</h1>
          <p className="mt-1 text-primary/70">
            Ranked drivers with a transparent Vibe score based on safety, fuel efficiency, and on-time performance.
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

        <LeaderboardTable drivers={drivers} timeframe={timeframe} category={CATEGORIES.find(c => c.id === category)?.label ?? "Vibe score"} />
      </div>
    </div>
  );
}
