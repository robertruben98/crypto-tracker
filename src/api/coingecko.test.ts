import { describe, it, expect, vi, afterEach } from 'vitest'
import { getMarkets } from './coingecko'

const sample = [{
  id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'x',
  current_price: 100, market_cap: 1, total_volume: 2,
  price_change_percentage_1h_in_currency: 0.5,
  price_change_percentage_24h_in_currency: -1.2,
  price_change_percentage_7d_in_currency: 3.4,
  sparkline_in_7d: { price: [1, 2, 3] },
}]

afterEach(() => vi.restoreAllMocks())

describe('getMarkets', () => {
  it('returns parsed coins on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      { ok: true, json: () => Promise.resolve(sample) }))
    const coins = await getMarkets()
    expect(coins).toHaveLength(1)
    expect(coins[0].id).toBe('bitcoin')
  })

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    await expect(getMarkets()).rejects.toThrow('429')
  })

  it('requests usd, 50 coins, sparkline and pct windows', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    vi.stubGlobal('fetch', f)
    await getMarkets()
    const url = f.mock.calls[0][0] as string
    expect(url).toContain('vs_currency=usd')
    expect(url).toContain('per_page=50')
    expect(url).toContain('sparkline=true')
    expect(url).toContain('price_change_percentage=1h%2C24h%2C7d')
  })
})
