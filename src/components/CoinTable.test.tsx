import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoinTable } from './CoinTable'

const coins = [{
  id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'x',
  current_price: 100, market_cap: 1, total_volume: 2,
  price_change_percentage_1h_in_currency: 0.5,
  price_change_percentage_24h_in_currency: -1.2,
  price_change_percentage_7d_in_currency: 3.4,
  sparkline_in_7d: { price: [1, 2, 3] },
}] as any[]

describe('CoinTable', () => {
  it('renders a row per coin', () => {
    render(<CoinTable coins={coins} />)
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText(/BTC/i)).toBeInTheDocument()
  })
})
