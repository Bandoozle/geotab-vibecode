// src/lib/firestoreTypes.ts
export type DriverDoc = {
  id: string;            // canonical id used by UI (we normalize to this)
  driverId?: string;     // can exist in Firestore
  name: string;
  truckId: string | null;

  safetyScore: number;
  mpg: number;
  onTimePercent: number;
  totalPoints: number;

  badges: string[];
  updatedAt?: string;
};

export type TruckDoc = {
  id: string;            // canonical id used by UI
  driverId: string;

  status: string;

  lastPingAt: string;
  speed: number;
  x: number;
  y: number;
  lat: number;
  lng: number;

  safetyScore: number;
  mpg: number;
  milesToday: number;

  updatedAt?: string;
};

// Charts / collections you read
export type WeeklyMileageDoc = Record<string, any>;
export type FuelTrendDoc = Record<string, any>;
export type AggressiveEventDoc = Record<string, any>;
export type SeatbeltViolationDoc = Record<string, any>;

export type IdlingBreakdownDoc = {
  vehicleType: string;
  idleMinutes: number;
  updatedAt?: string;
};

// shape OperationsTab expects for idling
export type IdlingUi = { name: string; value: number };

export type UserRole = "manager" | "driver";

export type UserDoc = {
  uid: string;
  email: string;
  role: UserRole;

  // link driver identity if role === "driver"
  driverId?: string | null;
  truckId?: string | null;

  createdAt: string; // ISO
};