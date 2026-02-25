"use client";

import { SCORING_RULES, BADGES } from "@/lib/fakeData";

const CHALLENGE_TARGET = 5;
const CHALLENGE_CURRENT = 3;

export function DriverChallenge() {
  const pct = Math.min(100, (CHALLENGE_CURRENT / CHALLENGE_TARGET) * 100);

  return (
    <div className="card">
      <h3 className="mb-2 text-sm font-semibold tracking-tight text-white">
        Driver Challenge of the Week
      </h3>
      <p className="mb-3 text-xs text-muted">
        Complete 5 safe days (no harsh braking) this week
      </p>
      <div className="mb-2 h-4 overflow-hidden border border-border bg-black/50">
        <div
          className="h-full bg-white transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-muted-light">
        Progress: {CHALLENGE_CURRENT} / {CHALLENGE_TARGET} days
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Scoring rules
        </h4>
        <ul className="space-y-1 text-xs text-muted-light">
          <li>Safety score: {(SCORING_RULES.safetyWeight * 100).toFixed(0)}% weight</li>
          <li>Fuel efficiency: {(SCORING_RULES.fuelWeight * 100).toFixed(0)}% weight</li>
          <li>On-time: {(SCORING_RULES.onTimeWeight * 100).toFixed(0)}% weight</li>
          <li>Faults penalty: {(SCORING_RULES.faultsPenaltyWeight * 100).toFixed(0)}%</li>
        </ul>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Badges
        </h4>
        <ul className="space-y-1 text-xs text-muted-light">
          {BADGES.map((b) => (
            <li key={b.id}>
              <strong className="text-white">{b.id}:</strong> {b.desc}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
