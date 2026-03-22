-- ============================================================
-- Row Level Security
-- Best practices applied per Supabase Postgres guidelines:
--   - Every policy scoped to `authenticated` role (no anon access)
--   - `force row level security` on all tables
--   - auth.uid() wrapped in (select ...) for per-query caching
--   - security definer helper with search_path locked
--   - Indexes on columns used in RLS filters (see 001_schema.sql)
-- ============================================================

-- Enable and force RLS on all tables
-- FORCE ensures RLS applies even to table owners
alter table households enable row level security;
alter table households force row level security;

alter table members enable row level security;
alter table members force row level security;

alter table expenses enable row level security;
alter table expenses force row level security;

alter table expense_splits enable row level security;
alter table expense_splits force row level security;

alter table settlements enable row level security;
alter table settlements force row level security;

-- Helper: get current user's household_id
-- security definer: bypasses RLS when called inside policies
-- set search_path = '': prevents search_path hijacking
create or replace function my_household_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from public.members
  where user_id = (select auth.uid())
  limit 1;
$$;

-- ============================================================
-- Households
-- ============================================================

create policy "members can read own household"
  on households for select
  to authenticated
  using (id = (select my_household_id()));

-- Any authenticated user can create a household (onboarding)
create policy "authenticated users can create household"
  on households for insert
  to authenticated
  with check (true);

create policy "members can update own household"
  on households for update
  to authenticated
  using (id = (select my_household_id()))
  with check (id = (select my_household_id()));

-- ============================================================
-- Members
-- ============================================================

create policy "read own household members"
  on members for select
  to authenticated
  using (household_id = (select my_household_id()));

-- Can only insert yourself as a member
create policy "insert self as member"
  on members for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Can only update your own member record
create policy "update own member record"
  on members for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============================================================
-- Expenses
-- ============================================================

create policy "read own household expenses"
  on expenses for select
  to authenticated
  using (household_id = (select my_household_id()));

create policy "insert own household expenses"
  on expenses for insert
  to authenticated
  with check (household_id = (select my_household_id()));

create policy "delete own expenses"
  on expenses for delete
  to authenticated
  using (created_by = (select auth.uid()));

create policy "update own expenses"
  on expenses for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (household_id = (select my_household_id()));

-- ============================================================
-- Expense Splits
-- ============================================================

-- Use a security definer function to avoid nested subquery per row
create or replace function is_my_household_expense(p_expense_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.expenses
    where id = p_expense_id
      and household_id = (
        select household_id
        from public.members
        where user_id = (select auth.uid())
        limit 1
      )
  );
$$;

create policy "read own household splits"
  on expense_splits for select
  to authenticated
  using ((select is_my_household_expense(expense_id)));

create policy "insert own household splits"
  on expense_splits for insert
  to authenticated
  with check ((select is_my_household_expense(expense_id)));

-- ============================================================
-- Settlements
-- ============================================================

create policy "read own household settlements"
  on settlements for select
  to authenticated
  using (household_id = (select my_household_id()));

create policy "insert own household settlements"
  on settlements for insert
  to authenticated
  with check (household_id = (select my_household_id()));

-- ============================================================
-- Grants
-- RLS policies with `to authenticated` already block anon from
-- reading any rows, so no need to revoke table access.
-- Ensure authenticated role has the required table permissions.
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
