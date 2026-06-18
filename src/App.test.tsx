import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import * as api from './api/coingecko'

afterEach(() => vi.restoreAllMocks())

describe('App', () => {
  it('renders coins from the hook', async () => {
    vi.spyOn(api, 'getMarkets').mockResolvedValue([{
      id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'x',
      current_price: 100, market_cap: 1, total_volume: 2,
      price_change_percentage_1h_in_currency: 0.5,
      price_change_percentage_24h_in_currency: -1.2,
      price_change_percentage_7d_in_currency: 3.4,
      sparkline_in_7d: { price: [1, 2, 3] },
    }] as any)
    render(<App />)
    await waitFor(() => expect(screen.getByText('Bitcoin')).toBeInTheDocument())
  })
})
