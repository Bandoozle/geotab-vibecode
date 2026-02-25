"use client";

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
}

export function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <div className="border border-primary/15 bg-white">
      <div className="flex items-center justify-between border-b border-surface bg-surface px-4 py-3">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <button
          type="button"
          className="text-primary/60 hover:text-primary"
          aria-label="Options"
        >
          ⋮
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
