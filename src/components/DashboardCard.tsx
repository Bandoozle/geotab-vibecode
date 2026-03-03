"use client";

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
}

export function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <div className="overflow-hidden rounded-card border border-slate-200/80 bg-surfaceCard shadow-card">
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
