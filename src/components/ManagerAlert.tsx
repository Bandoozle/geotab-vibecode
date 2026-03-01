"use client";

import { useState } from "react";
import { ReadinessBadge } from "@/components/ReadinessBadge";
import { riskColor, riskBg, riskBorder, type DriverReadiness } from "@/lib/wellnessData";

const TRIGGER_LABELS: Record<string, string> = {
  behavioral: "Driving history",
  compliance: "Hours / HOS",
  vehicle:    "Vehicle fault",
  wellness:   "Self-reported",
};

const RECOMMENDED_ACTION: Record<string, string> = {
  behavioral: "Review recent safety events with driver before route.",
  compliance: "Driver is near HOS limits — consider reassigning or shortening route.",
  vehicle:    "Confirm vehicle fault is resolved with maintenance.",
  wellness:   "Check in personally — driver reported feeling off.",
};

interface ManagerAlertProps {
  readiness: DriverReadiness;
}

export function ManagerAlert({ readiness }: ManagerAlertProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const { driver, riskLevel, totalScore, triggers, complianceScore } = readiness;

  const color  = riskColor(riskLevel);
  const bg     = riskBg(riskLevel);
  const border = riskBorder(riskLevel);
  const primaryTrigger = triggers[0];
  const action = primaryTrigger ? RECOMMENDED_ACTION[primaryTrigger] : "Check in with driver before their route.";

  const days  = complianceScore < 52 ? ` — ${readiness.truck.id}` : "";

  if (acknowledged) {
    return (
      <div className="flex items-center justify-between border border-primary/10 bg-surface px-4 py-3 text-sm text-primary/50">
        <span>
          <span className="font-medium text-primary/70">{driver.name}</span> — acknowledged
        </span>
        <button
          onClick={() => setAcknowledged(false)}
          className="text-xs text-primary/40 hover:text-primary/70"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="border" style={{ borderColor: border, backgroundColor: bg }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: border }}>
        <div className="flex items-center gap-3">
          <ReadinessBadge level={riskLevel} score={totalScore} />
          <div>
            <span className="text-sm font-semibold text-primary">{driver.name}</span>
            <span className="ml-2 text-xs text-primary/50">{driver.truckId}{days}</span>
          </div>
        </div>
        <button
          onClick={() => setAcknowledged(true)}
          className="border border-primary/20 bg-white px-3 py-1 text-xs font-medium text-primary hover:bg-surface transition-colors"
        >
          Acknowledge
        </button>
      </div>

      {/* Triggered dimensions */}
      {triggers.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {triggers.map((t) => (
            <span
              key={t}
              className="border px-2 py-0.5 text-xs font-medium"
              style={{ color, borderColor: border }}
            >
              {TRIGGER_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      )}

      {/* Recommended action */}
      <div className="px-4 py-3">
        <p className="text-xs text-primary/70">
          <span className="font-semibold text-primary">Recommended: </span>
          {action}
        </p>
      </div>
    </div>
  );
}
