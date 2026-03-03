"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebaseClient";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { PageContent } from "@/components/PageContent";

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
    <PageContent>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {driverName ? `Welcome, ${driverName}` : "Driver Dashboard"}
        </h1>
        <p className="mt-1 text-muted">
          Complete your pre-trip check-in before starting your route.
        </p>
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
