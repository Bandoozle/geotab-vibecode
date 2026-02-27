"use client";

import type { Driver } from "@/lib/fakeData";
import { BadgePill } from "./BadgePill";

interface LeaderboardTableProps {
  drivers: Driver[];
  timeframe: string;
  category: string;
}

export function LeaderboardTable({
  drivers,
  timeframe,
  category,
}: LeaderboardTableProps) {
  const sorted = drivers.slice(0, 10);
  const [first, second, third, ...rest] = sorted;

  return (
    <div className="space-y-4">
      {/* Podium */}
      <div className="grid grid-cols-3 gap-3">
        {second && (
          <PodiumCard place={2} driver={second} className="mt-4" />
        )}
        {first && <PodiumCard place={1} driver={first} />}
        {third && (
          <PodiumCard place={3} driver={third} className="mt-4" />
        )}
      </div>

      <div className="overflow-x-auto border border-primary/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface text-primary/70">
              <th className="p-3 font-medium">Rank</th>
              <th className="p-3 font-medium">Driver</th>
              <th className="p-3 font-medium">Points</th>
              <th className="p-3 font-medium">Safety</th>
              <th className="p-3 font-medium">MPG</th>
              <th className="p-3 font-medium">On-time %</th>
              <th className="p-3 font-medium">Badges</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr
                key={d.id}
                className={`border-b border-surface ${
                  i === 0 ? "bg-surface" : "hover:bg-surface/50"
                }`}
              >
                <td className="p-3 font-bold text-primary">
                  {i + 1}
                </td>
                <td className="p-3 font-medium text-primary">{d.name}</td>
                <td className="p-3 font-mono text-accent">{d.totalPoints}</td>
                <td className="p-3 text-primary/80">{d.safetyScore}</td>
                <td className="p-3 text-primary/80">{d.mpg.toFixed(1)}</td>
                <td className="p-3 text-primary/80">{d.onTimePercent}%</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {d.badges.length ? (
                      d.badges.map((b) => <BadgePill key={b} label={b} />)
                    ) : (
                      <span className="text-primary/60">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="p-3 text-xs text-primary/60">
          Leaderboard for: {timeframe} · Category: {category}
        </p>
      </div>
    </div>
  );
}

interface PodiumCardProps {
  place: 1 | 2 | 3;
  driver: Driver;
  className?: string;
}

function PodiumCard({ place, driver, className = "" }: PodiumCardProps) {
  const height =
    place === 1 ? "h-28" : place === 2 ? "h-24" : "h-20";
  const label = place === 1 ? "1st" : place === 2 ? "2nd" : "3rd";

  return (
    <div
      className={`flex flex-col items-center justify-end border border-primary/15 bg-white px-3 pb-3 pt-2 ${className}`}
    >
      <span className="text-xs font-medium text-primary/70 mb-1">
        {label} place
      </span>
      <div
        className={`flex w-full flex-col items-center justify-center bg-surface ${height}`}
      >
        <div className="text-sm font-semibold text-primary text-center">
          {driver.name}
        </div>
        <div className="mt-1 text-xs text-primary/70">
          Vibe score:{" "}
          <span className="font-mono text-accent">
            {driver.totalPoints}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {driver.badges.slice(0, 3).map((b) => (
          <BadgePill key={b} label={b} />
        ))}
      </div>
    </div>
  );
}

