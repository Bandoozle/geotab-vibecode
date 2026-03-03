"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "@/lib/firebaseClient";

import { getFleetReadiness, type DriverReadiness, type RiskLevel } from "@/lib/wellnessData";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import type { DashboardFilters } from "@/components/dashboard/types";

import { PageContent } from "@/components/PageContent";
import { OverviewTab } from "@/components/dashboard/tabs/OverviewTab";
import { OperationsTab } from "@/components/dashboard/tabs/OperationsTab";
import { SafetyWellnessTab } from "@/components/dashboard/tabs/SafetyWellnessTab";

type AnyObj = Record<string, any>;

function snapToArray<T extends AnyObj = AnyObj>(snap: any): (T & { id: string })[] {
  return (snap?.docs ?? []).map((d: any) => ({ id: d.id, ...(d.data() as T) }));
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    vehicleType: null,
    month: null,
    day: null,
    risk: "all",
  });

  const [drivers, setDrivers] = useState<AnyObj[]>([]);
  const [trucks, setTrucks] = useState<AnyObj[]>([]);
  const [checkins, setCheckins] = useState<AnyObj[]>([]);

  const [mileageRaw, setMileageRaw] = useState<AnyObj[]>([]);
  const [fuelRaw, setFuelRaw] = useState<AnyObj[]>([]);
  const [idlingRaw, setIdlingRaw] = useState<AnyObj[]>([]);
  const [aggressiveRaw, setAggressiveRaw] = useState<AnyObj[]>([]);
  const [seatbeltRaw, setSeatbeltRaw] = useState<AnyObj[]>([]);
  const [readinessRaw, setReadinessRaw] = useState<DriverReadiness[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Firestore-driven dropdown options
  const vehicleOptions = useMemo(() => {
    const fromIdling = (idlingRaw ?? [])
      .map((r) => r?.name ?? r?.vehicleType)
      .filter(Boolean)
      .map(String);

    const fromMileage = (mileageRaw ?? []).map((r) => r?.vehicleType).filter(Boolean).map(String);
    const fromFuel = (fuelRaw ?? []).map((r) => r?.vehicleType).filter(Boolean).map(String);
    const fromAgg = (aggressiveRaw ?? []).map((r) => r?.vehicleType).filter(Boolean).map(String);
    const fromSeatbelt = (seatbeltRaw ?? []).map((r) => r?.vehicleType).filter(Boolean).map(String);

    return uniq([...fromIdling, ...fromMileage, ...fromFuel, ...fromAgg, ...fromSeatbelt]).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [idlingRaw, mileageRaw, fuelRaw, aggressiveRaw, seatbeltRaw]);

  const monthOptions = useMemo(() => {
    const m1 = (fuelRaw ?? []).map((r) => r?.month).filter(Boolean).map(String);
    const m2 = (aggressiveRaw ?? []).map((r) => r?.month).filter(Boolean).map(String);
    const m3 = (seatbeltRaw ?? []).map((r) => r?.month).filter(Boolean).map(String);
    return uniq([...m1, ...m2, ...m3]).sort((a, b) => a.localeCompare(b));
  }, [fuelRaw, aggressiveRaw, seatbeltRaw]);

  const dayOptions = useMemo(() => {
    const d1 = (mileageRaw ?? []).map((r) => r?.day).filter(Boolean).map(String);
    const d2 = (aggressiveRaw ?? []).map((r) => r?.day).filter(Boolean).map(String);
    const d3 = (seatbeltRaw ?? []).map((r) => r?.day).filter(Boolean).map(String);
    return uniq([...d1, ...d2, ...d3]).sort((a, b) => a.localeCompare(b));
  }, [mileageRaw, aggressiveRaw, seatbeltRaw]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoaded(false);
      setLoadError(null);

      try {
        const driversQ = query(collection(db, "drivers"), limit(250));
        const trucksQ = query(collection(db, "trucks"), limit(250));
        const checkinsQ = query(collection(db, "checkins"), limit(500));

        const mileageQ = query(collection(db, "weeklyMileage"), limit(2000));
        const fuelQ = query(collection(db, "fuelTrend"), limit(2000));
        const idlingQ = query(collection(db, "idlingBreakdown"), limit(250));
        const aggressiveQ = query(collection(db, "aggressiveEvents"), limit(2000));
        const seatbeltQ = query(collection(db, "seatbeltViolations"), limit(2000));

        const [
          driversSnap,
          trucksSnap,
          checkinsSnap,
          mileageSnap,
          fuelSnap,
          idlingSnap,
          aggressiveSnap,
          seatbeltSnap,
        ] = await Promise.all([
          getDocs(driversQ),
          getDocs(trucksQ),
          getDocs(checkinsQ),
          getDocs(mileageQ),
          getDocs(fuelQ),
          getDocs(idlingQ),
          getDocs(aggressiveQ),
          getDocs(seatbeltQ),
        ]);

        if (cancelled) return;

        const d = snapToArray(driversSnap);
        const t = snapToArray(trucksSnap);
        const c = snapToArray(checkinsSnap);

        setDrivers(d);
        setTrucks(t);
        setCheckins(c);

        setMileageRaw(snapToArray(mileageSnap));
        setFuelRaw(snapToArray(fuelSnap));

        // idlingBreakdown: { vehicleType, idleMinutes } -> { name, value }
        setIdlingRaw(
          snapToArray(idlingSnap).map((r: any) => ({
            ...r,
            name: r.vehicleType ?? r.name ?? "Unknown",
            value: Number(r.idleMinutes ?? r.value ?? 0) || 0,
            vehicleType: r.vehicleType ?? r.name ?? "Unknown",
          }))
        );

        // aggressive/seatbelt: normalize driver label
        setAggressiveRaw(
          snapToArray(aggressiveSnap).map((r: any) => ({
            ...r,
            driver: r.driver ?? r.driverName ?? r.driverId ?? "Unknown",
          }))
        );

        setSeatbeltRaw(
          snapToArray(seatbeltSnap).map((r: any) => ({
            ...r,
            driver: r.driver ?? r.driverName ?? r.driverId ?? "Unknown",
          }))
        );

        setReadinessRaw(getFleetReadiness(d as any, t as any, c as any));
        setIsLoaded(true);
      } catch (e: any) {
        console.error("Firestore load failed:", e);
        if (!cancelled) {
          setLoadError(e?.message ?? String(e));
          setIsLoaded(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearFilters = () =>
    setFilters({
      vehicleType: null,
      month: null,
      day: null,
      risk: "all",
    });

  const anyFilterOn =
    !!filters.vehicleType || !!filters.month || !!filters.day || filters.risk !== "all";

  return (
    <PageContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Manager Fleet Dashboard</h1>
            <p className="mt-1 text-muted">Filters apply across all tabs.</p>
            <p className="mt-2 text-xs text-muted">
              {loadError ? (
                <span className="text-red-600">Load error: {loadError}</span>
              ) : isLoaded ? (
                "Loaded from Firestore."
              ) : (
                "Loading from Firestore…"
              )}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              drivers={drivers.length} trucks={trucks.length} checkins={checkins.length} mileage=
              {mileageRaw.length} fuel={fuelRaw.length}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm"
              value={(filters.vehicleType as any) ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  vehicleType: (e.target.value || null) as any,
                }))
              }
            >
              <option value="">All vehicles</option>
              {vehicleOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm"
              value={(filters.month as any) ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  month: (e.target.value || null) as any,
                }))
              }
            >
              <option value="">All months</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm"
              value={(filters.day as any) ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  day: (e.target.value || null) as any,
                }))
              }
            >
              <option value="">All days</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm"
              value={filters.risk}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  risk: e.target.value as RiskLevel | "all",
                }))
              }
            >
              <option value="all">All risk</option>
              <option value="green">green</option>
              <option value="yellow">yellow</option>
              <option value="red">red</option>
            </select>

            {anyFilterOn && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-primary/15 bg-surface px-3 py-2 text-sm font-medium text-accent hover:bg-primary/5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <DashboardTabs
          defaultActiveKey="overview"
          tabs={{
            overview: (
              <OverviewTab
                isLoaded={isLoaded}
                readinessRaw={readinessRaw}
                mileageRaw={mileageRaw}
                fuelRaw={fuelRaw}
                seatbeltRaw={seatbeltRaw}
                filters={filters}
                setFilters={setFilters}
              />
            ),
            operations: (
              <OperationsTab
                isLoaded={isLoaded}
                idlingRaw={idlingRaw}
                mileageRaw={mileageRaw}
                fuelRaw={fuelRaw}
                aggressiveRaw={aggressiveRaw}
                seatbeltRaw={seatbeltRaw}
                filters={filters}
                setFilters={setFilters}
              />
            ),
            safetyWellness: (
              <SafetyWellnessTab
                isLoaded={isLoaded}
                readinessRaw={readinessRaw}
                filters={filters}
                setFilters={setFilters}
              />
            ),
          }}
          labels={{
            overview: "Overview",
            operations: "Operations",
            safetyWellness: "Safety + Wellness",
          }}
        />
      </PageContent>
  );
}
