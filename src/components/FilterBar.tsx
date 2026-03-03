"use client";

import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "/app/manager/dashboard": "Dashboard",
  "/app/manager/leaderboard": "Leaderboard",
  "/app/manager/safety": "Fleet readiness",
};

export function FilterBar() {
  const pathname = usePathname();
  const label = LABELS[pathname] ?? "Dashboard";

  return (
    <div className="border-b border-slate-200/80 bg-surfaceCard px-6 py-3.5">
      <h1 className="text-sm font-semibold text-primary">{label}</h1>
    </div>
  );
}