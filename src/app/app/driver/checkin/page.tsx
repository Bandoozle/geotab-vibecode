"use client";

import { useState, useEffect } from "react";
import { getDrivers, getTrucks, type Driver } from "@/lib/fakeData";
import {
  computeReadiness,
  riskColor,
  riskBg,
  riskBorder,
  riskLabel,
  type WellnessCheckin,
  type DriverReadiness,
} from "@/lib/wellnessData";

const MOOD_LABELS = ["", "Exhausted", "Tired", "Okay", "Good", "Energised"];
const STRESS_LABELS = ["", "Very Stressed", "Stressed", "Neutral", "Calm", "Very Calm"];

export default function CheckinPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState("");
  useEffect(() => {
    const d = getDrivers();
    setDrivers(d);
    setDriverId(d[0]?.id ?? "");
  }, []);

  const [mood, setMood]         = useState(3);
  const [stress, setStress]     = useState(3);
  const [sleep, setSleep]       = useState(7);
  const [note, setNote]         = useState("");
  const [result, setResult]     = useState<DriverReadiness | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const driver = drivers.find((d) => d.id === driverId);
    const truck  = getTrucks().find((t) => t.driverId === driverId);
    if (!driver || !truck) return;

    const checkin: WellnessCheckin = {
      driverId,
      mood,
      stress,
      sleepHours: sleep,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    setResult(computeReadiness(driver, truck, checkin));
  }

  function handleReset() {
    setResult(null);
    setNote("");
    setMood(3);
    setStress(3);
    setSleep(7);
  }

  if (result) {
    return <ReadinessResult result={result} onReset={handleReset} />;
  }

  return (
    <div className="min-h-full bg-surface">
      <div className="mx-auto max-w-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary">Pre-Trip Check-In</h1>
          <p className="mt-1 text-sm text-primary/60">
            Your responses are private, the system uses them to keep you safe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Driver selector */}
          <div className="border border-primary/15 bg-white p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-primary/70">
              Who are you?
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mood */}
          <SliderField
            label="How are you feeling right now?"
            value={mood}
            min={1}
            max={5}
            valueLabel={MOOD_LABELS[mood] ?? ""}
            leftLabel="😴 Exhausted"
            rightLabel="😊 Energised"
            onChange={setMood}
          />

          {/* Stress */}
          <SliderField
            label="How is your stress level?"
            value={stress}
            min={1}
            max={5}
            valueLabel={STRESS_LABELS[stress] ?? ""}
            leftLabel="😤 Very Stressed"
            rightLabel="😌 Very Calm"
            onChange={setStress}
          />

          {/* Sleep */}
          <SliderField
            label="How many hours did you sleep?"
            value={sleep}
            min={4}
            max={9}
            valueLabel={`${sleep}${sleep >= 9 ? "+" : ""} hrs`}
            leftLabel="4 hrs"
            rightLabel="9+ hrs"
            onChange={setSleep}
          />

          {/* Optional note */}
          <div className="border border-primary/15 bg-white p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-primary/70">
              Anything on your mind? <span className="font-normal normal-case text-primary/40">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Personal issue, vehicle concern, anything relevant..."
              className="w-full resize-none border border-primary/20 bg-surface px-3 py-2 text-sm text-primary placeholder:text-primary/40 focus:border-accent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
          >
            Submit Check-In
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Slider field component ───────────────────────────────────────────────────

function SliderField({
  label,
  value,
  min,
  max,
  valueLabel,
  leftLabel,
  rightLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  valueLabel: string;
  leftLabel: string;
  rightLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border border-primary/15 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-primary/70">
          {label}
        </label>
        <span className="text-sm font-semibold text-accent">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="mt-1 flex justify-between text-xs text-primary/40">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ReadinessResult({ result, onReset }: { result: DriverReadiness; onReset: () => void }) {
  const color  = riskColor(result.riskLevel);
  const bg     = riskBg(result.riskLevel);
  const border = riskBorder(result.riskLevel);
  const label  = riskLabel(result.riskLevel);

  const emoji =
    result.riskLevel === "green" ? "✅" : result.riskLevel === "yellow" ? "⚠️" : "🛑";

  return (
    <div className="min-h-full bg-surface">
      <div className="mx-auto max-w-lg p-6">
        {/* Score card */}
        <div
          className="mb-5 border p-6 text-center"
          style={{ backgroundColor: bg, borderColor: border }}
        >
          <div className="mb-2 text-4xl">{emoji}</div>
          <div className="text-4xl font-bold" style={{ color }}>
            {result.totalScore}
            <span className="ml-1 text-lg font-normal">/100</span>
          </div>
          <div className="mt-1 text-base font-semibold" style={{ color }}>
            {label}
          </div>
          <div className="mt-0.5 text-sm text-primary/60">
            Drive Readiness Score — {result.driver.name}
          </div>
        </div>

        {/* Coaching message */}
        <div className="mb-5 border border-primary/15 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/50 mb-1">
            From your safety coach
          </p>
          <p className="text-sm text-primary leading-relaxed">{result.coachingMessage}</p>
        </div>

        {/* Score breakdown */}
        <div className="mb-5 border border-primary/15 bg-white">
          <div className="border-b border-primary/10 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary/70">
              Score breakdown
            </span>
          </div>
          <div className="divide-y divide-primary/10">
            <ScoreRow label="Driving history" score={result.behavioralScore} weight="35%" />
            <ScoreRow label="Hours & compliance" score={result.complianceScore} weight="30%" />
            <ScoreRow label="Vehicle health" score={result.vehicleScore} weight="20%" />
            <ScoreRow label="Wellness check-in" score={result.wellnessScore} weight="15%" />
          </div>
        </div>

        {/* At-risk message for Yellow/Red */}
        {result.riskLevel !== "green" && (
          <div
            className="mb-5 border p-4 text-sm"
            style={{ backgroundColor: bg, borderColor: border, color }}
          >
            <p className="font-semibold mb-1">
              {result.riskLevel === "red"
                ? "Your dispatcher has been notified. Please check in with them before starting your route."
                : "Your dispatcher has been given a heads-up. Drive with extra caution today."}
            </p>
            <p className="text-primary/70 text-xs mt-1">
              This is advisory only — you are not blocked from driving.
            </p>
          </div>
        )}

        <button
          onClick={onReset}
          className="w-full border border-primary/20 bg-white py-3 text-sm font-medium text-primary hover:bg-surface transition-colors"
        >
          New Check-In
        </button>
      </div>
    </div>
  );
}

function ScoreRow({ label, score, weight }: { label: string; score: number; weight: string }) {
  const level = score >= 80 ? "green" : score >= 55 ? "yellow" : "red";
  const color = riskColor(level);
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <span className="text-sm text-primary">{label}</span>
        <span className="ml-2 text-xs text-primary/40">{weight}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
