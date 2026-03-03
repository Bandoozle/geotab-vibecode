"use client";

import { useMemo, useState } from "react";
import { getTrucks, getDrivers, type Truck } from "@/lib/fakeData";
import { MapPanel } from "@/components/MapPanel";

const STATUS_COLOR: Record<string, string> = {
  Active: "#16a34a",
  Idle: "#ca8a04",
  Service: "#dc2626",
};

export default function MapPage() {
  const trucks = useMemo(() => getTrucks(), []);
  const drivers = useMemo(() => getDrivers(), []);

  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);

  const selectedTruck = useMemo(
    () => trucks.find((t) => t.id === selectedTruckId) ?? null,
    [trucks, selectedTruckId]
  );

  const selectedDriver = useMemo(
    () => (selectedTruck ? drivers.find((d) => d.id === selectedTruck.driverId) ?? null : null),
    [drivers, selectedTruck]
  );

  function handleSelectTruck(truck: Truck) {
    setSelectedTruckId((prev) => (prev === truck.id ? null : truck.id));
  }

  return (
    <div className="min-h-full bg-surface">
      <div className="px-6 pb-10 pt-8">
        <div className="mb-6">
          <div className="text-lg font-semibold text-primary">Fleet Map</div>
          <div className="mt-1 text-sm text-primary/60">
            Live truck positions — click a marker to see details.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map panel — takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <MapPanel
              trucks={trucks}
              selectedTruckId={selectedTruckId}
              onSelectTruck={handleSelectTruck}
            />
          </div>

          {/* Side panel — truck details or fleet summary */}
          <div className="flex flex-col gap-4">
            {selectedTruck ? (
              <TruckDetail truck={selectedTruck} driverName={selectedDriver?.name ?? null} />
            ) : (
              <FleetSummary trucks={trucks} />
            )}

            {/* Fleet list */}
            <div className="border border-primary/15 bg-white">
              <div className="border-b border-primary/10 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                  All Trucks
                </span>
              </div>
              <div className="divide-y divide-primary/10 max-h-80 overflow-y-auto">
                {trucks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTruck(t)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface ${
                      t.id === selectedTruckId ? "bg-accent/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLOR[t.status] ?? "#898989" }}
                      />
                      <span className="font-medium text-primary">{t.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-primary/60">
                      <span>{t.status}</span>
                      <span>{t.speed} mph</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TruckDetail({ truck, driverName }: { truck: Truck; driverName: string | null }) {
  const statusColor = STATUS_COLOR[truck.status] ?? "#898989";
  const lastPing = new Date(truck.lastPingAt);
  const minsAgo = Math.round((Date.now() - lastPing.getTime()) / 60000);

  return (
    <div className="border border-primary/15 bg-white">
      <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
        <span className="text-sm font-semibold text-primary">{truck.id}</span>
        <span
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
          style={{ color: statusColor, borderColor: statusColor }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          {truck.status}
        </span>
      </div>

      <div className="divide-y divide-primary/10">
        {driverName && (
          <InfoRow label="Driver" value={driverName} />
        )}
        <InfoRow label="Speed" value={`${truck.speed} mph`} />
        <InfoRow label="Miles today" value={truck.milesToday.toLocaleString()} />
        <InfoRow label="Avg MPG" value={truck.mpg.toFixed(1)} />
        <InfoRow label="Safety score" value={String(truck.safetyScore)} />
        <InfoRow label="Last ping" value={`${minsAgo} min ago`} />
        <InfoRow label="Position" value={`${truck.lat.toFixed(4)}, ${truck.lng.toFixed(4)}`} />
      </div>
    </div>
  );
}

function FleetSummary({ trucks }: { trucks: Truck[] }) {
  const active = trucks.filter((t) => t.status === "Active").length;
  const idle = trucks.filter((t) => t.status === "Idle").length;
  const service = trucks.filter((t) => t.status === "Service").length;
  const avgSafety = Math.round(trucks.reduce((s, t) => s + t.safetyScore, 0) / (trucks.length || 1));
  const totalMiles = trucks.reduce((s, t) => s + t.milesToday, 0);

  return (
    <div className="border border-primary/15 bg-white">
      <div className="border-b border-primary/10 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary/70">Fleet Summary</span>
      </div>
      <div className="divide-y divide-primary/10">
        <InfoRow label="Total trucks" value={String(trucks.length)} />
        <InfoRow label="Active" value={String(active)} valueColor={STATUS_COLOR.Active} />
        <InfoRow label="Idle" value={String(idle)} valueColor={STATUS_COLOR.Idle} />
        <InfoRow label="In service" value={String(service)} valueColor={STATUS_COLOR.Service} />
        <InfoRow label="Avg safety score" value={String(avgSafety)} />
        <InfoRow label="Total miles today" value={totalMiles.toLocaleString()} />
      </div>
      <div className="px-4 py-3 text-xs text-primary/50">Click a truck on the map to see details.</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-primary/60">{label}</span>
      <span className="text-sm font-medium text-primary" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}
