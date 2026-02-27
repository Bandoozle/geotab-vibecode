import { Buffer } from "node:buffer";

const SERVERS = [1, 2, 3, 4, 5, 6, 7] as const;

export type SearchPreset = "last_14_day" | "last_30_day";

export interface DataConnectorConfig {
  database: string;
  username: string;
  password: string;
  serverHint?: string;
}

export interface DataStatus {
  baseUrl: string | null;
  serverNumber: number | null;
  tables?: string[];
}

interface ODataPage<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

function getConfig(): DataConnectorConfig {
  const database = process.env.GEOTAB_DATABASE;
  const username = process.env.GEOTAB_USERNAME;
  const password = process.env.GEOTAB_PASSWORD;
  const serverHint = process.env.GEOTAB_SERVER;

  if (!database || !username || !password) {
    throw new Error(
      "Missing Geotab Data Connector credentials. Please set GEOTAB_DATABASE, GEOTAB_USERNAME and GEOTAB_PASSWORD in your env (.env.local).",
    );
  }

  return { database, username, password, serverHint };
}

function buildAuthHeader(cfg: DataConnectorConfig): string {
  const user = `${cfg.database}/${cfg.username}`;
  const token = Buffer.from(`${user}:${cfg.password}`).toString("base64");
  return `Basic ${token}`;
}

function buildBaseUrl(serverNumber: number): string {
  return `https://odata-connector-${serverNumber}.geotab.com/odata/v4/svc/`;
}

async function fetchJson<T>(url: string, cfg: DataConnectorConfig): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: buildAuthHeader(cfg),
      Accept: "application/json",
    },
    redirect: "follow",
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `Unauthorized/forbidden when calling Data Connector (status ${res.status}). Check username/password and make sure Data Connector is enabled for this user.`,
    );
  }

  if (res.status === 412) {
    throw new Error(
      "Data Connector is not fully activated for this database (HTTP 412). Make sure the Data Connector add-in is installed in MyGeotab and wait for the pipeline to warm up.",
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Data Connector request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

/**
 * Try servers 1..7 (or the hinted one) until we find the correct jurisdiction.
 * Returns { baseUrl, serverNumber }.
 */
export async function findServer(): Promise<DataStatus> {
  const cfg = getConfig();
  const tried: number[] = [];

  const tryOnce = async (server: number): Promise<DataStatus | null> => {
    tried.push(server);
    const baseUrl = buildBaseUrl(server);
    try {
      await fetchJson<unknown>(baseUrl, cfg);
      return { baseUrl, serverNumber: server };
    } catch (err) {
      const msg = String(err);
      if (msg.includes("406") || msg.includes("Jurisdiction")) {
        return null;
      }
      if (
        msg.includes("412") ||
        msg.includes("403") ||
        msg.includes("401")
      ) {
        // Auth / activation problem: propagate (no point trying other servers)
        throw err;
      }
      return null;
    }
  };

  if (cfg.serverHint) {
    const hinted = Number(cfg.serverHint);
    if (Number.isInteger(hinted)) {
      const res = await tryOnce(hinted);
      if (res) return res;
    }
  }

  for (const s of SERVERS) {
    const res = await tryOnce(s);
    if (res) return res;
  }

  throw new Error(
    `Could not find a working Data Connector server (tried: ${tried.join(", ")}).`,
  );
}

export async function listTables(baseUrlOverride?: string): Promise<string[]> {
  const cfg = getConfig();
  const status = baseUrlOverride
    ? { baseUrl: baseUrlOverride }
    : await findServer();
  if (!status.baseUrl) return [];

  const json = await fetchJson<{ value: { name?: string; Name?: string }[] }>(
    status.baseUrl,
    cfg,
  );

  return (json.value || [])
    .map((t) => t.name ?? t.Name)
    .filter((n): n is string => !!n);
}

export interface QueryParams {
  search?: string;
  select?: string;
  filter?: string;
  top?: number;
}

export async function queryTable<T>(
  table: string,
  params: QueryParams = {},
  baseUrlOverride?: string,
): Promise<{ rows: T[]; status: DataStatus }> {
  const cfg = getConfig();
  const status = await findServer();
  const baseUrl = baseUrlOverride ?? status.baseUrl;
  if (!baseUrl) {
    throw new Error("No base URL resolved for Data Connector.");
  }

  const rows: T[] = [];
  let url = new URL(table, baseUrl);

  if (params.search) url.searchParams.set("$search", params.search);
  if (params.select) url.searchParams.set("$select", params.select);
  if (params.filter) url.searchParams.set("$filter", params.filter);
  if (params.top) url.searchParams.set("$top", String(params.top));

  // Follow pagination via @odata.nextLink
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await fetchJson<ODataPage<T>>(url.toString(), cfg);
    if (Array.isArray(page.value)) {
      rows.push(...page.value);
    }
    const next = (page as any)["@odata.nextLink"] as string | undefined;
    if (!next) break;
    url = new URL(next);
  }

  return { rows, status };
}

// ---- Helper queries for common tables ----

export interface LatestVehicleMetadata {
  DeviceId: string;
  DeviceName: string;
  DeviceSerialNumber?: string;
  Device_Health?: string;
  LastGps_Latitude?: number;
  LastGps_Longitude?: number;
  Odometer_Km?: number;
  FuelType?: string;
}

export async function getLatestVehicleMetadata() {
  return queryTable<LatestVehicleMetadata>("LatestVehicleMetadata", {
    select:
      "DeviceId,DeviceName,DeviceSerialNumber,Device_Health,LastGps_Latitude,LastGps_Longitude,Odometer_Km,FuelType",
  });
}

export interface VehicleKpiDaily {
  DeviceId: string;
  DeviceName: string;
  Local_Date: string;
  TotalDistance_Km?: number;
  DrivingDuration_Seconds?: number;
  IdleDuration_Seconds?: number;
  TripCount?: number;
  AfterHoursDrivingDuration_Seconds?: number;
}

export async function getVehicleKpiDaily(
  preset: SearchPreset = "last_30_day",
) {
  return queryTable<VehicleKpiDaily>("VehicleKpi_Daily", {
    search: preset,
    select:
      "DeviceId,DeviceName,Local_Date,TotalDistance_Km,DrivingDuration_Seconds,IdleDuration_Seconds,TripCount,AfterHoursDrivingDuration_Seconds",
  });
}

