"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "@/lib/firebaseClient";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { PageContent } from "@/components/PageContent";

import CheckinPage from "../../driver/checkin/page";

type AnyObj = Record<string, any>;

function snapToArray<T extends AnyObj = AnyObj>(
  snap: any
): (T & { id: string })[] {
  return (snap?.docs ?? []).map((d: any) => ({
    id: d.id,
    ...(d.data() as T),
  }));
}

export default function DashboardPage() {
  const [drivers, setDrivers] = useState<AnyObj[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoaded(false);
      setLoadError(null);

      try {
        const driversQ = query(collection(db, "drivers"), limit(250));
        const [driversSnap] = await Promise.all([getDocs(driversQ)]);

        if (cancelled) return;

        setDrivers(snapToArray(driversSnap));
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

  return (
    <PageContent>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Driver Dashboard</h1>
        <p className="mt-1 text-muted">
          Welcome back! Here&apos;s your overview for today.
        </p>
        {loadError && (
          <p className="mt-2 text-xs text-red-600">Load error: {loadError}</p>
        )}
      </header>
      <DashboardTabs
        defaultActiveKey="checkin"
        tabs={{
          checkin: <CheckinPage />,
        }}
        labels={{
          checkin: "Check-In",
        }}
      />
    </PageContent>
  );
}
