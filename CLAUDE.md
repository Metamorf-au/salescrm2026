# Precision Sales CRM - Project Memory

## Project Overview
- **Name**: Precision Sales CRM (for Precision Group / thepg.com.au)
- **Stack**: React + Vite, Tailwind CSS, Supabase (auth + DB), Recharts, Lucide icons
- **Hosting**: Netlify
- **Target**: Desktop + mobile (responsive, mobile-first polish in progress)

## Architecture
- `src/auth/LoginScreen.jsx` — Login page (Supabase auth)
- `src/manager/ManagerDashboard.jsx` — KPI Dashboard (main manager view with charts, scorecard, status board)
- `src/shared/ActivityLogExplorer.jsx` — Activity log with filters (used inside KPI Dashboard)
- `src/shared/constants.js` — Shared constants (daily/weekly targets, status config, activity type config)
- `src/shared/formatters.js` — Currency/number formatting
- `src/shared/StatusBadge.jsx` — Reusable status badge component
- `src/supabaseClient.js` — Supabase client init
- `src/supabaseData.js` — Data fetching + metric computation (computeRepMetrics, fetchAdminActivityLog)
- `supabase/` — Database migrations

## User Roles
- **manager**: Player-coach role — sells AND manages. Can see all reps, filter by rep, export CSVs
- **rep**: Sales rep — sees only their own data, filters are hidden

## Key Design Decisions
- Mobile detection via `isMobile` prop passed down from app root
- Charts use Recharts (BarChart with ResponsiveContainer)
- On mobile, charts are horizontally scrollable (overflow-x-auto with min-width per bar) so all rep names show clearly
- Filter dropdowns use CSS grid (grid-cols-2) on mobile for symmetrical layout
- Login inputs use text-base (16px) to prevent iOS auto-zoom on focus
- Export CSV button hidden on mobile for KPI Dashboard top filters
- Date presets include: today, this_week, last_7/14/30/60/90, this_month, last_month, this_quarter, custom

## Completed Work (Session: 2026-02-11)
1. Fixed mobile login zoom — changed input font-size from text-sm to text-base (16px)
2. Fixed KPI Dashboard top filters — 2x1 grid layout on mobile (Date + Rep dropdowns equal width)
3. Fixed Activity Log filters — 2x2 grid layout on mobile (Type, Date, Rep, Export)
4. Custom date inputs span full width (col-span-2) when active in both filter areas
5. Made bar charts horizontally scrollable on mobile — 60px min-width per bar, interval={0} forces all labels

## Working Preferences
- **IMPORTANT**: Always check with the user before starting any work. They prefer to work in stages and want to review/approve each step before proceeding.
- Commit and push after each logical change
- Build verification (npx vite build) after each change before committing
- Branch convention: `claude/` prefix with session ID suffix
- Concise commit messages explaining the "why"
- Australian English locale (en-AU) for date formatting
