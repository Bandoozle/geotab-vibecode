"use client";

import type { Truck, Driver, Ping, Fault } from "@/lib/fakeData";
import { BadgePill } from "./BadgePill";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DriverDrawerProps {
  truck: Truck;
  driver: Driver | null;
  pings: Ping[];
  faults: Fault[];
  safetyTrend: number[];
  onClose: () => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DriverDrawer({
  truck,
  driver,
  pings,
  faults,
  safetyTrend,
  onClose,
}: DriverDrawerProps) {
  const trendData = safetyTrend.map((v, i) => ({ day: `D${i + 1}`, score: v }));

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-primary/15 bg-white shadow-2xl">
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-surface bg-white p-4">
          <h2 className="text-lg font-bold tracking-tight text-primary">{truck.id} – Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-primary/20 bg-white px-3 py-1 text-sm text-primary hover:bg-surface"
          >
            Close
          </button>
        </div>
        <div className="space-y-6 p-4">
          {driver && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-primary/70">Driver</h3>
              <p className="text-primary">{driver.name}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {driver.badges.map((b) => (
                  <BadgePill key={b} label={b} />
                ))}
              </div>
            </section>
          )}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary/70">
              Last 10 pings
            </h3>
            <ul className="space-y-1 border border-surface bg-surface/50 p-2 text-xs">
              {pings.slice(0, 10).map((p) => (
                <li key={p.id} className="flex justify-between font-mono text-primary/80">
                  <span>{formatTime(p.timestamp)}</span>
                  <span>
                    ({p.x}, {p.y}) – {p.speed} mph
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary/70">
              Recent faults
            </h3>
            {faults.length === 0 ? (
              <p className="text-sm text-primary/60">No recent faults</p>
            ) : (
              <ul className="space-y-1 border border-surface bg-surface/50 p-2 text-xs">
                {faults.slice(0, 5).map((f) => (
                  <li key={f.id} className="flex justify-between text-primary/80">
                    <span>
                      [{f.category}] {f.message}
                    </span>
                    <span className={f.resolved ? "text-accent" : "text-primary/60"}>
                      {f.resolved ? "Resolved" : "Open"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary/70">
              Safety score trend
            </h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                    labelStyle={{ color: "#25477b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0078d3"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#0078d3" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
