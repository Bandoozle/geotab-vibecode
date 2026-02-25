"use client";

import type { Truck } from "@/lib/fakeData";
import type { Driver } from "@/lib/fakeData";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

interface TruckTableProps {
  trucks: Truck[];
  drivers: Driver[];
  onSelectTruck: (truck: Truck) => void;
}

export function TruckTable({ trucks, drivers, onSelectTruck }: TruckTableProps) {
  const driverByTruck = Object.fromEntries(drivers.map((d) => [d.truckId, d]));

  return (
    <div className="overflow-x-auto border border-primary/15 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface text-primary/70">
            <th className="p-3 font-medium">Truck ID</th>
            <th className="p-3 font-medium">Driver</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Last ping</th>
            <th className="p-3 font-medium">Speed</th>
            <th className="p-3 font-medium">Location</th>
            <th className="p-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {trucks.map((truck) => {
            const driver = driverByTruck[truck.id];
            return (
              <tr
                key={truck.id}
                className="border-b border-surface hover:bg-surface/50"
              >
                <td className="p-3 font-mono text-primary">{truck.id}</td>
                <td className="p-3 text-primary/80">{driver?.name ?? "—"}</td>
                <td className="p-3">
                  <StatusBadge status={truck.status} />
                </td>
                <td className="p-3 text-primary/80">{formatTime(truck.lastPingAt)}</td>
                <td className="p-3 text-primary/80">{truck.speed} mph</td>
                <td className="p-3 font-mono text-primary/70">
                  {truck.lat.toFixed(4)}, {truck.lng.toFixed(4)}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => onSelectTruck(truck)}
                    className="border border-primary/20 bg-white px-2 py-1 text-xs font-medium text-accent hover:bg-surface"
                  >
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-accent/15 text-accent border-accent/30",
    Idle: "bg-surface text-primary/80 border-primary/15",
    Service: "bg-surface text-primary/70 border-primary/15",
  };
  const s = styles[status] ?? "bg-surface text-primary/70 border-primary/15";
  return (
    <span className={`inline-flex border px-2 py-0.5 text-xs font-medium ${s}`}>
      {status}
    </span>
  );
}
