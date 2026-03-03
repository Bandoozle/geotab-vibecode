import { findServer, getLatestVehicleMetadata } from "@/lib/dataConnectorClient";
import { NextResponse } from "next/server";

/**
 * GET /api/data/status
 * Checks if Geotab Data Connector is reachable with current .env.local credentials.
 * Returns server number, vehicle count (from LatestVehicleMetadata), or error.
 */
export async function GET() {
  // Check env first so we can return a clear message
  const database = process.env.GEOTAB_DATABASE;
  const username = process.env.GEOTAB_USERNAME;
  const password = process.env.GEOTAB_PASSWORD;

  if (!database?.trim() || !username?.trim() || !password?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        statusCode: 400,
        error: "Missing credentials. Add GEOTAB_DATABASE, GEOTAB_USERNAME and GEOTAB_PASSWORD to .env.local (copy from .env.example).",
        hint: "Restart the dev server (npm run dev) after changing .env.local.",
      },
      { status: 400 }
    );
  }

  try {
    const status = await findServer();
    const { rows } = await getLatestVehicleMetadata();
    return NextResponse.json({
      ok: true,
      serverNumber: status.serverNumber,
      baseUrl: status.baseUrl,
      vehicleCount: rows.length,
      message:
        status.serverNumber != null
          ? `Connected to server ${status.serverNumber}. ${rows.length} vehicle(s) in LatestVehicleMetadata.`
          : `Connected via data-connector.geotab.com. ${rows.length} vehicle(s) in LatestVehicleMetadata.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const statusCode = message.includes("Unauthorized") || message.includes("403") || message.includes("412")
      ? 401
      : 503;
    return NextResponse.json(
      {
        ok: false,
        statusCode,
        error: message,
        hint:
          message.includes("412")
            ? "Data Connector add-in may not be active. In MyGeotab: Administration → System Settings → Add-Ins → add the Data Connector manifest URL."
            : message.includes("401") || message.includes("403")
              ? "Check database name, email and password in .env.local. Ensure your user has Data Connector access."
              : "Try setting GEOTAB_SERVER in .env.local (2=US, 3=CA, etc.) or check network.",
      },
      { status: statusCode }
    );
  }
}
