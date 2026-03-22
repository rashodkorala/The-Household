-- ============================================================
-- Schema: The Household
-- Best practices applied per Supabase Postgres guidelines:
--   - bigint identity PKs (sequential, no index fragmentation)
--   - NOT NULL on all required FK columns
--   - Indexes on every foreign key column
--   - timestamptz for all timestamps
--   - text instead of varchar
-- ============================================================

-- Households
create table households (
  id bigint generated always as identity primary key,
  name text not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 6)),
  created_at timestamptz not null default now()
);

-- Members (links auth users to a household)
create table members (
  id bigint generated always as identity primary key,
  household_id bigint not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#4ECDC4',
  joined_at timestamptz not null default now(),
  unique(household_id, user_id)
);

create index members_household_id_idx on members (household_id);
create index members_user_id_idx on members (user_id);

-- Expenses
create table expenses (
  id bigint generated always as identity primary key,
  household_id bigint not null references households(id) on delete cascade,
  description text not null,
  amount integer not null check (amount > 0),  -- stored in cents
  currency text not null default 'CAD',
  category text,
  paid_by bigint not null references members(id),
  split_type text not null check (split_type in ('equal_all', 'equal_selected', 'custom')),
  receipt_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index expenses_household_id_idx on expenses (household_id);
create index expenses_paid_by_idx on expenses (paid_by);
create index expenses_created_by_idx on expenses (created_by);
create index expenses_created_at_idx on expenses (created_at desc);

-- Per-member split amounts for each expense
create table expense_splits (
  id bigint generated always as identity primary key,
  expense_id bigint not null references expenses(id) on delete cascade,
  member_id bigint not null references members(id),
  amount integer not null check (amount >= 0),  -- cents
  percentage numeric(5,2)
);

create index expense_splits_expense_id_idx on expense_splits (expense_id);
create index expense_splits_member_id_idx on expense_splits (member_id);

-- Recorded settlements
create table settlements (
  id bigint generated always as identity primary key,
  household_id bigint not null references households(id) on delete cascade,
  from_member bigint not null references members(id),
  to_member bigint not null references members(id),
  amount integer not null check (amount > 0),  -- cents
  note text,
  settled_at timestamptz not null default now()
);

create index settlements_household_id_idx on settlements (household_id);
create index settlements_from_member_idx on settlements (from_member);
create index settlements_to_member_idx on settlements (to_member);
