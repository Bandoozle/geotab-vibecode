"use client";

import { useState, useMemo } from "react";
import {
  getTrucks,
  getDrivers,
  getPings,
  getFaults,
} from "@/lib/fakeData";
import { TruckTable } from "@/components/TruckTable";
import { MapPanel } from "@/components/MapPanel";
import { DriverDrawer } from "@/components/DriverDrawer";
import { FilterBar } from "@/components/FilterBar";
import type { Truck, Driver } from "@/lib/fakeData";

// Deterministic safety trend for drawer (last 7 values)
function getSafetyTrend(): number[] {
  const rng = (seed: number) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const r = rng(42);
  return Array.from({ length: 7 }, () => Math.floor(r() * 15) + 82);
}

export default function TrackingPage() {
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);

  const trucks = useMemo(() => getTrucks(), []);
  const drivers = useMemo(() => getDrivers(), []);

  const selectedDriver = useMemo(() => {
    if (!selectedTruck) return null;
    return drivers.find((d) => d.truckId === selectedTruck.id) ?? null;
  }, [selectedTruck, drivers]);

  const pings = useMemo(
    () => (selectedTruck ? getPings(selectedTruck.id, 10) : []),
    [selectedTruck?.id]
  );

  const faults = useMemo(
    () => getFaults(selectedTruck?.id),
    [selectedTruck?.id]
  );

  const safetyTrend = useMemo(() => getSafetyTrend(), []);

  return (
    <div className="min-h-full">
      <FilterBar />
      <div className="space-y-8 p-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Live Tracking</h1>
          <p className="mt-1 text-primary/70">
            Pretend tracking – 8–12 trucks, click a truck for details.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="mb-3 text-sm font-semibold text-primary">
              Fleet table
            </h2>
            <TruckTable
              trucks={trucks}
              drivers={drivers}
              onSelectTruck={setSelectedTruck}
            />
          </div>
          <div className="lg:col-span-2">
            <MapPanel
              trucks={trucks}
              selectedTruckId={selectedTruck?.id ?? null}
              onSelectTruck={setSelectedTruck}
            />
          </div>
        </div>
      </div>

      {selectedTruck && (
        <DriverDrawer
          truck={selectedTruck}
          driver={selectedDriver}
          pings={pings}
          faults={faults}
          safetyTrend={safetyTrend}
          onClose={() => setSelectedTruck(null)}
        />
      )}
    </div>
  );
}
