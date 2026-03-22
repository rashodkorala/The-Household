-- ============================================================
-- RPC: update_expense
-- Updates expense + replaces splits in a single transaction.
-- Only the creator can update their own expense.
-- ============================================================
create or replace function update_expense(
  p_expense_id bigint,
  p_description text,
  p_amount integer,
  p_category text,
  p_paid_by bigint,
  p_split_type text,
  p_splits jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  split_item jsonb;
begin
  -- Verify caller created this expense
  if not exists (
    select 1 from public.expenses
    where id = p_expense_id and created_by = auth.uid()
  ) then
    raise exception 'You can only edit expenses you created';
  end if;

  -- Update the expense
  update public.expenses set
    description = p_description,
    amount = p_amount,
    category = p_category,
    paid_by = p_paid_by,
    split_type = p_split_type
  where id = p_expense_id;

  -- Delete old splits and insert new ones
  delete from public.expense_splits where expense_id = p_expense_id;

  for split_item in select * from jsonb_array_elements(p_splits)
  loop
    insert into public.expense_splits (expense_id, member_id, amount)
    values (
      p_expense_id,
      (split_item->>'member_id')::bigint,
      (split_item->>'amount')::integer
    );
  end loop;
end;
$$;
