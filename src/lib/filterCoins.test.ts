import { describe, it, expect } from 'vitest'
import { filterCoins } from './filterCoins'

const coins = [
  { name: 'Bitcoin', symbol: 'btc' },
  { name: 'Ethereum', symbol: 'eth' },
] as any[]

describe('filterCoins', () => {
  it('returns all on empty query', () => {
    expect(filterCoins(coins, '')).toHaveLength(2)
  })
  it('matches by name case-insensitively', () => {
    expect(filterCoins(coins, 'bit')).toEqual([coins[0]])
  })
  it('matches by symbol', () => {
    expect(filterCoins(coins, 'ETH')).toEqual([coins[1]])
  })
})
