# Precision Sales CRM - Project Memory

## Project Overview
- **Name**: Precision Sales CRM (for Precision Group / thepg.com.au)
- **Stack**: React 18 + Vite 7, Tailwind CSS 3, Supabase (auth + PostgreSQL), Recharts, Lucide icons
- **Hosting**: Netlify (SPA with hash-based routing)
- **Target**: Desktop + mobile (responsive, mobile-first polish)
- **Locale**: Australian English (en-AU) for all date formatting

## Directory Structure
```
src/
├── admin/              # Admin user management
│   ├── AdminView.jsx       # User list with invite/edit/disable/delete
│   ├── AddUserModal.jsx    # Invite new user (calls Edge Function)
│   ├── EditUserModal.jsx   # Edit user details
│   └── adminApi.js         # Wrapper for admin Edge Function calls
├── assets/
│   └── my-day-logo.svg     # App logo
├── auth/
│   ├── LoginScreen.jsx     # Email + password login (Supabase auth)
│   └── ResetPasswordScreen.jsx  # Password recovery flow
├── contacts/
│   ├── ContactsView.jsx    # Contact list with search, filters, bulk ops
│   ├── ContactCard.jsx     # Expandable contact tile (calls/notes/deals)
│   ├── NewContactModal.jsx # Create contact form
│   ├── EditContactModal.jsx# Edit contact form
│   ├── CallLogModal.jsx    # Log a call (outcome, summary, follow-up)
│   └── QuickNoteModal.jsx  # Quick note with type + reminder
├── deals/
│   ├── PipelineView.jsx    # Kanban board (6 stages)
│   ├── NewDealModal.jsx    # Create deal form
│   ├── EditDealModal.jsx   # Edit deal (logs activity on changes)
│   ├── CloseDealModal.jsx  # Void deal with reason
│   ├── LostReasonModal.jsx # Capture loss reason
│   └── WonCelebrationModal.jsx  # Deal won celebration
├── layout/
│   ├── AppShell.jsx        # ** Main app container ** — auth, routing, data, modals
│   ├── DesktopSidebar.jsx  # Left sidebar nav (56px, slate-900)
│   └── MobileTabBar.jsx    # Bottom tab bar (<640px)
├── manager/
│   └── ManagerDashboard.jsx# KPI scorecard, charts, status board, activity log
├── profile/
│   └── MyProfileModal.jsx  # User profile editing
├── rep/
│   └── RepView.jsx         # "My Day" — to-do list + activity log
├── shared/
│   ├── ActivityLogExplorer.jsx  # Filterable activity log (type, date, rep, CSV export)
│   ├── Modal.jsx           # Reusable modal wrapper (blur overlay, Escape key)
│   ├── StatusBadge.jsx     # Coloured status indicator
│   ├── SuccessScreen.jsx   # Success notification
│   ├── constants.js        # Targets, stage/type configs, colour mappings
│   └── formatters.js       # Currency, date formatting, overdue checks
├── App.jsx                 # Entry wrapper (renders AppShell)
├── main.jsx                # React DOM mount point
├── index.css               # Tailwind CSS imports
├── supabaseClient.js       # Supabase client init (env vars)
├── supabaseData.js         # All data fetching + mutations (~620 lines)
└── precision-crm-prototype.jsx  # [ARCHIVED] Original prototype with mock data
```

```
supabase/
├── schema.sql              # Complete database schema (8 tables, RLS, triggers)
├── migrations/
│   ├── 20260211_add_deal_completed_at.sql
│   └── 20260213_add_composite_indexes.sql
└── functions/
    └── admin-users/
        └── index.ts        # Deno Edge Function (invite, reset, disable, delete users)
```

```
.github/
├── workflows/
│   └── security-audit.yml  # Weekly npm audit + build verification
└── dependabot.yml          # Weekly dependency updates
```

## User Roles
- **rep**: Sales rep — sees only their own data, rep-specific filters hidden
- **manager**: Player-coach — sells AND manages. Sees all reps, can filter by rep, export CSVs
- **admin**: Full access — user management (invite, disable, delete via Edge Function)

## Architecture & Key Patterns

### Routing
- Hash-based routing (`window.location.hash`): `#rep`, `#contacts`, `#pipeline`, `#manager`, `#admin`
- No external router library — managed in `AppShell.jsx`

### Data Flow
- All data loaded once in `AppShell.jsx` on mount; reloaded after mutations
- No optimistic UI — mutations call Supabase, then full data refresh
- `supabaseData.js` contains all fetch/mutation functions
- `computeRepMetrics()` calculates KPI dashboard numbers client-side

### Auth & Security
- Supabase Auth (email + password, magic link for invites)
- Row Level Security (RLS) on all tables — reps see own data, managers/admins see all
- Admin operations route through Deno Edge Function with JWT + service role key
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Responsive Design
- Mobile detection: `isMobile` state (< 640px) in AppShell, passed as prop throughout
- Charts: horizontally scrollable on mobile (60px min-width per bar, `interval={0}`)
- Filter dropdowns: CSS grid (`grid-cols-2`) on mobile
- Login inputs: `text-base` (16px) to prevent iOS auto-zoom
- Pipeline: horizontal scrollable columns on mobile
- Contacts: single column on mobile, 2-col grid on desktop

### Modal System
- Reusable `<Modal>` wrapper with blur overlay, max-width md, `rounded-2xl`
- Escape key closes modals
- All modals managed as state in `AppShell.jsx`

### Activity Logging
- Every user action logged to `activity_log` table for audit trail
- Types: call, new_contact, new_deal, deal_won, deal_lost, deal_voided, quote_sent, quote_requested, note_added, contact_updated, deal_updated, todo_completed

### To-Do System
- Dual source: notes with `reminder_at` + deals with `next_action`/`next_date`
- To-do cards show: checkbox, contact/company + tags, note text, bell icon + date (bottom-right)
- Time shown on to-do cards only for meetings

### Charts
- Recharts (BarChart with ResponsiveContainer)
- `shortName` helper: first name only, or "First L." when duplicates exist
- Desktop: YAxis width 30px, tight left margin
- Mobile: horizontal scroll with all labels visible

## Database Schema (Supabase PostgreSQL)

### Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User accounts (extends auth.users) | name, email, role (rep/manager/admin), status (active/inactive) |
| `companies` | Business accounts | name, domain, city, state, industry, owner_id |
| `contacts` | Contact records | first/last name, email, phone, mobile, job_title, company_id, owner_id, status, last_contact_at |
| `deals` | Sales opportunities | title, value, stage, contact_id, company_id, owner_id, next_action, next_date, todo_completed_at |
| `notes` | Contact notes with reminders | contact_id, author_id, type, text, reminder_at, completed_at |
| `calls` | Call logs | contact_id, caller_id, outcome, summary, called_at |
| `activity_log` | Audit trail | user_id, activity_type, contact_name, company_name, summary, metadata (jsonb) |
| `weekly_summaries` | Manager summaries per ISO week | user_id, week_start, summary |

### Deal Stages
`discovery` → `quote_request` → `quote_sent` → `won` / `lost` / `closed`

### Note Types
`general`, `follow_up`, `meeting`, `pricing`, `internal`

### Call Outcomes
`connected`, `voicemail`, `no_answer`, `meeting`

### Contact Statuses
`active`, `stale`, `new`, `inactive`, `archived`

### Triggers
- `handle_new_user()` — Auto-creates profile on auth signup
- `set_updated_at()` — Auto-updates timestamps on all tables

## Constants & Configuration
- `DAILY_TARGET` = 20 calls
- `WEEKLY_TARGET` = 100 calls
- Pipeline stages, note types, call outcomes, activity types all have colour/icon config in `src/shared/constants.js`
- Currency formatting: AUD, no decimals (`src/shared/formatters.js`)
- Date presets: today, this_week, last_7/14/30/60/90, this_month, last_month, this_quarter, custom

## Development Setup
```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

Requires `.env` or `.env.local`:
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

## CI/CD
- **Netlify**: Auto-deploys from main; build command `npm run build`, publish dir `dist`
- **GitHub Actions** (`security-audit.yml`): Weekly npm audit (fails on high/critical), outdated check, build verification
- **Dependabot**: Weekly dependency updates (Mon 7am Melbourne time), grouped PRs, max 10 open

## Dependencies
**Production**: @supabase/supabase-js, react, react-dom, recharts, lucide-react
**Dev**: vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer

## Testing
No test suite currently configured. Build verification (`npx vite build`) is used as a smoke test before commits.

## Completed Work

### Session 1 (2026-02-11) — Mobile & Chart Polish
1. Fixed mobile login zoom — input font-size from text-sm to text-base (16px)
2. Fixed KPI Dashboard top filters — 2x1 grid on mobile
3. Fixed Activity Log filters — 2x2 grid on mobile
4. Custom date inputs span full width (col-span-2) when active
5. Made bar charts horizontally scrollable on mobile — 60px min-width per bar
6. Fixed first rep name clipped on mobile charts — BarChart left margin from -20 to 10
7. Fixed desktop chart alignment — YAxis width 30px, tightened left margin
8. Added duplicate first name handling — shortName helper with last initial

### Session 2 (2026-02-11) — To-Do Card & Contact Card Polish
1. Bumped to-do card note text from text-xs to text-[13px]
2. Aligned to-do card reminder icon+date to bottom-right (self-end)

### Session 3 (2026-02-11) — To-Do Card Refinements
1. Changed to-do qualifier from note type to reminder presence
2. Slimmed to-do cards to match activity card design, then restored separate bordered cards
3. Added breathing room between to-do card lines, bumped reminder font size
4. Fixed follow-up note creating a proper to-do with reminder
5. Restored Quote Requested toggle in CallLogModal (only shown when outcome is Connected)
6. Used phone icon for quote_requested activity type

### Session 4 (2026-02-11) — Formatting & UX Fixes
1. Fixed todo cards showing random 8pm time — show date only
2. Fixed duplicate formatReminderDate still showing time on todo cards
3. Show time on todo cards only for meetings (where user picked a time)

### Session 5 (2026-02-11) — UI Polish
1. Aligned activity log icon box colours to 4 core action buttons
2. Enlarged sidebar logo ~12%
3. Added Escape key to close modals

### Session 6 (2026-02-12) — Mobile Activity Card Layout
1. Restructured RepView "My Activity" cards for mobile — 3-line layout:
   - Line 1: Contact name (full width to breathe)
   - Line 2: Summary text
   - Line 3: Badge left, time right (matches to-do card pattern)
   Desktop layout unchanged (single row with icon, name+badge, summary, time)

### Session 7 (2026-02-13) — My Scorecard & Team Scoreboard
Replaced opaque CRM Compliance score with a clear 5-KPI pro-rated scoring system.

**Scoring engine** (`constants.js`, `supabaseData.js`):
1. New `getScorecard()` function — scores reps on 5 KPIs (Calls, Meetings Set, New Contacts, Quotes Sent, Deal Health) pro-rated to the day of the week
2. Rewrote `getStatus()` to use the 5-KPI system — green (5/5), amber (3–4/5), red (0–2/5)
3. Added `activeDealsCount` and `dealsWithNextCount` to `computeRepMetrics()`

**Rep view** (`RepView.jsx`):
4. Removed CRM Compliance tile, added "Deal Health" tile (HeartHandshake icon, X/Y deals with next action)
5. Added "My Scorecard" tile (Gauge icon, X/5 with 5 coloured segments)
6. Added "Quote Turnaround" card, switched desktop KPIs to 5-column grid
7. Colour-coded progress bars against pro-rated targets (green on pace, amber/red behind)
8. Mobile layout: 3 rows of 2 tiles

**Manager view** (`ManagerDashboard.jsx`):
9. Renamed "Status Board" → "Team Scoreboard" with per-rep traffic light tiles showing initials, name, X/5 score, status badge, and "Behind: ..." detail
10. Updated scorecard table — replaced CRM Compliance with Deal Health column, colour-coded cells against pro-rated targets
11. CSV export matches scorecard table columns

**Database**:
12. Added 6 composite indexes for query performance at scale (`20260213_add_composite_indexes.sql`)

## Planned Work — Manager Dashboard Polish

### What's Changing

Three improvements to `ManagerDashboard.jsx`:

### 1. Fix CSV Export — Export Metrics Cards (not Scorecard Table)
The main CSV export button currently exports the scorecard table data. The intent is to export the **metrics cards/tiles** at the top of the page (the `summaryCards` array: Calls Today, Weekly Calls, Meetings Set, New Contacts, Deal Health, Quotes Requested, Quotes Sent, Quote Turnaround, Pipeline Value, Reps On Track).

**Current behaviour**: `handleExport()` builds CSV from `filteredReps` with per-rep scorecard columns.
**Desired behaviour**: `handleExport()` should export a single row of the summary card values — one column per card (label → value), plus the selected date range and rep filter as context. This is a team-level snapshot, not a per-rep breakdown.

### 2. Add Meetings Set & New Contacts Bar Charts (2x2 Grid)
Currently there are 2 bar charts (Calls by Rep, Quotes Sent by Rep) stacked vertically on the left side. Add two more:
- **Meetings Set by Rep** — same pattern as the existing charts, using `meetingsSet` from metrics
- **New Contacts by Rep** — same pattern, using `newContacts` from metrics

On desktop/tablet: arrange all 4 charts in a **2x2 grid** (no longer sharing space with Team Scoreboard).
On mobile: stack vertically (1 column), each chart horizontally scrollable as per existing pattern.

Colour logic for Meetings & Contacts charts: when `isThisWeek`, colour bars green/amber/red against pro-rated targets (same as Calls chart). Otherwise, use a neutral colour.

### 3. Rearrange Layout — Team Scoreboard + Scorecard Table Side by Side
Currently: charts (left 3/5) + Team Scoreboard (right 2/5), then scorecard table full width below.

**New desktop/tablet layout** (below the 2x2 chart grid):
- **Left ~30%**: Team Scoreboard (traffic light tiles)
- **Right ~70%**: Scorecard table

**Mobile**: keep stacked — Team Scoreboard above, Scorecard table below (1 column).

### Files Affected (1 file)
| File | Changes |
|------|---------|
| `src/manager/ManagerDashboard.jsx` | All 3 changes — CSV export, new charts, layout rearrangement |

### Implementation Phases

**Phase 1 — CSV Export Fix** `[ ]`
Rewrite `handleExport()` to export the summary cards data instead of the scorecard table. Single row with card labels as headers and card values as data.

**Phase 2 — Add Meetings & Contacts Charts** `[ ]`
Add `meetingsChartData` and `contactsChartData` arrays. Render 4 charts in a 2x2 grid on desktop (`grid-cols-2`). Each chart follows the existing pattern (ResponsiveContainer, BarChart, mobile horizontal scroll). Apply target-based colouring when `isThisWeek`.

**Phase 3 — Rearrange Scoreboard + Table Layout** `[ ]`
Remove the current 3/5 + 2/5 split. Place the 2x2 chart grid full width. Below it, a new flex/grid row: Team Scoreboard (~30%, `lg:w-[30%]`) on the left, Scorecard table (~70%, `lg:w-[70%]`) on the right. Mobile keeps single column.

### Key Implementation Details
- **CSV export**: Headers from `summaryCards.map(c => c.label)`, single data row from `summaryCards.map(c => c.value)`. Include date range and rep filter as first two columns for context.
- **Chart data arrays**: Follow the same `filteredReps.map(r => ...)` pattern as `chartData` and `quotesChartData`.
- **Pro-rated chart colouring**: When `isThisWeek`, use `proRate(rt.weeklyMeetings)` / `proRate(rt.weeklyContacts)` as thresholds. Green if >= target, amber if >= 80%, red otherwise. When not `isThisWeek`, use a neutral colour (e.g. `#8b5cf6` for meetings, `#0284c7` for contacts).
- **Layout CSS**: Use `lg:flex` with `lg:w-[30%]` and `lg:w-[70%]` for the scoreboard/table row, or `lg:grid lg:grid-cols-10` with `lg:col-span-3` / `lg:col-span-7`.

## Working Preferences
- **IMPORTANT**: Always check with the user before starting any work. They prefer to work in stages and want to review/approve each step before proceeding.
- Commit and push after each logical change
- Build verification (`npx vite build`) after each change before committing
- Branch convention: `claude/` prefix with session ID suffix
- Concise commit messages explaining the "why"
- Australian English locale (en-AU) for date formatting

## File Quick Reference

### Where to find things
| What | Where |
|------|-------|
| App routing & state | `src/layout/AppShell.jsx` |
| All DB queries/mutations | `src/supabaseData.js` |
| KPI calculations | `computeRepMetrics()` in `src/supabaseData.js` |
| Colour/icon configs | `src/shared/constants.js` |
| Date/currency formatting | `src/shared/formatters.js` |
| To-do cards rendering | `src/rep/RepView.jsx` |
| Contact card rendering | `src/contacts/ContactCard.jsx` |
| Pipeline kanban | `src/deals/PipelineView.jsx` |
| Admin user management | `src/admin/AdminView.jsx` + Edge Function |
| Database schema | `supabase/schema.sql` |
