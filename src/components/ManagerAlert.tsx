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
      {/* Header: risk badge on top, name + truck below */}
      <div className="flex flex-col gap-2 border-b px-4 py-3" style={{ borderColor: border }}>
        <ReadinessBadge level={riskLevel} score={totalScore} />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-primary block">{driver.name}</span>
          <span className="text-xs text-primary/50 block">{driver.truckId}{days}</span>
        </div>
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
      <div className="px-4 pt-3">
        <p className="text-xs text-primary/70">
          <span className="font-semibold text-primary">Recommended: </span>
          {action}
        </p>
      </div>

      {/* Acknowledge at bottom */}
      <div className="px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={() => setAcknowledged(true)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
