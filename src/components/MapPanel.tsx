"use client";

import type { Truck } from "@/lib/fakeData";

interface MapPanelProps {
  trucks: Truck[];
  selectedTruckId: string | null;
  onSelectTruck: (truck: Truck) => void;
}

const MAP_WIDTH = 500;
const MAP_HEIGHT = 400;

export function MapPanel({ trucks, selectedTruckId, onSelectTruck }: MapPanelProps) {
  return (
    <div className="overflow-hidden border border-primary/15 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-tight text-primary">Truck positions</h3>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full bg-surface"
        style={{ minHeight: 320 }}
      >
        {/* Grid lines */}
        {[100, 200, 300, 400].map((n) => (
          <line
            key={`v-${n}`}
            x1={n}
            y1={0}
            x2={n}
            y2={MAP_HEIGHT}
            stroke="#e0e5ec"
            strokeWidth="1"
          />
        ))}
        {[100, 200, 300].map((n) => (
          <line
            key={`h-${n}`}
            x1={0}
            y1={n}
            x2={MAP_WIDTH}
            y2={n}
            stroke="#e0e5ec"
            strokeWidth="1"
          />
        ))}
        {/* Roads */}
        <path
          d="M 0 200 L 500 200 M 250 0 L 250 400"
          fill="none"
          stroke="#c5cdd9"
          strokeWidth="8"
          strokeLinecap="square"
        />
        {/* Truck points */}
        {trucks.map((truck) => {
          const selected = truck.id === selectedTruckId;
          return (
            <g
              key={truck.id}
              onClick={() => onSelectTruck(truck)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={truck.x - (selected ? 14 : 10)}
                y={truck.y - (selected ? 14 : 10)}
                width={selected ? 28 : 20}
                height={selected ? 28 : 20}
                fill={selected ? "#0078d3" : "#25477b"}
                stroke="#25477b"
                strokeWidth={1}
              />
              <text
                x={truck.x}
                y={truck.y - 18}
                textAnchor="middle"
                fill="#25477b"
                fontSize="10"
                fontWeight="bold"
              >
                {truck.id.replace("TRK-", "")}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-primary/60">Click a point to open truck details.</p>
    </div>
  );
}
