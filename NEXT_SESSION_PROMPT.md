# Next Session: Manager Dashboard Polish

Please read `CLAUDE.md` first — it has the full project context, directory structure, and the planned work section titled **"Planned Work — Manager Dashboard Polish"**.

## Task

Make 3 changes to `src/manager/ManagerDashboard.jsx` (all changes in this one file):

### 1. Fix CSV Export (Priority — do this first)
The "Export" button currently exports the scorecard table (per-rep rows). **Wrong.** It should export the **summary metric cards/tiles** at the top of the page — the `summaryCards` array. Output a single data row with each card's label as the column header and its value as the data. Include the selected date range and rep filter as the first two columns for context.

### 2. Add Two More Bar Charts (Meetings Set + New Contacts)
Currently there are 2 bar charts: "Calls by Rep" and "Quotes Sent by Rep". Add:
- **Meetings Set by Rep** — data from `metricsMap[r.id].meetingsSet`
- **New Contacts by Rep** — data from `metricsMap[r.id].newContacts`

Arrange all 4 charts in a **2x2 grid** on desktop/tablet (`grid-cols-2`). On mobile, stack vertically with horizontal scroll per chart (existing pattern). When `isThisWeek`, colour bars green/amber/red against pro-rated targets (same logic as the Calls chart). Otherwise use a neutral colour.

### 3. Rearrange Layout — Scoreboard + Table Side by Side
**Current layout**: Charts + Team Scoreboard in a 3/5 + 2/5 split, then scorecard table full width below.

**New desktop/tablet layout**:
- **Full-width 2x2 chart grid** (from step 2 above)
- **Below charts**: Team Scoreboard (~30% left) + Scorecard table (~70% right) side by side

**Mobile**: keep single column — Team Scoreboard above, Scorecard table below.

## Implementation Order
1. Phase 1: CSV export fix → build verify → commit & push
2. Phase 2: Add 2 charts in 2x2 grid → build verify → commit & push
3. Phase 3: Rearrange scoreboard/table layout → build verify → commit & push

**Remember**: Check with the user before starting each phase. Build verify (`npx vite build`) before each commit.
