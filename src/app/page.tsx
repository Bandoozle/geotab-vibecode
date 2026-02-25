"use client";

import {
  getIdlingBreakdownByVehicleType,
  getFleetMileageLastWeek,
  getLast3MonthsFuelTrend,
  getTop5AggressiveDrivers,
  getTop5SeatbeltViolations,
} from "@/lib/fakeData";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { DashboardCard } from "@/components/DashboardCard";
import { DriverChallenge } from "@/components/DriverChallenge";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from "recharts";

const PIE_COLORS = ["#25477b", "#0078d3", "#5a7ba8", "#3d8fd9", "#eff2f7"];
const BAR_FILL = "#25477b";
const LINE_STROKE = "#0078d3";
const GRID_STROKE = "#eff2f7";

export default function DashboardPage() {
  const idlingData = getIdlingBreakdownByVehicleType();
  const mileageData = getFleetMileageLastWeek();
  const fuelData = getLast3MonthsFuelTrend();
  const aggressiveData = getTop5AggressiveDrivers();
  const seatbeltData = getTop5SeatbeltViolations();

  return (
    <div className="min-h-full">
      <FilterBar />

      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Idling Breakdown by Vehicle Type */}
          <DashboardCard title="Idling Breakdown by Vehicle Type">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={idlingData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {idlingData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                    itemStyle={{ color: "#25477b" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Fleet Mileage (last week) - horizontal bar */}
          <DashboardCard title="Fleet Mileage (last week)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mileageData}
                  layout="vertical"
                  margin={{ left: 32, right: 16 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis type="category" dataKey="day" width={32} tick={{ fontSize: 11, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Bar dataKey="miles" fill={BAR_FILL} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Last 3 Months Fuel Trend - vertical bar + line */}
          <DashboardCard title="Last 3 Months Fuel Trend">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fuelData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Bar dataKey="fuelBurnt" fill="#eff2f7" />
                  <Line type="monotone" dataKey="trend" stroke={LINE_STROKE} strokeWidth={2} dot={{ fill: LINE_STROKE }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Top 5 Aggressive Drivers - stacked bar */}
          <DashboardCard title="Top 5 Aggressive Drivers">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggressiveData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  layout="vertical"
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis type="category" dataKey="driver" width={70} tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="harshBraking" stackId="a" fill="#25477b" name="Harsh Braking" />
                  <Bar dataKey="harshCornering" stackId="a" fill="#0078d3" name="Harsh Cornering" />
                  <Bar dataKey="hardAcceleration" stackId="a" fill="#eff2f7" name="Hard Acceleration" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Top 5 Seatbelt Violations */}
          <DashboardCard title="Top 5 Seatbelt Violations">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seatbeltData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="driver" tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <YAxis tick={{ fontSize: 10, fill: "#25477b" }} stroke="#25477b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #eff2f7",
                    }}
                  />
                  <Bar dataKey="count" fill={BAR_FILL} name="Incident Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Gamification: Driver Challenge + link to Leaderboard */}
          <div className="sm:col-span-2 lg:col-span-1">
            <DriverChallenge />
            <Link
              href="/leaderboard"
              className="mt-4 block border border-primary/15 bg-surface px-4 py-3 text-center text-sm font-medium text-accent hover:bg-primary/5"
            >
              View Leaderboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
