export interface Transfer {
  from: number
  to: number
  amount: number
}

export function computeSettlements(balances: Record<number, number>): Transfer[] {
  const entries = Object.entries(balances).map(([id, amount]) => ({ id: Number(id), amount }))
  const transfers: Transfer[] = []

  if (entries.length < 2) return transfers

  while (true) {
    entries.sort((a, b) => a.amount - b.amount)
    const debtor = entries[0]
    const creditor = entries[entries.length - 1]

    if (!debtor || !creditor || Math.abs(debtor.amount) < 1 || creditor.amount < 1) break

    const transfer = Math.min(creditor.amount, Math.abs(debtor.amount))
    transfers.push({ from: debtor.id, to: creditor.id, amount: transfer })
    debtor.amount += transfer
    creditor.amount -= transfer
  }

  return transfers
}
