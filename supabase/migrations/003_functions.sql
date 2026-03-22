-- ============================================================
-- RPC: create_household
-- Creates a household and adds the calling user as a member
-- in a single transaction, avoiding the RLS chicken-and-egg
-- problem (can't SELECT household before member row exists).
-- ============================================================
create or replace function create_household(
  household_name text,
  member_display_name text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id bigint;
begin
  insert into public.households (name)
  values (household_name)
  returning id into new_household_id;

  insert into public.members (household_id, user_id, display_name)
  values (new_household_id, auth.uid(), member_display_name);

  return new_household_id;
end;
$$;

-- ============================================================
-- RPC: join_household
-- Joins an existing household by invite code.
-- ============================================================
create or replace function join_household(
  invite text,
  member_display_name text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_household_id bigint;
begin
  select id into found_household_id
  from public.households
  where invite_code = upper(invite);

  if found_household_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.members (household_id, user_id, display_name)
  values (found_household_id, auth.uid(), member_display_name);

  return found_household_id;
end;
$$;
