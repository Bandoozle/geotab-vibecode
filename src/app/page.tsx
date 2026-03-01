"use client";

import {
  getIdlingBreakdownByVehicleType,
  getFleetMileageLastWeek,
  getLast3MonthsFuelTrend,
  getTop5AggressiveDrivers,
  getTop5SeatbeltViolations,
  getDrivers,
  getTrucks,
} from "@/lib/fakeData";
import { getFleetReadiness } from "@/lib/wellnessData";
import { ManagerAlert } from "@/components/ManagerAlert";
import { useState, useEffect } from "react";
import type { DriverReadiness } from "@/lib/wellnessData";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { DashboardCard } from "@/components/DashboardCard";
import { DriverChallenge } from "@/components/DriverChallenge";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from "recharts";

function ReadinessKpi({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div className="py-3 text-center" style={{ backgroundColor: bg }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-primary/60">{label}</div>
    </div>
  );
}

const PIE_COLORS = ["#25477b", "#0078d3", "#5a7ba8", "#3d8fd9", "#eff2f7"];
const BAR_FILL = "#25477b";
const LINE_STROKE = "#0078d3";
const GRID_STROKE = "#eff2f7";

export default function DashboardPage() {
  const idlingData    = getIdlingBreakdownByVehicleType();
  const mileageData   = getFleetMileageLastWeek();
  const fuelData      = getLast3MonthsFuelTrend();
  const aggressiveData = getTop5AggressiveDrivers();
  const seatbeltData  = getTop5SeatbeltViolations();

  // Computed client-side only to avoid SSR hydration mismatch
  // (fakeData's seeded RNG is module-level state shared across server requests)
  const [wellness, setWellness] = useState<{
    green: number; yellow: number; red: number; redDrivers: DriverReadiness[];
  }>({ green: 0, yellow: 0, red: 0, redDrivers: [] });

  useEffect(() => {
    const fleet = getFleetReadiness(getDrivers(), getTrucks());
    setWellness({
      green:      fleet.filter((r) => r.riskLevel === "green").length,
      yellow:     fleet.filter((r) => r.riskLevel === "yellow").length,
      red:        fleet.filter((r) => r.riskLevel === "red").length,
      redDrivers: fleet.filter((r) => r.riskLevel === "red"),
    });
  }, []);

  return (
    <div className="min-h-full">
      <FilterBar />

      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Idling Breakdown by Vehicle Type */}
          <DashboardCard title="Idling Breakdown by Vehicle Type">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={idlingData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {idlingData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                    itemStyle={{ color: "#25477b" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Fleet Mileage (last week) - horizontal bar */}
          <DashboardCard title="Fleet Mileage (last week)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mileageData}
                  layout="vertical"
                  margin={{ left: 32, right: 16 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis type="category" dataKey="day" width={32} tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Bar dataKey="miles" fill={BAR_FILL} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Last 3 Months Fuel Trend - vertical bar + line */}
          <DashboardCard title="Last 3 Months Fuel Trend">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fuelData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Bar dataKey="fuelBurnt" fill="#eff2f7" />
                  <Line type="monotone" dataKey="trend" stroke={LINE_STROKE} strokeWidth={2} dot={{ fill: LINE_STROKE }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Top 5 Aggressive Drivers - stacked bar */}
          <DashboardCard title="Top 5 Aggressive Drivers">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggressiveData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  layout="vertical"
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis type="category" dataKey="driver" width={70} tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="harshBraking" stackId="a" fill="#25477b" name="Harsh Braking" />
                  <Bar dataKey="harshCornering" stackId="a" fill="#0078d3" name="Harsh Cornering" />
                  <Bar dataKey="hardAcceleration" stackId="a" fill="#eff2f7" name="Hard Acceleration" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Top 5 Seatbelt Violations */}
          <DashboardCard title="Top 5 Seatbelt Violations">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seatbeltData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="driver" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Bar dataKey="count" fill={BAR_FILL} name="Incident Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Gamification: Driver Challenge + link to Leaderboard */}
          <div className="sm:col-span-2 lg:col-span-1">
            <DriverChallenge />
            <Link
              href="/leaderboard"
              className="mt-4 block border border-primary/15 bg-surface px-4 py-3 text-center text-sm font-medium text-accent hover:bg-primary/5"
            >
              View Leaderboard →
            </Link>
          </div>

          {/* Fleet Readiness widget */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="border border-primary/15 bg-white">
              <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
                <span className="text-sm font-semibold text-primary">Fleet Readiness Today</span>
                <Link href="/safety" className="text-xs font-medium text-accent hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-3 divide-x divide-primary/10">
                <ReadinessKpi value={wellness.green}  label="Ready"   color="#16a34a" bg="#f0fdf4" />
                <ReadinessKpi value={wellness.yellow} label="Caution" color="#ca8a04" bg="#fefce8" />
                <ReadinessKpi value={wellness.red}    label="At Risk" color="#dc2626" bg="#fef2f2" />
              </div>
              <div className="border-t border-primary/10 px-4 py-2">
                <Link
                  href="/checkin"
                  className="block text-center text-xs font-medium text-accent hover:underline"
                >
                  Driver Check-In →
                </Link>
              </div>
            </div>
          </div>

          {/* Red driver alerts (full width if any) */}
          {wellness.redDrivers.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-red-700">
                  {wellness.redDrivers.length} driver{wellness.redDrivers.length > 1 ? "s" : ""} flagged At Risk
                </span>
                <Link href="/safety" className="text-xs font-medium text-accent hover:underline">
                  See full report →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {wellness.redDrivers.map((r) => (
                  <ManagerAlert key={r.driver.id} readiness={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
