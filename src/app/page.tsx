"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getIdlingBreakdownByVehicleType,
  getFleetWeeklyMileageByMonth,
  getLast3MonthsFuelTrend,
  getTop5AggressiveDrivers,
  getTop5SeatbeltViolations,
  getDrivers,
  getTrucks,
  VEHICLE_TYPES,
  FUEL_MONTHS,
  DAY_NAMES,
  type VehicleType,
  type FuelMonth,
  type DayName,
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
  ReferenceLine,
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
const AVG_STROKE = "#f59e0b"; // amber/orange

type VehicleTypeFilter = VehicleType | null;
type MonthFilter = FuelMonth | null;
type DayFilter = DayName | null;

function useIsSmDown() {
  const [isSmDown, setIsSmDown] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsSmDown(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isSmDown;
}

function KpiCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl border border-primary/15 bg-surface p-4">
      <div className="text-xs font-medium text-primary/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-primary">{value}</div>
      {sublabel ? (
        <div className="mt-1 text-xs text-primary/60">{sublabel}</div>
      ) : null}
    </div>
  );
}

function applyFilters<T extends Record<string, any>>(
  rows: T[],
  vehicleType: VehicleTypeFilter,
  month: MonthFilter,
  day: DayFilter
): T[] {
  let out = rows;

  if (vehicleType && out.length && "vehicleType" in out[0]) {
    out = out.filter((r) => r.vehicleType === vehicleType);
  }
  if (month && out.length && "month" in out[0]) {
    out = out.filter((r) => r.month === month);
  }
  if (day && out.length && "day" in out[0]) {
    out = out.filter((r) => r.day === day);
  }

  return out;
}

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function DashboardPage() {
  const isSmDown = useIsSmDown();

  // Filters
  const [vehicleType, setVehicleType] = useState<VehicleTypeFilter>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>(null);
  const [selectedDay, setSelectedDay] = useState<DayFilter>(null);

  // Data loaded client-side to avoid hydration mismatch
  const [idlingData, setIdlingData] = useState<any[]>([]);
  const [mileageRaw, setMileageRaw] = useState<any[]>([]);
  const [fuelRaw, setFuelRaw] = useState<any[]>([]);
  const [aggressiveRaw, setAggressiveRaw] = useState<any[]>([]);
  const [seatbeltRaw, setSeatbeltRaw] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIdlingData(getIdlingBreakdownByVehicleType());
    setMileageRaw(getFleetWeeklyMileageByMonth());
    setFuelRaw(getLast3MonthsFuelTrend());
    setAggressiveRaw(getTop5AggressiveDrivers());
    setSeatbeltRaw(getTop5SeatbeltViolations());
    setIsLoaded(true);
  }, []);

  // --- Filtered datasets ---

  const mileageFiltered = useMemo(
    () => applyFilters(mileageRaw, vehicleType, selectedMonth, selectedDay),
    [mileageRaw, vehicleType, selectedMonth, selectedDay]
  );

  const mileageForChart = useMemo(
    () => applyFilters(mileageRaw, vehicleType, selectedMonth, null),
    [mileageRaw, vehicleType, selectedMonth]
  );

  const mileageChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of mileageForChart) {
      map.set(r.day, (map.get(r.day) ?? 0) + (r.miles ?? 0));
    }
    return DAY_NAMES.map((d) => ({ day: d, miles: map.get(d) ?? 0 }));
  }, [mileageForChart]);

  const fuelFiltered = useMemo(
    () => applyFilters(fuelRaw, vehicleType, selectedMonth, null),
    [fuelRaw, vehicleType, selectedMonth]
  );

  const fuelForChart = useMemo(
    () => applyFilters(fuelRaw, vehicleType, null, null),
    [fuelRaw, vehicleType]
  );

  const fuelChartData = useMemo(() => {
    const map = new Map<string, { month: string; fuelBurnt: number; trend: number }>();
    for (const r of fuelForChart) {
      const cur = map.get(r.month) ?? { month: r.month, fuelBurnt: 0, trend: 0 };
      cur.fuelBurnt += r.fuelBurnt ?? 0;
      cur.trend += r.trend ?? 0;
      map.set(r.month, cur);
    }
    return FUEL_MONTHS.map((m) => map.get(m) ?? { month: m, fuelBurnt: 0, trend: 0 });
  }, [fuelForChart]);

  const aggressiveFiltered = useMemo(
    () => applyFilters(aggressiveRaw, vehicleType, selectedMonth, selectedDay),
    [aggressiveRaw, vehicleType, selectedMonth, selectedDay]
  );

  const aggressiveData = useMemo(() => {
    return [...aggressiveFiltered]
      .sort(
        (a, b) =>
          b.harshBraking + b.harshCornering + b.hardAcceleration -
          (a.harshBraking + a.harshCornering + a.hardAcceleration)
      )
      .slice(0, 5);
  }, [aggressiveFiltered]);

  const seatbeltFiltered = useMemo(
    () => applyFilters(seatbeltRaw, vehicleType, selectedMonth, selectedDay),
    [seatbeltRaw, vehicleType, selectedMonth, selectedDay]
  );

  const seatbeltData = useMemo(() => {
    return [...seatbeltFiltered]
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .slice(0, 5);
  }, [seatbeltFiltered]);

  // --- KPIs ---
  const milesKpi = useMemo(
    () => mileageFiltered.reduce((sum, r) => sum + (r.miles ?? 0), 0),
    [mileageFiltered]
  );
  const fuelKpi = useMemo(
    () => fuelFiltered.reduce((sum, r) => sum + (r.fuelBurnt ?? 0), 0),
    [fuelFiltered]
  );
  const seatbeltKpi = useMemo(
    () => seatbeltFiltered.reduce((sum, r) => sum + (r.count ?? 0), 0),
    [seatbeltFiltered]
  );

  const anyFilterOn = vehicleType || selectedMonth || selectedDay;

  const mileageAvg = useMemo(() => average(mileageChartData.map((d) => d.miles)), [mileageChartData]);
  const seatbeltAvg = useMemo(() => average(seatbeltData.map((d) => d.count ?? 0)), [seatbeltData]);

  return (
    <div className="min-h-full">
      <FilterBar />

      <div className="px-6 pb-10 pt-8">
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-primary">Fleet Overview</div>

              <p className="mt-2 max-w-3xl text-sm text-primary/70">
                This dashboard gives a quick, at-a-glance view of fleet behavior across idling,
                mileage, fuel usage, and high-risk driver events. Use the dropdowns or click directly
                on chart segments (vehicle type, month, day) to filter the view and spot patterns or
                outliers worth investigating. By default, the dashboard shows{" "}
                <span className="font-medium text-primary">all vehicle types</span>,{" "}
                <span className="font-medium text-primary">all months</span>, and{" "}
                <span className="font-medium text-primary">all days</span>.
              </p>

              <div className="mt-2 text-sm text-primary/60">
                {anyFilterOn ? (
                  <>
                    Vehicle:{" "}
                    <span className="font-medium text-primary">{vehicleType ?? "All"}</span>
                    {" · "}
                    Month:{" "}
                    <span className="font-medium text-primary">{selectedMonth ?? "All"}</span>
                    {" · "}
                    Day:{" "}
                    <span className="font-medium text-primary">{selectedDay ?? "All"}</span>
                  </>
                ) : (
                  "All vehicle types · All months · All days"
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm"
                value={vehicleType ?? ""}
                onChange={(e) => setVehicleType((e.target.value || null) as VehicleTypeFilter)}
              >
                <option value="">All vehicles</option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm"
                value={selectedMonth ?? ""}
                onChange={(e) => setSelectedMonth((e.target.value || null) as MonthFilter)}
              >
                <option value="">All months</option>
                {FUEL_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm"
                value={selectedDay ?? ""}
                onChange={(e) => setSelectedDay((e.target.value || null) as DayFilter)}
              >
                <option value="">All days</option>
                {DAY_NAMES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {anyFilterOn ? (
                <button
                  type="button"
                  onClick={() => {
                    setVehicleType(null);
                    setSelectedMonth(null);
                    setSelectedDay(null);
                  }}
                  className="rounded-lg border border-primary/15 bg-surface px-3 py-2 text-sm font-medium text-accent hover:bg-primary/5"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Total miles"
              value={isLoaded ? milesKpi.toLocaleString() : "—"}
              sublabel="Unit: miles (weekly totals)"
            />
            <KpiCard
              label="Fuel burnt"
              value={isLoaded ? fuelKpi.toLocaleString() : "—"}
              sublabel="Unit: liters (demo)"
            />
            <KpiCard
              label="Seatbelt incidents"
              value={isLoaded ? seatbeltKpi.toLocaleString() : "—"}
              sublabel="Count (demo)"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard title="Idling Breakdown by Vehicle Type">
            <div className="h-72 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={idlingData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isSmDown ? 62 : 70}
                    label={isSmDown ? false : ({ name, value }: any) => `${name}: ${value}%`}
                    onClick={(slice: any) => {
                      const clicked = (slice?.name ?? slice?.payload?.name) as VehicleType | undefined;
                      if (!clicked) return;
                      setVehicleType((prev) => (prev === clicked ? null : clicked));
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {idlingData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                  {!isSmDown ? <Legend wrapperStyle={{ fontSize: "11px" }} /> : null}
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-primary/60">Click a slice to filter vehicle type.</div>
          </DashboardCard>

          <DashboardCard title="Fleet Weekly Mileage">
            <div className="h-72 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mileageChartData} layout="vertical" margin={{ left: 24, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis
                    type="category"
                    dataKey="day"
                    width={isSmDown ? 28 : 40}
                    tick={{ fontSize: 11, fill: "#25477b" }}
                    stroke="#25477b"
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />

                  {/* Draw bars first */}
                  <Bar dataKey="miles" fill={BAR_FILL} cursor="pointer">
                    {mileageChartData.map((entry: any, idx: number) => (
                      <Cell
                        key={`mile-cell-${idx}`}
                        fillOpacity={selectedDay && entry.day !== selectedDay ? 0.35 : 1}
                        onClick={() => {
                          const d = entry.day as DayName;
                          setSelectedDay((prev) => (prev === d ? null : d));
                        }}
                      />
                    ))}
                  </Bar>

                  {/* Draw avg line last so it sits on top */}
                  <ReferenceLine
                    x={mileageAvg}
                    stroke={AVG_STROKE}
                    strokeWidth={5}
                    strokeDasharray="7"
                    label={{
                      value: "Avg",
                      position: "insideTopLeft",
                      fill: AVG_STROKE,
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-primary/60">
              Click a day to filter. Orange line = average.
            </div>
          </DashboardCard>

          <DashboardCard title="Fuel Burn Trend (3 months)">
            <div className="h-72 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fuelChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />

                  <Bar dataKey="fuelBurnt" fill="#eff2f7" cursor="pointer">
                    {fuelChartData.map((entry: any, idx: number) => (
                      <Cell
                        key={`fuel-cell-${idx}`}
                        fillOpacity={selectedMonth && entry.month !== selectedMonth ? 0.35 : 1}
                        onClick={() => {
                          const m = entry.month as FuelMonth;
                          setSelectedMonth((prev) => (prev === m ? null : m));
                        }}
                      />
                    ))}
                  </Bar>

                  <Line type="monotone" dataKey="trend" stroke={LINE_STROKE} strokeWidth={2} dot={isSmDown ? false : true} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-primary/60">Click a month to filter. Unit: liters (demo).</div>
          </DashboardCard>

          <DashboardCard title="Top 5 Aggressive Drivers">
            <div className="h-72 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggressiveData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis
                    type="category"
                    dataKey="driver"
                    width={isSmDown ? 56 : 80}
                    tick={{ fontSize: 10, fill: "#25477b" }}
                    stroke="#25477b"
                    tickFormatter={(v) => (isSmDown && typeof v === "string" ? v.split(" ")[0] : v)}
                  />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                  {!isSmDown ? <Legend wrapperStyle={{ fontSize: "10px" }} /> : null}
                  <Bar dataKey="harshBraking" stackId="a" fill="#25477b" name="Harsh Braking" />
                  <Bar dataKey="harshCornering" stackId="a" fill="#0078d3" name="Harsh Cornering" />
                  <Bar dataKey="hardAcceleration" stackId="a" fill="#eff2f7" name="Hard Acceleration" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard title="Top 5 Seatbelt Violations">
            <div className="h-72 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seatbeltData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="driver"
                    tick={{ fontSize: 10, fill: "#25477b" }}
                    stroke="#25477b"
                    tickFormatter={(v) => (isSmDown && typeof v === "string" ? v.split(" ")[0] : v)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />

                  {/* Draw bars first */}
                  <Bar dataKey="count" fill={BAR_FILL} name="Incident Count" />

                  {/* Draw avg line last so it sits on top */}
                  <ReferenceLine
                    y={seatbeltAvg}
                    stroke={AVG_STROKE}
                    strokeWidth={5}
                    strokeDasharray="7"
                    label={{
                      value: "Avg",
                      position: "insideBottomRight",
                      fill: AVG_STROKE,
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-primary/60">Orange line = average (top 5).</div>
          </DashboardCard>

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