# Ready to Roll — Holistic Driver Safety Platform

> **Geotab Vibe Coding Hackathon 2026** | Category: Safety & Compliance

---

## What Is Ready to Roll?

Ready to Roll is a pre-trip driver safety platform that evaluates a driver's readiness to drive by combining four dimensions — driving history, hours of service compliance, vehicle health, and a voluntary wellness check-in — into a single Drive Readiness Score.

Unlike existing tools that either monitor the vehicle or ask a single "how are you?" question, Ready to Roll looks at the whole driver. And critically, it's designed so that drivers can't game the system by just saying they feel fine.

---

## The Problem

### 1. Existing fleet tools are built for managers, not drivers
Geotab and similar platforms surface rich data about vehicle behavior — speeding events, harsh braking, idling time. But almost none of this is communicated back to the driver in a useful, timely, supportive way. Drivers find out they had a bad week on Friday's report. By then, the moment for coaching has passed.

### 2. Mental health check-ins don't work if drivers lie
A common approach is to ask drivers "how are you feeling?" before a shift. This sounds good in theory. In practice, drivers who need to work — or who fear being sidelined — will always answer "fine." Self-reported data is unreliable when the stakes are high.

**Ready to Roll's answer:** Self-reported wellness is only 15% of the score. The other 85% comes from objective data the driver can't easily manipulate. If their driving history is poor or they've worked seven days straight, the system flags them — regardless of what they say in the check-in.

---

## How the Readiness Score Works

### The Four Dimensions

| Dimension | Weight | What It Measures | Data Source |
|-----------|--------|-----------------|-------------|
| **Driving History** | 35% | Safety score based on speeding, harsh braking, acceleration events | `Get.ExceptionEvent`, `Get.Trip` |
| **HOS Compliance** | 30% | Consecutive days worked, total hours this week vs. legal limits | `Get.Trip`, `Get.Driver` (HOS rules) |
| **Vehicle Health** | 20% | Number of active (unresolved) fault codes on the driver's truck | `Get.FaultData`, `Get.DVIRLog` |
| **Wellness Check-In** | 15% | Self-reported mood (1–5), stress level (1–5), hours slept | Driver-entered at check-in |

### The Formula

```
totalScore =
  (drivingHistoryScore × 0.35) +
  (hosComplianceScore  × 0.30) +
  (vehicleHealthScore  × 0.20) +
  (wellnessScore       × 0.15)
```

Each dimension is normalised to a 0–100 scale:

- **Driving History:** `(safetyScore - 65) / 33 × 100` — a score of 72 maps to ~21, 98 maps to 100
- **HOS Compliance:** Average of days-remaining score and hours-remaining score, capped at 100
- **Vehicle Health:** 100 (0 faults), 72 (1 fault), 44 (2 faults), 18 (3+ faults)
- **Wellness:** Weighted average of mood, inverted-stress, and sleep normalised to 0–100

### The Override Rule

> *Objective data wins over self-report.*

If the driving history score is below 48 **or** the HOS compliance score is below 38, the total score is capped at 54 (At Risk) — regardless of what the driver reported in their wellness check-in. This is the mechanism that prevents "lying fine."

### Risk Levels

| Score | Level | Meaning |
|-------|-------|---------|
| 80–100 | 🟢 **Ready** | Cleared to drive |
| 55–79 | 🟡 **Caution** | Drive with care — manager notified |
| 0–54 | 🔴 **At Risk** | Not recommended — manager gets urgent alert |

---

## What the Driver Sees

### The Check-In Screen (`/checkin`)

A simple form the driver completes in under 30 seconds:

1. **Who are you?** — name selector
2. **How are you feeling?** — slider from Exhausted (1) to Energised (5)
3. **Stress level?** — slider from Very Stressed (1) to Very Calm (5)
4. **Hours slept?** — slider from 4h to 9h+
5. **Anything on your mind?** — optional free-text note

After submitting, the driver sees:

- Their **Drive Readiness Score** (0–100) with colour coding
- A **score breakdown** showing all four dimensions
- A **personalised coaching message** targeted at their primary risk trigger
- If Yellow or Red: a note that their dispatcher has been given a heads-up, with reassurance that this is advisory, not a hard block

### Tone
The language throughout is **supportive, not punitive**. The system is framed as being on the driver's side — helping them stay safe — not as surveillance. No driver is blocked from driving. The system advises; humans decide.

---

## What the Manager Sees

### Dashboard Widget (`/`)

A small "Fleet Readiness Today" card visible on the main dashboard:
- Green / Caution / At Risk counts at a glance
- Link to the full Safety board
- Link to the driver check-in page

If any driver is At Risk (Red), their alert cards appear directly on the dashboard for immediate visibility.

### Fleet Safety Board (`/safety`)

The full manager view:

**KPI Row**
- Count of Ready, Caution, At Risk, and No Check-In drivers

**At-Risk Alerts**
- One card per Yellow or Red driver showing:
  - Driver name, truck ID, risk badge with score
  - Which dimensions triggered the flag (e.g., "Hours / HOS", "Driving history")
  - A specific recommended action (e.g., "Driver is near HOS limits — consider reassigning or shortening route")
  - An "Acknowledge" button to dismiss after action is taken

**Mood vs. Safety Score Correlation Chart**
- A scatter plot showing each driver's average wellness score against their safety score over the last 7 days
- Demonstrates the relationship between how drivers feel and how safely they drive
- Green/yellow/red dots by risk level

**Readiness Breakdown Table**
- All 12 drivers with scores for each of the four dimensions
- Sortable at a glance — identifies which dimension is dragging each driver's score down

**Hours of Service Table**
- Consecutive days worked and hours this week per driver
- Visual flags for drivers approaching HOS limits

### Manager Warning Logic

Alerts fire for:
- **Red (At Risk):** Shown prominently on the main dashboard and at the top of the Safety board. High urgency.
- **Yellow (Caution):** Shown on the Safety board. Manager is informed but not alarmed.
- **Not checked in:** Counted separately — manager can see who hasn't completed their check-in today.

---

## Acceptance Criteria

- [ ] Driver can complete the check-in form in under 30 seconds
- [ ] A driver who reports perfect wellness (mood 5, stress 1, sleep 9) but has a poor driving history score is still flagged Yellow or Red
- [ ] A driver who has worked 8 consecutive days is flagged regardless of their wellness check-in
- [ ] Manager sees alert cards for all Yellow and Red drivers on the Safety board
- [ ] Manager sees Red driver alerts directly on the main dashboard
- [ ] Coaching message is specific to the driver's primary trigger (not a generic tip)
- [ ] No driver is hard-blocked from driving — all warnings are advisory
- [ ] Drivers who have not yet checked in are counted separately (not penalised)
- [ ] Acknowledge button removes alert from view (UI state only in this demo)
- [ ] Correlation scatter chart shows mood scores vs. safety scores for all drivers

---

## Intended Impact

| Stakeholder | Benefit |
|-------------|---------|
| **Driver** | Gets timely, personal coaching instead of a Friday report. Feels supported, not surveilled. |
| **Fleet Manager** | Early warning before incidents happen. Knows which drivers need a check-in before they leave the yard. |
| **Safety Officer** | Data showing the link between driver wellness and safety events — evidence for mental health investment. |
| **Company** | Fewer preventable accidents → lower insurance → less downtime → retained drivers. |

### The Mental Health Angle
Trucking has one of the highest rates of stress-related illness, burnout, and isolation of any profession. Most fleet software ignores this entirely. Ready to Roll acknowledges that the human behind the wheel matters — and creates a feedback loop that makes it safe for drivers to be honest without fear of losing shifts.

---

## Geotab API Integration (Production)

This demo uses seeded fake data. To connect to a real Geotab fleet:

| Feature | Current (Demo) | Production API |
|---------|---------------|----------------|
| Driving history score | `driver.safetyScore` from fake data | `Get.ExceptionEvent` (speeding, harsh braking, acceleration) |
| HOS compliance | Pre-seeded `CONSECUTIVE_DAYS` and `HOURS_THIS_WEEK` | `Get.Trip` with date filters to calculate hours; `Get.Driver` for HOS ruleset |
| Vehicle health | Pre-seeded `VEHICLE_ACTIVE_FAULTS` | `Get.FaultData` filtered to active faults for the driver's truck |
| Coaching message | Deterministic rule-based messages | **Geotab Ace API** — pass driver history + check-in data for personalised coaching |
| Correlation data | Pre-seeded scatter points | Aggregate check-in history joined to `Get.Trip` safety metrics |

### Replacing the Coaching Message with Geotab Ace

In `src/lib/wellnessData.ts`, the `buildCoachingMessage` function is the swap point:

```typescript
// Current (demo):
function buildCoachingMessage(triggers: string[], riskLevel: RiskLevel): string {
  // rule-based messages
}

// Production: call Geotab Ace with context
async function buildCoachingMessage(driver: Driver, readiness: DriverReadiness): Promise<string> {
  const response = await geotabAce.query(`
    Driver ${driver.name} has a readiness score of ${readiness.totalScore}.
    Their triggered dimensions are: ${readiness.triggers.join(", ")}.
    Generate a brief, supportive coaching message (2-3 sentences) for this driver
    before their shift. Tone: encouraging, specific, not punitive.
  `);
  return response.text;
}
```

---

## Known Limitations & Future Work

- **Check-in history is not persisted** — in this demo, check-ins are session-only. Production would store them in a database or use Geotab's Storage API.
- **No real-time updates** — the Safety board is static. Production would poll or use webhooks for live data.
- **HOS data is approximated** — actual HOS calculations involve complex regulatory rules (FMCSA 11-hour, 14-hour, 70-hour rules). A production system would use Geotab's built-in HOS engine.
- **Correlation chart uses synthetic data** — production would join real check-in history with actual safety event data.
- **No mobile app** — drivers would ideally complete check-ins on a mobile device or in-cab tablet. The current UI is responsive but not optimised for mobile.
- **Voice check-in** — a future version could allow drivers to complete check-ins hands-free via voice (Whisper + TTS) before entering the cab.

---

*Built for the Geotab Vibe Coding Hackathon 2026 — Feb 12 to Mar 2, 2026*
