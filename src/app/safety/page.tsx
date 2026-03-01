"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDrivers, getTrucks } from "@/lib/fakeData";
import {
  getFleetReadiness,
  getCorrelationData,
  getConsecutiveDaysWorked,
  getHoursThisWeek,
  riskColor,
  riskBg,
  riskBorder,
  type DriverReadiness,
  type CorrelationPoint,
} from "@/lib/wellnessData";
import { FilterBar } from "@/components/FilterBar";
import { DashboardCard } from "@/components/DashboardCard";
import { ReadinessBadge } from "@/components/ReadinessBadge";
import { ManagerAlert } from "@/components/ManagerAlert";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function SafetyPage() {
  const [fleet, setFleet]   = useState<DriverReadiness[]>([]);
  const [corr,  setCorr]    = useState<CorrelationPoint[]>([]);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    const drivers = getDrivers();
    const trucks  = getTrucks();
    setFleet(getFleetReadiness(drivers, trucks));
    setCorr(getCorrelationData());
    setReady(true);
  }, []);

  const green     = fleet.filter((r) => r.riskLevel === "green").length;
  const yellow    = fleet.filter((r) => r.riskLevel === "yellow").length;
  const red       = fleet.filter((r) => r.riskLevel === "red").length;
  const noCheckin = fleet.filter((r) => r.checkin === null).length;
  const atRisk    = fleet.filter((r) => r.riskLevel !== "green");

  if (!ready) {
    return (
      <div className="min-h-full">
        <FilterBar />
        <div className="flex items-center justify-center p-20 text-sm text-primary/50">
          Loading fleet readiness…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <FilterBar />

      <div className="p-6 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary">Fleet Readiness — Today</h1>
            <p className="mt-0.5 text-sm text-primary/60">
              Composite score across driving history, hours, vehicle health, and driver wellness.
            </p>
          </div>
          <Link
            href="/checkin"
            className="border border-accent bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            Driver Check-In →
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard value={green}    label="Ready"          color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
          <KpiCard value={yellow}   label="Caution"        color="#ca8a04" bg="#fefce8" border="#fef08a" />
          <KpiCard value={red}      label="At Risk"        color="#dc2626" bg="#fef2f2" border="#fecaca" />
          <KpiCard value={noCheckin} label="No Check-In"   color="#25477b" bg="#eff2f7" border="#c7d4e8" />
        </div>

        {/* At-risk alerts */}
        {atRisk.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary/70">
              Drivers Needing Attention ({atRisk.length})
            </h2>
            <div className="space-y-3">
              {atRisk.map((r) => (
                <ManagerAlert key={r.driver.id} readiness={r} />
              ))}
            </div>
          </div>
        )}

        {/* Charts row */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Correlation scatter */}
          <DashboardCard title="Mood Score vs. Safety Score (last 7 days)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eff2f7" />
                  <XAxis
                    dataKey="moodScore"
                    name="Mood"
                    type="number"
                    domain={[0, 100]}
                    label={{ value: "Mood Score", position: "insideBottom", offset: -4, fontSize: 11, fill: "#25477b" }}
                    tick={{ fontSize: 10, fill: "#25477b" }}
                    stroke="#25477b"
                  />
                  <YAxis
                    dataKey="safetyScore"
                    name="Safety"
                    type="number"
                    domain={[65, 100]}
                    label={{ value: "Safety Score", angle: -90, position: "insideLeft", fontSize: 11, fill: "#25477b" }}
                    tick={{ fontSize: 10, fill: "#25477b" }}
                    stroke="#25477b"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7", fontSize: 12 }}
                    formatter={(value, name) => [value, name === "moodScore" ? "Mood" : "Safety"]}
                  />
                  <Scatter data={corr} name="Drivers">
                    {corr.map((point, i) => (
                      <Cell key={i} fill={riskColor(point.riskLevel)} fillOpacity={0.8} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="px-4 pb-3 text-xs text-primary/50">
              Trend: lower mood scores correlate with lower safety scores. Each dot is one driver.
            </p>
          </DashboardCard>

          {/* Score breakdown table */}
          <DashboardCard title="Readiness Breakdown — All Drivers">
            <div className="h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-left text-primary/60">
                    <th className="px-3 py-2 font-medium">Driver</th>
                    <th className="px-2 py-2 font-medium text-center">Bhvr</th>
                    <th className="px-2 py-2 font-medium text-center">HOS</th>
                    <th className="px-2 py-2 font-medium text-center">Veh</th>
                    <th className="px-2 py-2 font-medium text-center">Well</th>
                    <th className="px-2 py-2 font-medium text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {fleet.map((r) => (
                    <ReadinessRow key={r.driver.id} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        {/* HOS detail table */}
        <DashboardCard title="Hours of Service Status">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10 text-left text-xs text-primary/60">
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Truck</th>
                  <th className="px-4 py-3 font-medium text-center">Consecutive Days</th>
                  <th className="px-4 py-3 font-medium text-center">Hours This Week</th>
                  <th className="px-4 py-3 font-medium text-center">HOS Status</th>
                  <th className="px-4 py-3 font-medium text-center">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {fleet.map((r) => {
                  const days  = getConsecutiveDaysWorked(r.driver.id);
                  const hours = getHoursThisWeek(r.driver.id);
                  const hosOk = days <= 6 && hours <= 60;
                  return (
                    <tr key={r.driver.id} className="hover:bg-surface">
                      <td className="px-4 py-3 font-medium text-primary">{r.driver.name}</td>
                      <td className="px-4 py-3 text-primary/70">{r.truck.id}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={days >= 7 ? "font-bold text-red-600" : days >= 5 ? "text-yellow-600" : "text-primary/70"}>
                          {days}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={hours >= 65 ? "font-bold text-red-600" : hours >= 55 ? "text-yellow-600" : "text-primary/70"}>
                          {hours}h
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`border px-2 py-0.5 text-xs font-medium ${hosOk ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                          {hosOk ? "OK" : "Near Limit"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ReadinessBadge level={r.riskLevel} score={r.totalScore} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  value, label, color, bg, border,
}: {
  value: number; label: string; color: string; bg: string; border: string;
}) {
  return (
    <div className="border p-4 text-center" style={{ backgroundColor: bg, borderColor: border }}>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 text-xs font-medium text-primary/70">{label}</div>
    </div>
  );
}

function ScoreCell({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 55 ? "#ca8a04" : "#dc2626";
  return (
    <td className="px-2 py-2 text-center font-mono font-semibold tabular-nums" style={{ color }}>
      {score}
    </td>
  );
}

function ReadinessRow({ r }: { r: DriverReadiness }) {
  return (
    <tr className="hover:bg-surface">
      <td className="px-3 py-2 font-medium text-primary">
        {r.driver.name.split(" ")[0]}
        {r.checkin === null && (
          <span className="ml-1 text-primary/40 text-xs">(no check-in)</span>
        )}
      </td>
      <ScoreCell score={r.behavioralScore} />
      <ScoreCell score={r.complianceScore} />
      <ScoreCell score={r.vehicleScore} />
      <ScoreCell score={r.wellnessScore} />
      <td className="px-2 py-2 text-center">
        <ReadinessBadge level={r.riskLevel} score={r.totalScore} size="sm" />
      </td>
    </tr>
  );
}
