# Practice Fleet Dashboard

A hackathon-style fleet dashboard for big trucks with analytics, gamification, and a leaderboard.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Charts:** Recharts
- **Map:** SVG placeholder with plotted truck positions
- **Data:** Local sample data in `src/lib/fakeData.ts` today; can be wired to the Geotab Data Connector (OData v4) for live fleet KPIs.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

1. **Dashboard** – KPIs (Total Trucks, Active, Miles Today, Avg MPG, Safety Score, Fault Alerts), line chart (miles/day), bar chart (safety distribution), pie chart (faults by category), plus gamification scoring rules and Driver Challenge of the Week.
2. **Live Tracking** – Table of 8–12 trucks (ID, driver, status, last ping, speed, location), SVG map with clickable truck points, detail drawer with last 10 pings, recent faults, and safety trend mini chart.
3. **Gamification** – Points formula (safety 50%, fuel 20%, on-time 20%, faults penalty 10%), 5 badges (Safe Streak, Fuel Saver, On-Time Hero, Smooth Operator, Fix-It Fast), Driver Challenge progress bar.
4. **Leaderboard** – Top 10 drivers by points, filter by Today / 7 days / 30 days, badges and key stats, playful “Winner gets promotion to Better Trucker (no pay raise) + trophy” banner.

## Project structure

- `src/app/` – Pages (Dashboard, Tracking, Leaderboard) and layout
- `src/components/` – KPICard, ChartCard, TruckTable, MapPanel, DriverDrawer, BadgePill, LeaderboardTable, DriverChallenge, Sidebar
- `src/lib/fakeData.ts` – Types and seeded data generators
