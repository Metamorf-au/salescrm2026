-- Add completed_at to deals so deal todo completion persists in DB (cross-device sync)
-- Previously deal checkoffs were localStorage-only; now they match the notes pattern.
alter table public.deals add column if not exists todo_completed_at timestamptz;
