-- ============================================================
-- Settlement confirmation: both parties must verify
-- from_member confirms "I paid", to_member confirms "I got paid"
-- A settlement only adjusts balances once both are true.
-- ============================================================

-- Add confirmation columns (default false)
alter table settlements
  add column confirmed_by_from boolean not null default false,
  add column confirmed_by_to   boolean not null default false;

-- Back-fill existing settlements as fully confirmed
update settlements set confirmed_by_from = true, confirmed_by_to = true;

-- Allow members to update settlements in their household (for confirming)
create policy "update own household settlements"
  on settlements for update to authenticated
  using (household_id = (select public.my_household_id()));

-- ============================================================
-- RPC: request_settlement
-- Either party can initiate a settlement request.
-- The initiator's side is auto-confirmed.
-- ============================================================
create or replace function request_settlement(
  p_from_member bigint,
  p_to_member bigint,
  p_amount integer
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id bigint;
  v_caller_member_id bigint;
  v_new_id bigint;
begin
  -- Get caller's member record
  select id, household_id into v_caller_member_id, v_household_id
  from public.members
  where user_id = auth.uid();

  if v_caller_member_id is null then
    raise exception 'Not a member of any household';
  end if;

  -- Caller must be one of the two parties
  if v_caller_member_id <> p_from_member and v_caller_member_id <> p_to_member then
    raise exception 'You can only create settlements you are part of';
  end if;

  insert into public.settlements (
    household_id, from_member, to_member, amount,
    confirmed_by_from, confirmed_by_to
  ) values (
    v_household_id, p_from_member, p_to_member, p_amount,
    v_caller_member_id = p_from_member,  -- auto-confirm initiator side
    v_caller_member_id = p_to_member
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- ============================================================
-- RPC: confirm_settlement
-- The other party confirms their side.
-- ============================================================
create or replace function confirm_settlement(
  p_settlement_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_member_id bigint;
  v_settlement record;
begin
  select id into v_caller_member_id
  from public.members
  where user_id = auth.uid();

  select * into v_settlement
  from public.settlements
  where id = p_settlement_id;

  if v_settlement is null then
    raise exception 'Settlement not found';
  end if;

  -- Caller must be one of the two parties
  if v_caller_member_id = v_settlement.from_member then
    update public.settlements
    set confirmed_by_from = true
    where id = p_settlement_id;
  elsif v_caller_member_id = v_settlement.to_member then
    update public.settlements
    set confirmed_by_to = true
    where id = p_settlement_id;
  else
    raise exception 'You are not part of this settlement';
  end if;
end;
$$;
