# Geotab Data Connector – Quick Reference

Source: [geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide) / DATA_CONNECTOR.md

## Auth & URL

- **Auth:** HTTP Basic. Username = `database_name/email`, password = MyGeotab password.
- **Base URL:** `https://odata-connector-{server}.geotab.com/odata/v4/svc/`
- **Servers:** 1=EU, 2=US, 3=CA, 4=AU, 5=BR, 6=AS, 7=USGov. Wrong server → **406 Jurisdiction Mismatch**.

## Activation (demo DBs)

- **Administration → System Settings → Add-Ins** → Add: `https://app.geotab.com/addins/geotab/dataConnector/manifest.json`
- User clearances: **Launch Custom Reports or Add-Ins**, **View "Geotab Data Connector" Add-In**
- New DB: metadata tables work soon; **KPI/safety tables can be empty 2–3 hours** (pipeline backfill).

## Query rules

- **Date filter:** `$search=last_14_day` or `last_30_day` (not `$filter` for date range).
- **Pagination:** Follow `@odata.nextLink` until exhausted.
- **Columns:** Use `$select` to limit payload.

## Tables we use

| Table                  | Date filter | Use |
|------------------------|-------------|-----|
| LatestVehicleMetadata  | No          | Vehicle list, last GPS, health |
| VehicleKpi_Daily       | Yes         | Distance, drive/idle, trips, after-hours |
| VehicleSafety_Daily    | Yes         | Per-vehicle safety (if available) |
| FaultMonitoring       | No          | Current faults (optional) |

## Errors

- **406** – Wrong server; try next server number.
- **412** – Data Connector not active or user missing clearances.
- **401/403** – Bad credentials or no access.
