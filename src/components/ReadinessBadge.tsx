import { riskColor, riskBg, riskBorder, riskLabel, type RiskLevel } from "@/lib/wellnessData";

interface ReadinessBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: "sm" | "md";
}

export function ReadinessBadge({ level, score, size = "md" }: ReadinessBadgeProps) {
  const color  = riskColor(level);
  const bg     = riskBg(level);
  const border = riskBorder(level);
  const label  = riskLabel(level);

  if (size === "sm") {
    return (
      <span
        className="inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-semibold"
        style={{ color, backgroundColor: bg, borderColor: border }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 border px-3 py-1.5 text-sm font-semibold"
      style={{ color, backgroundColor: bg, borderColor: border }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {score !== undefined && <span className="tabular-nums">{score}</span>}
      <span>{label}</span>
    </div>
  );
}
