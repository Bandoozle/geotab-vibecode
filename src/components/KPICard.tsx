interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function KPICard({ title, value, subtitle, trend = "neutral" }: KPICardProps) {
  const trendColor =
    trend === "up"
      ? "text-white"
      : trend === "down"
        ? "text-muted"
        : "text-muted";

  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-white">{value}</p>
      {(subtitle || trend !== "neutral") && (
        <p className={`mt-0.5 text-sm ${trendColor}`}>{subtitle ?? trend}</p>
      )}
    </div>
  );
}
