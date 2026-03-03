"use client";

import { Sidebar } from "@/components/DriverSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-full">{children}</main>
    </div>
  );
}