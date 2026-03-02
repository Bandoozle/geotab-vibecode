"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "@/lib/firebaseClient";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";

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
    <div className="min-h-full">
      <div className="px-6 pb-10 pt-8">
        <div className="mb-6">
          <div className="text-lg font-semibold text-primary">
            Driver Dashboard
          </div>
          <div className="mt-1 text-sm text-primary/60">
            Welcome back! Here&apos;s your overview for today.
          </div>

          {loadError && (
            <div className="mt-2 text-xs text-red-600">
              Load error: {loadError}
            </div>
          )}
        </div>

        <DashboardTabs
          defaultActiveKey="checkin"
          tabs={{
            checkin: <CheckinPage />,
          }}
          labels={{
            checkin: "Check-In",
          }}
        />
      </div>
    </div>
  );
}