interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-white">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}
