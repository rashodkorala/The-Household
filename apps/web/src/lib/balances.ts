interface Expense {
  amount: number
  paid_by: number
  splits: { member_id: number; amount: number }[]
}

export function computeBalances(expenses: Expense[]): Record<number, number> {
  const balances: Record<number, number> = {}

  for (const expense of expenses) {
    balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount
    for (const split of expense.splits) {
      balances[split.member_id] = (balances[split.member_id] || 0) - split.amount
    }
  }

  return balances
}
