// src/app/app/safety/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebaseClient";

import type { DashboardFilters } from "@/components/dashboard/types";

import {
  getFleetReadiness,
  type DriverReadiness,
  type WellnessCheckinDoc,
} from "@/lib/wellnessData";

import type { DriverDoc, TruckDoc } from "@/lib/firestoreTypes";
import { PageContent } from "@/components/PageContent";
import { SafetyWellnessTab } from "@/components/dashboard/tabs/SafetyWellnessTab";

type AnyObj = Record<string, any>;

function normalizeDriver(docId: string, data: AnyObj): DriverDoc {
  const id = String(data.id ?? data.driverId ?? data.driverID ?? docId);
  return {
    id,
    driverId: data.driverId ?? data.driverID ?? id,
    name: String(data.name ?? data.driverName ?? "Unknown Driver"),
    truckId: (data.truckId ?? data.truckID ?? null) as string | null,
    safetyScore: Number(data.safetyScore ?? 0),
    mpg: Number(data.mpg ?? 0),
    onTimePercent: Number(data.onTimePercent ?? 0),
    totalPoints: Number(data.totalPoints ?? 0),
    badges: Array.isArray(data.badges) ? data.badges : [],
    updatedAt: data.updatedAt,
  };
}

function normalizeTruck(docId: string, data: AnyObj): TruckDoc {
  const id = String(data.id ?? data.truckId ?? data.truckID ?? docId);
  return {
    id,
    driverId: String(data.driverId ?? data.driverID ?? ""),
    status: data.status ?? "Active",
    lastPingAt: data.lastPingAt ?? new Date().toISOString(),
    speed: Number(data.speed ?? 0),
    x: Number(data.x ?? 0),
    y: Number(data.y ?? 0),
    lat: Number(data.lat ?? 0),
    lng: Number(data.lng ?? 0),
    safetyScore: Number(data.safetyScore ?? 0),
    mpg: Number(data.mpg ?? 0),
    milesToday: Number(data.milesToday ?? 0),
    updatedAt: data.updatedAt,
  };
}

function normalizeCheckin(docId: string, data: AnyObj): WellnessCheckinDoc {
  let ts = data.timestamp;
  let iso = "";
  try {
    if (typeof ts === "string") iso = new Date(ts).toISOString();
    else if (typeof ts === "number") iso = new Date(ts).toISOString();
    else if (ts && typeof ts.toDate === "function") iso = ts.toDate().toISOString();
    else iso = new Date().toISOString();
  } catch {
    iso = new Date().toISOString();
  }

  return {
    driverId: String(data.driverId ?? data.driverID ?? data.driver ?? ""),
    mood: Number(data.mood ?? 3),
    stress: Number(data.stress ?? 3),
    sleepHours: Number(data.sleepHours ?? data.sleep ?? 7),
    note: typeof data.note === "string" ? data.note : undefined,
    timestamp: iso,
  };
}

export default function SafetyPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    vehicleType: null,
    month: null,
    day: null,
    risk: "all",
  });

  const [readinessRaw, setReadinessRaw] = useState<DriverReadiness[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setIsLoaded(false);

        const [driversSnap, trucksSnap, checkinsSnap] = await Promise.all([
          getDocs(collection(db, "drivers")),
          getDocs(collection(db, "trucks")),
          getDocs(collection(db, "checkins")),
        ]);

        const drivers = driversSnap.docs.map((d) => normalizeDriver(d.id, d.data() as AnyObj));
        const trucks = trucksSnap.docs.map((t) => normalizeTruck(t.id, t.data() as AnyObj));
        const checkins = checkinsSnap.docs.map((c) => normalizeCheckin(c.id, c.data() as AnyObj));

        const readiness = getFleetReadiness(drivers, trucks, checkins);

        if (!alive) return;
        setReadinessRaw(readiness);
        setIsLoaded(true);
      } catch (err) {
        console.error("Safety page load failed:", err);
        if (!alive) return;
        setIsLoaded(true);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageContent>
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Fleet readiness</h1>
          <p className="mt-1 text-muted">
            {isLoaded ? "Data from Firestore." : "Loading…"}
          </p>
        </header>
        <SafetyWellnessTab
          isLoaded={isLoaded}
          readinessRaw={readinessRaw}
          filters={filters}
          setFilters={setFilters}
        />
      </PageContent>
  );
}