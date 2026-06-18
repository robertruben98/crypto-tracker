import type { Coin } from '../types'

const BASE = 'https://api.coingecko.com/api/v3'

export async function getMarkets(): Promise<Coin[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: '50',
    page: '1',
    sparkline: 'true',
    price_change_percentage: '1h,24h,7d',
  })
  const res = await fetch(`${BASE}/coins/markets?${params}`)
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`)
  return res.json() as Promise<Coin[]>
}
