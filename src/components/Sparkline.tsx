interface Props {
  prices: number[]
  width?: number
  height?: number
}

export function Sparkline({ prices, width = 100, height = 30 }: Props) {
  if (prices.length < 2) return <svg width={width} height={height} />
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min || 1
  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width
      const y = height - ((p - min) / span) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const up = prices[prices.length - 1] >= prices[0]
  return (
    <svg width={width} height={height} role="img" aria-label="7d trend">
      <polyline
        points={points}
        fill="none"
        stroke={up ? '#16c784' : '#ea3943'}
        strokeWidth="1.5"
      />
    </svg>
  )
}
