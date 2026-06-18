import type { Coin } from '../types'
import { Sparkline } from './Sparkline'
import { formatUsd, formatPct } from '../lib/format'

const pctClass = (n: number | null) =>
  n === null ? '' : n >= 0 ? 'up' : 'down'

export function CoinTable({ coins }: { coins: Coin[] }) {
  return (
    <table className="coin-table">
      <thead>
        <tr>
          <th>#</th><th>Nombre</th><th>Precio</th>
          <th>1h</th><th>24h</th><th>7d</th><th>Market Cap</th><th>7d</th>
        </tr>
      </thead>
      <tbody>
        {coins.map((c, i) => (
          <tr key={c.id}>
            <td>{i + 1}</td>
            <td className="name">
              <img src={c.image} alt="" width={20} height={20} />
              {c.name} <span className="symbol">{c.symbol.toUpperCase()}</span>
            </td>
            <td>{formatUsd(c.current_price)}</td>
            <td className={pctClass(c.price_change_percentage_1h_in_currency)}>
              {formatPct(c.price_change_percentage_1h_in_currency)}</td>
            <td className={pctClass(c.price_change_percentage_24h_in_currency)}>
              {formatPct(c.price_change_percentage_24h_in_currency)}</td>
            <td className={pctClass(c.price_change_percentage_7d_in_currency)}>
              {formatPct(c.price_change_percentage_7d_in_currency)}</td>
            <td>{formatUsd(c.market_cap)}</td>
            <td><Sparkline prices={c.sparkline_in_7d?.price ?? []} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
