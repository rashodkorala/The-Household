-- ============================================================
-- RPC: add_expense
-- Inserts expense + splits in a single transaction,
-- bypassing the RLS SELECT issue on returning the new row.
-- ============================================================
create or replace function add_expense(
  p_household_id bigint,
  p_description text,
  p_amount integer,
  p_category text,
  p_paid_by bigint,
  p_split_type text,
  p_splits jsonb  -- array of { "member_id": number, "amount": number }
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_expense_id bigint;
  split_item jsonb;
begin
  -- Verify caller belongs to this household
  if not exists (
    select 1 from public.members
    where household_id = p_household_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this household';
  end if;

  -- Insert expense
  insert into public.expenses (
    household_id, description, amount, category,
    paid_by, split_type, created_by
  ) values (
    p_household_id, p_description, p_amount, p_category,
    p_paid_by, p_split_type, auth.uid()
  )
  returning id into new_expense_id;

  -- Insert splits
  for split_item in select * from jsonb_array_elements(p_splits)
  loop
    insert into public.expense_splits (expense_id, member_id, amount)
    values (
      new_expense_id,
      (split_item->>'member_id')::bigint,
      (split_item->>'amount')::integer
    );
  end loop;

  return new_expense_id;
end;
$$;
