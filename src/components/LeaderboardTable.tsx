"use client";

import type { Driver } from "@/lib/fakeData";
import { BadgePill } from "./BadgePill";

interface LeaderboardTableProps {
  drivers: Driver[];
  timeframe: string;
}

export function LeaderboardTable({ drivers, timeframe }: LeaderboardTableProps) {
  const top10 = drivers.slice(0, 10);

  return (
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
          {top10.map((d, i) => (
            <tr
              key={d.id}
              className={`border-b border-surface ${
                i === 0 ? "bg-surface" : "hover:bg-surface/50"
              }`}
            >
              <td className="p-3 font-bold text-primary">
                {i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3" : i + 1}
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
        Leaderboard for: {timeframe} (fake data, consistent per session)
      </p>
    </div>
  );
}
