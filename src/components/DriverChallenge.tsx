"use client";

import { SCORING_RULES, BADGES } from "@/lib/fakeData";

const CHALLENGE_TARGET = 5;
const CHALLENGE_CURRENT = 3;

export function DriverChallenge() {
  const pct = Math.min(100, (CHALLENGE_CURRENT / CHALLENGE_TARGET) * 100);

  return (
    <div className="border border-primary/15 bg-white">
      <div className="border-b border-surface bg-surface px-4 py-3">
        <h3 className="text-sm font-semibold text-primary">
          Driver Challenge of the Week
        </h3>
      </div>
      <div className="p-4">
        <p className="mb-3 text-xs text-primary/70">
          Complete 5 safe days (no harsh braking) this week
        </p>
        <div className="mb-2 h-4 overflow-hidden border border-primary/15 bg-surface">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-primary/80">
          Progress: {CHALLENGE_CURRENT} / {CHALLENGE_TARGET} days
        </p>

        <div className="mt-4 border-t border-surface pt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
            Scoring rules
          </h4>
          <ul className="space-y-1 text-xs text-primary/80">
            <li>Safety score: {(SCORING_RULES.safetyWeight * 100).toFixed(0)}% weight</li>
            <li>Fuel efficiency: {(SCORING_RULES.fuelWeight * 100).toFixed(0)}% weight</li>
            <li>On-time: {(SCORING_RULES.onTimeWeight * 100).toFixed(0)}% weight</li>
            <li>Faults penalty: {(SCORING_RULES.faultsPenaltyWeight * 100).toFixed(0)}%</li>
          </ul>
        </div>

        <div className="mt-3 border-t border-surface pt-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
            Badges
          </h4>
          <ul className="space-y-1 text-xs text-primary/80">
            {BADGES.map((b) => (
              <li key={b.id}>
                <strong className="text-primary">{b.id}:</strong> {b.desc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
