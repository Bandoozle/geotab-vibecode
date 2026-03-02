"use client";

import { useMemo } from "react";
import type { DashboardFilters } from "@/components/dashboard/types";
import type { DriverReadiness } from "@/lib/wellnessData";

import { DashboardCard } from "@/components/DashboardCard";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Line,
} from "recharts";

const GRID_STROKE = "#eff2f7";

type MileageRow = { miles?: number | null; day?: any; month?: any; vehicleType?: any; [k: string]: any };
type FuelRow = { fuelBurnt?: number | null; trend?: number | null; month?: any; [k: string]: any };
type SeatbeltRow = { driver?: string | null; count?: number | null; [k: string]: any };

export function OverviewTab({
  isLoaded,
  readinessRaw,
  mileageRaw,
  fuelRaw,
  seatbeltRaw,
  filters,
  setFilters,
}: {
  isLoaded: boolean;
  readinessRaw: DriverReadiness[];
  mileageRaw: MileageRow[];
  fuelRaw: FuelRow[];
  seatbeltRaw: SeatbeltRow[];
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
}) {
  const readiness = useMemo(() => readinessRaw ?? [], [readinessRaw]);

  // ✅ No group filtering
  const mileageAll = useMemo(() => mileageRaw ?? [], [mileageRaw]);
  const fuelAll = useMemo(() => fuelRaw ?? [], [fuelRaw]);
  const seatbeltAll = useMemo(() => seatbeltRaw ?? [], [seatbeltRaw]);

  const totalMiles = useMemo(
    () => mileageAll.reduce((s, r) => s + Number(r.miles ?? 0), 0),
    [mileageAll]
  );

  const totalFuel = useMemo(
    () => fuelAll.reduce((s, r) => s + Number(r.fuelBurnt ?? 0), 0),
    [fuelAll]
  );

  const seatbeltTotal = useMemo(
    () => seatbeltAll.reduce((s, r) => s + Number(r.count ?? 0), 0),
    [seatbeltAll]
  );

  // Risk summary (click bar = risk filter) ✅ keep this
  const riskBars = useMemo(() => {
    const green = readiness.filter((r) => r.riskLevel === "green").length;
    const yellow = readiness.filter((r) => r.riskLevel === "yellow").length;
    const red = readiness.filter((r) => r.riskLevel === "red").length;
    const noCheckin = readiness.filter((r) => r.checkin === null).length;

    return [
      { risk: "green", count: green },
      { risk: "yellow", count: yellow },
      { risk: "red", count: red },
      { risk: "noCheckin", count: noCheckin },
    ];
  }, [readiness]);

  // Fuel by month trend (aggregated)
  const fuelByMonth = useMemo(() => {
    const m = new Map<string, { month: string; fuelBurnt: number; trend: number }>();

    (fuelAll ?? []).forEach((r) => {
      const key = String(r.month ?? "Unknown");
      const cur = m.get(key) ?? { month: key, fuelBurnt: 0, trend: 0 };
      cur.fuelBurnt += Number(r.fuelBurnt ?? 0);
      cur.trend += Number(r.trend ?? 0);
      m.set(key, cur);
    });

    const out: { month: string; fuelBurnt: number; trend: number }[] = [];
    m.forEach((v) => out.push(v));
    out.sort((a, b) => a.month.localeCompare(b.month));
    return out;
  }, [fuelAll]);

  // Seatbelt by driver (top)
  const seatbeltTop = useMemo(() => {
    const rows = [...(seatbeltAll ?? [])];
    rows.sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0));
    return rows.slice(0, 8);
  }, [seatbeltAll]);

  const kpis = useMemo(
    () => [
      { label: "Total miles", value: totalMiles.toLocaleString() },
      { label: "Fuel burnt", value: totalFuel.toLocaleString() },
      { label: "Seatbelt incidents", value: seatbeltTotal.toLocaleString() },
    ],
    [totalMiles, totalFuel, seatbeltTotal]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* KPI summary */}
      <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-primary/15 bg-surface p-4">
            <div className="text-xs font-medium text-primary/60">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {isLoaded ? k.value : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Fleet readiness counts */}
      <DashboardCard title="Fleet Readiness (click bar = risk filter)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskBars} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="risk" tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
              <YAxis tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
              <Bar
                dataKey="count"
                fill="#25477b"
                cursor="pointer"
                onClick={(bar: any) => {
                  const r = bar?.risk as string | undefined;
                  if (!r || r === "noCheckin") return;

                  setFilters((prev) => ({
                    ...prev,
                    risk: prev.risk === (r as any) ? "all" : (r as any),
                  }));
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-xs text-primary/60">
          Current risk filter: <span className="font-medium text-primary">{filters.risk}</span>
        </div>
      </DashboardCard>

      {/* Fuel trend */}
      <DashboardCard title="Fuel trend summary">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={fuelByMonth} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
              <YAxis tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
              <Bar dataKey="fuelBurnt" fill="#eff2f7" />
              <Line type="monotone" dataKey="trend" stroke="#0078d3" strokeWidth={2} dot />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      {/* Seatbelt top drivers */}
      <DashboardCard title="Seatbelt outliers (top drivers)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seatbeltTop} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="driver" tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
              <YAxis tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
              <Bar dataKey="count" fill="#25477b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      {!isLoaded ? <div className="lg:col-span-2 text-sm text-primary/60">Loading…</div> : null}
    </div>
  );
}