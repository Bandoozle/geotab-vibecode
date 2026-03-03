"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebaseClient";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";

import CheckinPage from "../../driver/checkin/page";

export default function DashboardPage() {
  const [driverName, setDriverName] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const data = snap.data();
      setDriverName(data?.name ?? data?.email ?? null);
    });
  }, []);

  return (
    <div className="min-h-full">
      <div className="px-6 pb-10 pt-8">
        <div className="mb-6">
          <div className="text-lg font-semibold text-primary">
            {driverName ? `Welcome, ${driverName}` : "Driver Dashboard"}
          </div>
          <div className="mt-1 text-sm text-primary/60">
            Complete your pre-trip check-in before starting your route.
          </div>
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
