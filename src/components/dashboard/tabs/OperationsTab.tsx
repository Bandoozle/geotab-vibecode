"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardCard } from "@/components/DashboardCard";

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

import type { DashboardFilters } from "@/components/dashboard/types";
import { applyGenericFilters, avg, groupSum } from "@/components/dashboard/utils";

const PIE_COLORS = ["#25477b", "#0078d3", "#5a7ba8", "#3d8fd9", "#7aaafd"];
const BAR_FILL = "#25477b";
const LINE_STROKE = "#0078d3";
const GRID_STROKE = "#eff2f7";
const AVG_STROKE = "#f59e0b";

type AnyRow = Record<string, any>;

type DayName = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
const DAY_ORDER: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function uniqStrings(values: unknown[]) {
  const s = new Set<string>();
  for (const v of values) {
    const str = v == null ? "" : String(v);
    if (str) s.add(str);
  }
  return [...s];
}

function sortDaysSmart(days: string[]) {
  const set = new Set(days);
  const standard = DAY_ORDER.filter((d) => set.has(d));
  if (standard.length) return standard;
  return [...days].sort((a, b) => a.localeCompare(b));
}

function sortMonthsLex(months: string[]) {
  return [...months].sort((a, b) => a.localeCompare(b));
}

function useIsSmDown() {
  const [isSmDown, setIsSmDown] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(max-width: 639px)");
    if (!mql) return;

    const update = () => setIsSmDown(mql.matches);
    update();

    // eslint-disable-next-line deprecation/deprecation
    if (mql.addEventListener) mql.addEventListener("change", update);
    // eslint-disable-next-line deprecation/deprecation
    else mql.addListener(update);

    return () => {
      // eslint-disable-next-line deprecation/deprecation
      if (mql.removeEventListener) mql.removeEventListener("change", update);
      // eslint-disable-next-line deprecation/deprecation
      else mql.removeListener(update);
    };
  }, []);

  return isSmDown;
}

export function OperationsTab({
  isLoaded,
  idlingRaw,
  mileageRaw,
  fuelRaw,
  aggressiveRaw,
  seatbeltRaw,
  filters,
  setFilters,
}: {
  isLoaded: boolean;

  // Firestore arrays
  idlingRaw: Array<{ name?: unknown; value?: number } & AnyRow>;
  mileageRaw: Array<{ day?: unknown; miles?: number } & AnyRow>;
  fuelRaw: Array<{ month?: unknown; fuelBurnt?: number; trend?: number } & AnyRow>;
  aggressiveRaw: Array<
    {
      driver?: string;
      harshBraking?: number;
      harshCornering?: number;
      hardAcceleration?: number;
    } & AnyRow
  >;
  seatbeltRaw: Array<{ driver?: string; count?: number } & AnyRow>;

  // still passed in, but we won't use group filters anymore
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
}) {
  const isSmDown = useIsSmDown();

  const mileageAll = useMemo(
    () => applyGenericFilters(mileageRaw ?? [], filters),
    [mileageRaw, filters]
  );
  const fuelAll = useMemo(
    () => applyGenericFilters(fuelRaw ?? [], filters),
    [fuelRaw, filters]
  );
  const aggressiveAll = useMemo(
    () => applyGenericFilters(aggressiveRaw ?? [], filters),
    [aggressiveRaw, filters]
  );
  const seatbeltAll = useMemo(
    () => applyGenericFilters(seatbeltRaw ?? [], filters),
    [seatbeltRaw, filters]
  );
  const idlingData = useMemo(
    () => applyGenericFilters((idlingRaw ?? []).filter(Boolean), filters),
    [idlingRaw, filters]
  );

  const dayKeys = useMemo(() => {
    const rawDays = uniqStrings((mileageAll ?? []).map((r) => r.day));
    const ordered = rawDays.length ? sortDaysSmart(rawDays) : DAY_ORDER;
    return ordered as string[];
  }, [mileageAll]);

  const mileageChartData = useMemo(() => {
    const byDay = groupSum(mileageAll ?? [], "day", "miles");
    const keys = dayKeys.length ? dayKeys : DAY_ORDER;
    return keys.map((d) => ({ day: d, miles: byDay[d] ?? 0 }));
  }, [mileageAll, dayKeys]);

  const mileageAvg = useMemo(
    () => avg(mileageChartData.map((d) => Number(d.miles ?? 0))),
    [mileageChartData]
  );

  const monthKeys = useMemo(() => {
    const rawMonths = uniqStrings((fuelAll ?? []).map((r) => r.month));
    return rawMonths.length ? sortMonthsLex(rawMonths) : [];
  }, [fuelAll]);

  const fuelChartData = useMemo(() => {
    const sumBurn: Record<string, number> = {};
    const sumTrend: Record<string, number> = {};

    for (const r of fuelAll ?? []) {
      const m = r.month == null ? "" : String(r.month);
      if (!m) continue;
      sumBurn[m] = (sumBurn[m] ?? 0) + (Number(r.fuelBurnt ?? 0) || 0);
      sumTrend[m] = (sumTrend[m] ?? 0) + (Number(r.trend ?? 0) || 0);
    }

    const keys = monthKeys.length ? monthKeys : Object.keys(sumBurn).sort((a, b) => a.localeCompare(b));
    const last3 = keys.slice(Math.max(0, keys.length - 3));

    return last3.map((m) => ({
      month: m,
      fuelBurnt: sumBurn[m] ?? 0,
      trend: sumTrend[m] ?? 0,
    }));
  }, [fuelAll, monthKeys]);

  const aggressiveTop = useMemo(() => {
    return [...(aggressiveAll ?? [])]
      .sort((a, b) => {
        const bTot =
          (Number(b.harshBraking ?? 0) || 0) +
          (Number(b.harshCornering ?? 0) || 0) +
          (Number(b.hardAcceleration ?? 0) || 0);
        const aTot =
          (Number(a.harshBraking ?? 0) || 0) +
          (Number(a.harshCornering ?? 0) || 0) +
          (Number(a.hardAcceleration ?? 0) || 0);
        return bTot - aTot;
      })
      .slice(0, 5);
  }, [aggressiveAll]);

  const seatbeltTop = useMemo(() => {
    return [...(seatbeltAll ?? [])]
      .sort((a, b) => (Number(b.count ?? 0) || 0) - (Number(a.count ?? 0) || 0))
      .slice(0, 5);
  }, [seatbeltAll]);

  const seatbeltAvg = useMemo(
    () => avg(seatbeltTop.map((d) => Number(d.count ?? 0))),
    [seatbeltTop]
  );

  // KPI cards
  const kpiMileageTotal = useMemo(() => {
    if (!isLoaded) return null;
    return (mileageAll ?? []).reduce((s, r) => s + (Number(r.miles ?? 0) || 0), 0);
  }, [isLoaded, mileageAll]);

  const kpiFuelTotal = useMemo(() => {
    if (!isLoaded) return null;
    return (fuelAll ?? []).reduce((s, r) => s + (Number(r.fuelBurnt ?? 0) || 0), 0);
  }, [isLoaded, fuelAll]);

  const kpiAggressiveEvents = useMemo(() => {
    if (!isLoaded) return null;
    return (aggressiveAll ?? []).reduce((s, r) => {
      const total =
        (Number(r.harshBraking ?? 0) || 0) +
        (Number(r.harshCornering ?? 0) || 0) +
        (Number(r.hardAcceleration ?? 0) || 0);
      return s + total;
    }, 0);
  }, [isLoaded, aggressiveAll]);

  return (
    <div className="ops-tab grid gap-6">
      <style jsx global>{`
        .ops-tab button[aria-label*="More"],
        .ops-tab button[aria-label*="more"],
        .ops-tab button[aria-label*="Options"],
        .ops-tab button[aria-label*="options"],
        .ops-tab button[aria-haspopup="menu"] {
          display: none !important;
        }
      `}</style>

      {/* KPI row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <DashboardCard title="Mileage total">
          <div className="rounded-xl border border-primary/15 bg-surface p-4">
            <div className="text-xs font-medium text-primary/60">Total miles</div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {kpiMileageTotal === null ? "—" : kpiMileageTotal.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-primary/60">Spot workload spikes fast</div>
          </div>
        </DashboardCard>

        <DashboardCard title="Fuel total">
          <div className="rounded-xl border border-primary/15 bg-surface p-4">
            <div className="text-xs font-medium text-primary/60">Fuel burnt</div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {kpiFuelTotal === null ? "—" : kpiFuelTotal.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-primary/60">Detect inefficiency</div>
          </div>
        </DashboardCard>

        <DashboardCard title="Aggressive events">
          <div className="rounded-xl border border-primary/15 bg-surface p-4">
            <div className="text-xs font-medium text-primary/60">Total events</div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {kpiAggressiveEvents === null ? "—" : kpiAggressiveEvents.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-primary/60">Coaching priority signal</div>
          </div>
        </DashboardCard>
      </div>

      {/* Charts */}
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
                  label={
                    isSmDown
                      ? false
                      : ({ name, value, percent }: any) =>
                          percent && percent < 0.05
                            ? ""
                            : `${String(name ?? "")} : ${Number(value ?? 0).toLocaleString()}`
                  }
                  labelLine={false}
                >
                  {idlingData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                {!isSmDown ? <Legend wrapperStyle={{ fontSize: "11px" }} /> : null}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-primary/60">No vehicle-type filtering (view-only).</div>
        </DashboardCard>

        <DashboardCard title="Fleet Weekly Mileage (by day)">
          <div className="h-72 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mileageChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                <Bar dataKey="miles" fill={BAR_FILL} />
                <ReferenceLine
                  y={mileageAvg}
                  stroke={AVG_STROKE}
                  strokeWidth={5}
                  strokeDasharray="7"
                  label={{
                    value: "Avg",
                    position: "insideTopRight",
                    fill: AVG_STROKE,
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-primary/60">No day filtering (view-only).</div>
        </DashboardCard>

        <DashboardCard title="Fuel Burn Trend (last 3 months)">
          <div className="h-72 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fuelChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                <Bar dataKey="fuelBurnt" fill="#eff2f7" />
                <Line type="monotone" dataKey="trend" stroke={LINE_STROKE} strokeWidth={2} dot={!isSmDown} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-primary/60">No month filtering (view-only).</div>
        </DashboardCard>

        <DashboardCard title="Top 5 Aggressive Drivers (events)">
          <div className="h-72 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggressiveTop} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="driver"
                  width={isSmDown ? 56 : 80}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => (isSmDown && typeof v === "string" ? v.split(" ")[0] : v)}
                />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                {!isSmDown ? <Legend wrapperStyle={{ fontSize: "10px" }} /> : null}
                <Bar dataKey="harshBraking" stackId="a" fill="#25477b" name="Harsh Braking" />
                <Bar dataKey="harshCornering" stackId="a" fill="#0078d3" name="Harsh Cornering" />
                <Bar dataKey="hardAcceleration" stackId="a" fill="#7aaafd" name="Hard Acceleration" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-primary/60">No group filtering (view-only).</div>
        </DashboardCard>

        <DashboardCard title="Top 5 Seatbelt Violations">
          <div className="h-72 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seatbeltTop} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="driver"
                  width={isSmDown ? 56 : 90}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => (isSmDown && typeof v === "string" ? v.split(" ")[0] : v)}
                />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                <Bar dataKey="count" fill={BAR_FILL} name="Incidents" />
                <ReferenceLine
                  x={seatbeltAvg}
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
          <div className="mt-3 text-xs text-primary/60">No group filtering (view-only).</div>
        </DashboardCard>
      </div>
    </div>
  );
}