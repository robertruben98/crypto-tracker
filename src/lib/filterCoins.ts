import type { Coin } from '../types'

export function filterCoins(coins: Coin[], query: string): Coin[] {
  const q = query.trim().toLowerCase()
  if (!q) return coins
  return coins.filter(
    (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
  )
}
