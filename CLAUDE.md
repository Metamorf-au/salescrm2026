# Precision Sales CRM - Project Memory

## Project Overview
- **Name**: Precision Sales CRM (for Precision Group / thepg.com.au)
- **Stack**: React + Vite, Tailwind CSS, Supabase (auth + DB), Recharts, Lucide icons
- **Hosting**: Netlify
- **Target**: Desktop + mobile (responsive, mobile-first polish in progress)

## Architecture
- `src/auth/LoginScreen.jsx` — Login page (Supabase auth)
- `src/manager/ManagerDashboard.jsx` — KPI Dashboard (main manager view with charts, scorecard, status board)
- `src/rep/RepView.jsx` — Rep dashboard (to-do list, activity log, stats for individual reps)
- `src/contacts/ContactCard.jsx` — Expandable contact card (calls, notes, deals sections)
- `src/contacts/QuickNoteModal.jsx` — Quick note modal for contacts
- `src/shared/ActivityLogExplorer.jsx` — Activity log with filters (used inside KPI Dashboard)
- `src/shared/constants.js` — Shared constants (daily/weekly targets, status config, activity type config, note type config)
- `src/shared/formatters.js` — Currency/number formatting, reminder date formatting
- `src/shared/StatusBadge.jsx` — Reusable status badge component
- `src/shared/Modal.jsx` — Reusable modal component
- `src/supabaseClient.js` — Supabase client init
- `src/supabaseData.js` — Data fetching + metric computation (computeRepMetrics, fetchAdminActivityLog)
- `src/precision-crm-prototype.jsx` — Main app shell / routing
- `supabase/` — Database migrations

## User Roles
- **manager**: Player-coach role — sells AND manages. Can see all reps, filter by rep, export CSVs
- **rep**: Sales rep — sees only their own data, filters are hidden

## Key Design Decisions
- Mobile detection via `isMobile` prop passed down from app root
- Charts use Recharts (BarChart with ResponsiveContainer)
- On mobile, charts are horizontally scrollable (overflow-x-auto with min-width per bar) so all rep names show clearly
- Chart labels use shortName helper — first name only, or "First L." when duplicates exist
- Filter dropdowns use CSS grid (grid-cols-2) on mobile for symmetrical layout
- Login inputs use text-base (16px) to prevent iOS auto-zoom on focus
- Export CSV button hidden on mobile for KPI Dashboard top filters
- Date presets include: today, this_week, last_7/14/30/60/90, this_month, last_month, this_quarter, custom

## Completed Work (Session 1: 2026-02-11 — Mobile & Chart Polish)
1. Fixed mobile login zoom — changed input font-size from text-sm to text-base (16px)
2. Fixed KPI Dashboard top filters — 2x1 grid layout on mobile (Date + Rep dropdowns equal width)
3. Fixed Activity Log filters — 2x2 grid layout on mobile (Type, Date, Rep, Export)
4. Custom date inputs span full width (col-span-2) when active in both filter areas
5. Made bar charts horizontally scrollable on mobile — 60px min-width per bar, interval={0} forces all labels
6. Fixed first rep name clipped on mobile charts — changed BarChart left margin from -20 to 10
7. Fixed desktop chart alignment — reduced YAxis width to 30px, tightened left margin so bars align with heading
8. Added duplicate first name handling — shortName helper appends last initial (e.g. "Anthony B.") when first names clash

## Completed Work (Session 2: 2026-02-11 — To-Do Card & Contact Card Polish)
1. Bumped to-do card note text from text-xs to text-[13px] for better readability
2. Aligned to-do card reminder icon+date to bottom-right (self-end) — anchors cleanly even with long contact/company names that wrap

## Current State & Known Areas
- **To-do cards** (`src/rep/RepView.jsx` lines ~336-369): Each card has checkbox, contact-company+tags line, note text line, and bell icon+date. Icon+date now bottom-right aligned.
- **Contact cards** (`src/contacts/ContactCard.jsx`): Expandable tiles with calls, notes, deals sections. Notes have type badge, text, and date/author line.
- Mobile responsiveness is solid across login, KPI dashboard, charts, and filters
- Desktop chart alignment is tight and clean

## Working Preferences
- **IMPORTANT**: Always check with the user before starting any work. They prefer to work in stages and want to review/approve each step before proceeding.
- Commit and push after each logical change
- Build verification (npx vite build) after each change before committing
- Branch convention: `claude/` prefix with session ID suffix
- Concise commit messages explaining the "why"
- Australian English locale (en-AU) for date formatting
