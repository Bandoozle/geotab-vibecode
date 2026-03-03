"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { DashboardFilters } from "@/components/dashboard/types";
import { matchesReadinessFilters } from "@/components/dashboard/utils";
import type { DriverReadiness, RiskLevel } from "@/lib/wellnessData";

import { DashboardCard } from "@/components/DashboardCard";
import { ManagerAlert } from "@/components/ManagerAlert";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444", "#94a3b8"];
const GRID_STROKE = "#eff2f7";
const AVG_STROKE = "#f59e0b";
const AXIS_STROKE = "#25477b";

function safeNum(n: any) {
  return Number.isFinite(Number(n)) ? Number(n) : 0;
}
function fmt(n: number) {
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseDateKeyFromTimestamp(ts?: string | null) {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return dateKeyLocal(d);
}

function pctChange(today: number, yesterday: number) {
  if (!yesterday && !today) return 0;
  if (!yesterday) return 100;
  return ((today - yesterday) / yesterday) * 100;
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

export function SafetyWellnessTab({
  isLoaded,
  readinessRaw,
  filters,
  setFilters,
}: {
  isLoaded: boolean;
  readinessRaw: DriverReadiness[];
  filters: DashboardFilters;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
}) {

  const readiness = useMemo(() => readinessRaw ?? [], [readinessRaw]);

  const filtered = useMemo(
    () => readiness.filter((r) => matchesReadinessFilters(r, filters)),
    [readiness, filters]
  );

  const todayKey = useMemo(() => dateKeyLocal(new Date()), []);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateKeyLocal(d);
  }, []);

  const checkinTodayCount = useMemo(() => {
    return filtered.filter(
      (r) => parseDateKeyFromTimestamp(r.checkin?.timestamp) === todayKey
    ).length;
  }, [filtered, todayKey]);

  const checkinYesterdayCount = useMemo(() => {
    return filtered.filter(
      (r) => parseDateKeyFromTimestamp(r.checkin?.timestamp) === yesterdayKey
    ).length;
  }, [filtered, yesterdayKey]);

  const checkinCompletionRate = useMemo(() => {
    const denom = filtered.length || 1;
    return Math.round((checkinTodayCount / denom) * 100);
  }, [filtered.length, checkinTodayCount]);

  const riskCounts = useMemo(() => {
    const green = filtered.filter((r) => r.riskLevel === "green").length;
    const yellow = filtered.filter((r) => r.riskLevel === "yellow").length;
    const red = filtered.filter((r) => r.riskLevel === "red").length;
    const noCheckin = filtered.filter((r) => r.checkin === null).length;

    return [
      { name: "Ready (green)", value: green, key: "green" as RiskLevel },
      { name: "Caution (yellow)", value: yellow, key: "yellow" as RiskLevel },
      { name: "At Risk (red)", value: red, key: "red" as RiskLevel },
      { name: "No Check-In", value: noCheckin, key: "all" as const },
    ];
  }, [filtered]);

  const riskCountsYesterday = useMemo(() => {
    const y = filtered.filter(
      (r) => parseDateKeyFromTimestamp(r.checkin?.timestamp) === yesterdayKey
    );

    const green = y.filter((r) => r.riskLevel === "green").length;
    const yellow = y.filter((r) => r.riskLevel === "yellow").length;
    const red = y.filter((r) => r.riskLevel === "red").length;
    const noCheckin = y.filter((r) => r.checkin === null).length;

    return { green, yellow, red, noCheckin, total: y.length };
  }, [filtered, yesterdayKey]);

  const todayRiskMap = useMemo(() => {
    const map: Record<string, number> = { green: 0, yellow: 0, red: 0, all: 0 };
    (riskCounts ?? []).forEach((r: any) => {
      map[String(r.key)] = safeNum(r.value);
    });
    return map;
  }, [riskCounts]);

  const [riskActiveIndex, setRiskActiveIndex] = useState(0);
  const riskPinned = useMemo(() => {
    if (!riskCounts?.length) return null;
    return riskCounts[Math.min(riskActiveIndex, riskCounts.length - 1)] as any;
  }, [riskCounts, riskActiveIndex]);

  const toggleRisk = (risk: RiskLevel | "all") => {
    setFilters((prev) => ({ ...prev, risk: prev.risk === risk ? "all" : risk }));
  };

  const triggersData = useMemo(() => {
    const buckets: Record<string, number> = {
      behavioral: 0,
      compliance: 0,
      vehicle: 0,
      wellness: 0,
    };

    filtered.forEach((r) => {
      (r.triggers ?? []).forEach((t) => {
        if (t in buckets) buckets[t] += 1;
      });
    });

    return Object.entries(buckets).map(([k, v]) => ({ trigger: k, count: v }));
  }, [filtered]);

  const triggersAvg = useMemo(() => {
    const nums = (triggersData ?? []).map((d) => safeNum(d.count));
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }, [triggersData]);

  const avgScores = useMemo(() => {
    const safeAvg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    return [
      { metric: "Behavior", score: safeAvg(filtered.map((r) => safeNum(r.behavioralScore))) },
      { metric: "Compliance", score: safeAvg(filtered.map((r) => safeNum(r.complianceScore))) },
      { metric: "Vehicle", score: safeAvg(filtered.map((r) => safeNum(r.vehicleScore))) },
      { metric: "Wellness", score: safeAvg(filtered.map((r) => safeNum(r.wellnessScore))) },
      { metric: "Total", score: safeAvg(filtered.map((r) => safeNum(r.totalScore))) },
    ];
  }, [filtered]);

  const avgScoresAvg = useMemo(() => {
    const nums = (avgScores ?? []).map((d) => safeNum(d.score));
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }, [avgScores]);

  const avgTotalScore = useMemo(() => {
    const vals = filtered.map((r) => safeNum(r.totalScore)).filter((n) => Number.isFinite(n));
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [filtered]);

  const atRiskCount = useMemo(
    () => filtered.filter((r) => r.riskLevel === "red").length,
    [filtered]
  );

  const moodByDay = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bucket: Record<string, { moodSum: number; stressSum: number; sleepSum: number; n: number }> =
      Object.fromEntries(days.map((d) => [d, { moodSum: 0, stressSum: 0, sleepSum: 0, n: 0 }]));

    filtered.forEach((r) => {
      if (!r.checkin) return;
      const day = days[new Date(r.checkin.timestamp).getDay()];
      if (!day || !bucket[day]) return;

      bucket[day].moodSum += safeNum(r.checkin.mood);
      bucket[day].stressSum += safeNum(r.checkin.stress);
      bucket[day].sleepSum += safeNum(r.checkin.sleepHours);
      bucket[day].n += 1;
    });

    return days.map((d) => {
      const b = bucket[d];
      const n = b.n || 0;
      return {
        day: d,
        avgMood: n ? Number((b.moodSum / n).toFixed(2)) : 0,
        avgStress: n ? Number((b.stressSum / n).toFixed(2)) : 0,
        avgSleep: n ? Number((b.sleepSum / n).toFixed(2)) : 0,
        checkins: n,
      };
    });
  }, [filtered]);

  const moodOverallAvg = useMemo(() => {
    const points = (moodByDay ?? []).filter((d) => d.checkins > 0).map((d) => safeNum(d.avgMood));
    if (!points.length) return 0;
    return points.reduce((a, b) => a + b, 0) / points.length;
  }, [moodByDay]);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const redDrivers = useMemo(
    () =>
      filtered
        .filter((r) => r.riskLevel === "red")
        .filter((r) => {
          const id = (r.driver as any)?.id ?? (r.driver as any)?.name ?? "";
          return !dismissedIds.has(id);
        })
        .slice(0, 9),
    [filtered, dismissedIds]
  );

  function dismissAlert(r: DriverReadiness) {
    const id = (r.driver as any)?.id ?? (r.driver as any)?.name ?? "";
    if (!id) return;
    setDismissedIds((prev) => new Set([...prev, id]));
  }

  const RiskPieTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null;

    const p = payload[0]?.payload;
    const key = String(p?.key ?? "");
    const today = safeNum(p?.value);

    const yCount =
      key === "green"
        ? riskCountsYesterday.green
        : key === "yellow"
        ? riskCountsYesterday.yellow
        : key === "red"
        ? riskCountsYesterday.red
        : riskCountsYesterday.noCheckin;

    const delta = pctChange(today, safeNum(yCount));
    const sign = delta > 0 ? "+" : "";
    const totalToday = safeNum(
      todayRiskMap.green + todayRiskMap.yellow + todayRiskMap.red + todayRiskMap.all
    );
    const pctOfToday = totalToday ? Math.round((today / totalToday) * 100) : 0;

    return (
      <div className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-xs text-primary/70 shadow-sm">
        <div className="font-medium text-primary">{p?.name ?? "—"}</div>
        <div className="mt-1">
          Today: <span className="font-semibold text-primary">{fmt(today)}</span>{" "}
          <span className="text-primary/50">({pctOfToday}%)</span>
        </div>
        <div>
          Yesterday: <span className="font-semibold text-primary">{fmt(safeNum(yCount))}</span>
        </div>
        <div>
          Change:{" "}
          <span className="font-semibold text-primary">
            {sign}
            {delta.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Drivers in scope" value={isLoaded ? fmt(filtered.length) : "—"} sublabel="After filters" />
        <KpiCard
          label="Check-ins complete today"
          value={isLoaded ? fmt(checkinTodayCount) : "—"}
          sublabel={`Yesterday: ${fmt(checkinYesterdayCount)} • ${checkinCompletionRate}% completion`}
        />
        <KpiCard label="At Risk drivers" value={isLoaded ? fmt(atRiskCount) : "—"} sublabel="Red risk level" />
        <KpiCard label="Avg total readiness score" value={isLoaded ? fmt(avgTotalScore) : "—"} sublabel="0–100 (demo)" />
      </div>

      {/* Avg score breakdown + Trigger distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Average Score by Dimension">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgScores} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: AXIS_STROKE }} stroke={AXIS_STROKE} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: AXIS_STROKE }} stroke={AXIS_STROKE} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                <ReferenceLine
                  y={avgScoresAvg}
                  stroke={AVG_STROKE}
                  strokeWidth={2}
                  strokeDasharray="6"
                  label={{ value: "Avg", position: "insideTopRight", fill: AVG_STROKE, fontSize: 11 }}
                />
                <Bar dataKey="score" fill="#25477b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-primary/60">Scores 0–100. Average line shown.</p>
        </DashboardCard>

        <DashboardCard title="Risk Triggers (drivers flagged per dimension)">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={triggersData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="trigger" tick={{ fontSize: 11, fill: AXIS_STROKE }} stroke={AXIS_STROKE} />
                <YAxis tick={{ fontSize: 11, fill: AXIS_STROKE }} stroke={AXIS_STROKE} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
                <ReferenceLine
                  y={triggersAvg}
                  stroke={AVG_STROKE}
                  strokeWidth={2}
                  strokeDasharray="6"
                  label={{ value: "Avg", position: "insideTopRight", fill: AVG_STROKE, fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[3, 3, 0, 0]} name="Drivers flagged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-primary/60">Count of drivers with a low score per dimension.</p>
        </DashboardCard>
      </div>

      {/* Mood / Stress / Sleep trend */}
      <DashboardCard title="Wellness Trends by Day (avg mood, stress, sleep from check-ins)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodByDay} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS_STROKE }} stroke={AXIS_STROKE} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: AXIS_STROKE }} stroke={AXIS_STROKE} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #eff2f7" }} />
              <ReferenceLine
                y={moodOverallAvg}
                stroke={AVG_STROKE}
                strokeWidth={2}
                strokeDasharray="6"
                label={{ value: "Mood avg", position: "insideTopRight", fill: AVG_STROKE, fontSize: 10 }}
              />
              <Line type="monotone" dataKey="avgMood" stroke="#16a34a" strokeWidth={2} dot name="Mood (1–5)" />
              <Line type="monotone" dataKey="avgStress" stroke="#dc2626" strokeWidth={2} dot name="Stress (1–5)" />
              <Line type="monotone" dataKey="avgSleep" stroke="#0078d3" strokeWidth={2} dot name="Sleep (hrs)" />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-primary/60">
          Mood &amp; stress scale 1–5. Sleep in hours. Only days with check-ins shown with values.
        </p>
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Risk Distribution (hover shows yesterday + % change; click slice filters)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskCounts ?? []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, value }: any) => `${name}: ${fmt(safeNum(value))}`}
                  labelLine={false}
                  activeIndex={riskActiveIndex}
                  onMouseEnter={(_: any, idx: number) => setRiskActiveIndex(idx)}
                  onClick={(_: any, idx: number) => {
                    const r = riskCounts[idx];
                    if (r) toggleRisk(r.key);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {(riskCounts ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip content={<RiskPieTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 rounded-lg border border-primary/15 bg-white px-3 py-2 text-xs text-primary/70">
            <span className="font-medium text-primary">Selected:</span>{" "}
            {riskPinned ? (
              <>
                <span className="font-medium text-primary">{riskPinned.name}</span>{" "}
                <span className="text-primary/50">•</span>{" "}
                <span className="font-medium text-primary">{fmt(safeNum(riskPinned.value))}</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="At Risk Drivers (top)">
          {redDrivers.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {redDrivers.map((r) => (
                <ManagerAlert
                  key={(r.driver as any)?.id ?? (r.driver as any)?.name ?? `${Math.random()}`}
                  readiness={r}
                  onDismiss={() => dismissAlert(r)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-primary/60">No At Risk drivers under current filters.</div>
          )}
        </DashboardCard>

        {!isLoaded ? <div className="lg:col-span-2 text-sm text-primary/60">Loading…</div> : null}
      </div>
    </div>
  );
}