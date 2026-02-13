-- ============================================================
-- ADD COMPOSITE INDEXES FOR SCALE
-- ============================================================
-- These composite indexes optimise the most common multi-column
-- queries: rep metrics, pipeline views, to-do rendering, and
-- activity feeds. Without them, Postgres falls back to scanning
-- a single-column index then filtering — fine at 100 users,
-- painful at 1000+.
--
-- Safe to run on a live database — CREATE INDEX IF NOT EXISTS
-- prevents errors if any already exist.
-- ============================================================

-- 1. Calls: rep metrics filter by caller + date range
--    Used by: computeRepMetrics (calls today, calls this week, meetings set)
create index if not exists idx_calls_caller_date
  on public.calls(caller_id, called_at desc);

-- 2. Deals: pipeline view + deal health filter by owner + stage
--    Used by: PipelineView, computeRepMetrics (active deals, deals with next action)
create index if not exists idx_deals_owner_stage
  on public.deals(owner_id, stage);

-- 3. Deals: quotes sent metric filters by owner + quote_sent_at date
--    Used by: computeRepMetrics (quotesSentCount), ManagerDashboard charts
create index if not exists idx_deals_owner_quote_sent
  on public.deals(owner_id, quote_sent_at desc)
  where quote_sent_at is not null;

-- 4. Contacts: contact list filters by owner + status
--    Used by: ContactsView filters, computeRepMetrics (new contacts)
create index if not exists idx_contacts_owner_status
  on public.contacts(owner_id, status);

-- 5. Activity log: feeds always filter by user + order by date
--    Used by: RepView activity feed, ActivityLogExplorer
create index if not exists idx_activity_user_date
  on public.activity_log(user_id, created_at desc);

-- 6. Notes: to-do rendering filters by contact + reminder date
--    Used by: RepView to-do cards, contact card note lists
create index if not exists idx_notes_contact_reminder
  on public.notes(contact_id, reminder_at desc)
  where reminder_at is not null;
