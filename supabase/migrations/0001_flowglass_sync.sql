-- Flowglass cloud sync: optional accounts that back up the session log + settings.
-- Run once in the Supabase dashboard (SQL editor) or with `supabase db push`.
-- Every row is private to its owner (row-level security on everything).

-- ── Session log: one row per SessionEvent. Events never change, so sync is
--    "insert what the other side is missing", merged by id.
create table if not exists public.focus_sessions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  event jsonb not null check (pg_column_size(event) <= 4096),
  ended_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists focus_sessions_user_created on public.focus_sessions (user_id, created_at);

alter table public.focus_sessions enable row level security;

create policy "read own sessions" on public.focus_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own sessions" on public.focus_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "delete own sessions" on public.focus_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Settings: one JSON document per user, last write wins.
--    Pro status is NOT stored here (it comes from the store purchase, never the client).
create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb check (pg_column_size(settings) <= 65536),
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "read own state" on public.user_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own state" on public.user_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own state" on public.user_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own state" on public.user_state
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Server clock for updated_at, so devices with a wrong clock can't win every conflict.
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch before insert or update on public.user_state
  for each row execute function public.touch_updated_at();

-- ── "Delete my account" from inside the app. Removing the auth user cascades
--    to both tables above.
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
