import { describe, it, expect } from 'vitest'
import { formatUsd, formatPct } from './format'

describe('format', () => {
  it('formats usd', () => { expect(formatUsd(1234.5)).toContain('$') })
  it('formats positive pct with sign', () => { expect(formatPct(2.3)).toBe('+2.30%') })
  it('formats negative pct', () => { expect(formatPct(-1.2)).toBe('-1.20%') })
  it('handles null pct', () => { expect(formatPct(null)).toBe('—') })
})
