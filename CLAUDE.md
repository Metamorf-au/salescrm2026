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
│   └── 20260211_add_deal_completed_at.sql
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

## Planned Work — My Scorecard & Rep Scoreboard

### Background
CRM Compliance is a made-up composite score (30pts call today + 40pts opp progression + 30pts pipeline clean) that tries to measure rep engagement but is opaque and only checks 2 things (calls + pipeline housekeeping). Replacing it with a clear 5-KPI system that uses the per-rep targets already configured in admin settings.

### What's Changing

**Concept**: Replace CRM Compliance with **"My Scorecard"** (rep view) and **"Rep Scoreboard"** (manager view). Score reps on 5 KPIs, pro-rated to the day of the week so Tuesday isn't judged by Friday's targets.

**The 5 Scored KPIs:**
| # | KPI | Target | Source |
|---|-----|--------|--------|
| 1 | Calls | Weekly target from `kpiTargets` (default 100) | `callsWeek` in `computeRepMetrics()` |
| 2 | Meetings Set | Weekly target from `kpiTargets` (default 10) | `meetingsSet` in `computeRepMetrics()` |
| 3 | New Contacts | Weekly target from `kpiTargets` (default 5) | `newContacts` in `computeRepMetrics()` |
| 4 | Quotes Sent | Weekly target from `kpiTargets` (default 10) | `quotesSentCount` in RepView |
| 5 | Deal Health | 100% of active deals have a next action | `oppWithNext` in `computeRepMetrics()` |

**Pro-rating logic**: If weekly call target is 100 and it's Wednesday (day 3 of 5), the pro-rated target is 60. Rep is "on pace" if actual >= pro-rated target.

**Traffic light scoring:**
- **Green** — on pace for all 5
- **Amber** — on pace for 3 or 4
- **Red** — on pace for 2 or fewer

### Files Affected (6 files)
| File | Changes |
|------|---------|
| `src/shared/constants.js` | Rewrite `getStatus()` with 5-KPI pro-rated scoring logic |
| `src/supabaseData.js` | Remove CRM compliance from `computeRepMetrics()`, add deal health fields (dealsWithNext count, activeDeals count) |
| `src/rep/RepView.jsx` | Remove CRM Compliance tile, add "Deal Health" tile + "My Scorecard" tile, mobile layout becomes 3x2 grid (6 tiles) |
| `src/manager/ManagerDashboard.jsx` | Rename "Status Board" → "Rep Scoreboard", update traffic light cards to show "X/5 on pace · behind on...", update "Reps On Track" card, clean up scorecard table (remove CRM Compliance column, add Deal Health) |
| `src/deals/NewDealModal.jsx` | Rename label "Next Action" → "Next Step" |
| `src/deals/EditDealModal.jsx` | Rename label "Next Action" → "Next Step" |

### Implementation Phases

**Phase 1 — Scoring Foundation** `[ ]`
Rewrite `getStatus()` in `constants.js` and update `computeRepMetrics()` in `supabaseData.js`. New 5-KPI pro-rated scoring engine. No UI changes — this is the engine underneath everything else.

**Phase 2 — Rep Dashboard (My Scorecard)** `[ ]`
Update `RepView.jsx`: Remove CRM Compliance tile. Add "Deal Health" tile (% of active deals with next action). Add "My Scorecard" tile (X/5 with segmented bar). Mobile becomes 3 rows of 2 tiles. Colour-code progress bars against pro-rated targets.

**Phase 3 — Manager Dashboard (Rep Scoreboard)** `[ ]`
Update `ManagerDashboard.jsx`: Rename "Status Board" → "Rep Scoreboard". Traffic light cards show "X/5 on pace · Calls, Quotes behind". Update "Reps On Track" card. Clean up scorecard table (swap CRM Compliance for Deal Health).

**Phase 4 — Rename Next Action → Next Step** `[ ]`
Quick label change in `NewDealModal.jsx` and `EditDealModal.jsx`.

### Key Implementation Details
- **Pro-rating**: `dayOfWeek` = Mon=1 through Fri=5. Pro-rated target = `Math.round(weeklyTarget * dayOfWeek / 5)`. Weekends use Friday (day 5 = full target).
- **Deal Health target** is always 100% (not configurable) — every active deal should have a next action set.
- **No DB changes needed** — all calculation is client-side from existing metrics.
- **Existing `kpiTargets`** per-rep settings stay as-is, no changes to admin settings.
- **`computeRepMetrics()` changes**: Remove `crmCompliance` field. Add `activeDealsCount` and `dealsWithNextCount` for the Deal Health tile to show "8/10 deals".
- **Mobile "My Scorecard" tile**: shows X/5 score with 5 coloured segments (green/amber/red per KPI). No labels — the 5 other tiles already show the detail.

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
