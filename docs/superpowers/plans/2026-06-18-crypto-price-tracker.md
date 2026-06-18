# Crypto Price Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React SPA that shows live top-50 crypto market data from CoinGecko with 60s auto-refresh, search, and 7d sparklines.

**Architecture:** Vite + React + TypeScript SPA. A single network module (`api/coingecko.ts`) feeds a polling hook (`useMarkets`), which drives presentational components (`CoinTable`, `Sparkline`, `SearchBar`, `ErrorBanner`) composed in `App`. Client-side filtering only; no backend.

**Tech Stack:** React 18, Vite, TypeScript, Vitest + @testing-library/react, plain CSS Modules.

## Global Constraints

- Node 18+; package manager `npm`.
- TypeScript strict mode on.
- Network calls live ONLY in `src/api/coingecko.ts`.
- CoinGecko free tier, no API key: base `https://api.coingecko.com/api/v3`.
- Currency fixed to USD; 50 coins; refresh interval 60000ms.
- All tests via Vitest; `npm test` must pass before each commit.
- Commit on a feature branch only (master is hook-blocked).

---

### Task 1: Scaffold project + test tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `vitest.config.ts`, `src/test/setup.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a runnable Vite app and `npm test` wired to Vitest + jsdom.

- [ ] **Step 1: Scaffold Vite React-TS app**

Run (from `/home/arobertdev/Workspaces/robertdev/crypto-tracker`, which already has git + docs):
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```
If `npm create` refuses due to existing files, scaffold into a temp dir and copy in the generated `src/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `package.json` without overwriting `docs/` or `.gitignore`.

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```
Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Sanity test**

Create `src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
describe('smoke', () => {
  it('runs', () => { expect(1 + 1).toBe(2) })
})
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react-ts + vitest"
```

---

### Task 2: Coin type

**Files:**
- Create: `src/types.ts`

**Interfaces:**
- Produces: `Coin` interface used by every later task.

- [ ] **Step 1: Write the type**

Create `src/types.ts`:
```ts
export interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  total_volume: number
  price_change_percentage_1h_in_currency: number | null
  price_change_percentage_24h_in_currency: number | null
  price_change_percentage_7d_in_currency: number | null
  sparkline_in_7d: { price: number[] }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add Coin type"
```

---

### Task 3: CoinGecko API module

**Files:**
- Create: `src/api/coingecko.ts`
- Test: `src/api/coingecko.test.ts`

**Interfaces:**
- Consumes: `Coin` from `src/types.ts`.
- Produces: `getMarkets(): Promise<Coin[]>` — fetches `/coins/markets`, throws `Error` on non-OK response.

- [ ] **Step 1: Write the failing test**

Create `src/api/coingecko.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/api/coingecko.test.ts`
Expected: FAIL ("getMarkets is not a function" / cannot find module).

- [ ] **Step 3: Write minimal implementation**

Create `src/api/coingecko.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/api/coingecko.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/coingecko.ts src/api/coingecko.test.ts
git commit -m "feat: add coingecko getMarkets"
```

---

### Task 4: useMarkets polling hook

**Files:**
- Create: `src/hooks/useMarkets.ts`
- Test: `src/hooks/useMarkets.test.ts`

**Interfaces:**
- Consumes: `getMarkets` from `src/api/coingecko.ts`, `Coin` from types.
- Produces: `useMarkets(): { data: Coin[]; loading: boolean; error: string | null; lastUpdated: number | null }` — fetches on mount, re-fetches every 60000ms, retains last good `data` on error.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useMarkets.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMarkets } from './useMarkets'
import * as api from '../api/coingecko'

const coin = (id: string) => ({ id } as any)

beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('useMarkets', () => {
  it('loads data on mount', async () => {
    vi.spyOn(api, 'getMarkets').mockResolvedValue([coin('bitcoin')])
    const { result } = renderHook(() => useMarkets())
    await act(async () => { await Promise.resolve() })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.loading).toBe(false)
  })

  it('re-fetches after 60s', async () => {
    const spy = vi.spyOn(api, 'getMarkets').mockResolvedValue([coin('btc')])
    renderHook(() => useMarkets())
    await act(async () => { await Promise.resolve() })
    expect(spy).toHaveBeenCalledTimes(1)
    await act(async () => { vi.advanceTimersByTime(60000); await Promise.resolve() })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('keeps last good data and sets error on failure', async () => {
    const spy = vi.spyOn(api, 'getMarkets')
    spy.mockResolvedValueOnce([coin('btc')])
    spy.mockRejectedValueOnce(new Error('429'))
    const { result } = renderHook(() => useMarkets())
    await act(async () => { await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(60000); await Promise.resolve() })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.error).toContain('429')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useMarkets.test.ts`
Expected: FAIL (cannot find module / useMarkets undefined).

- [ ] **Step 3: Write minimal implementation**

Create `src/hooks/useMarkets.ts`:
```ts
import { useEffect, useRef, useState } from 'react'
import { getMarkets } from '../api/coingecko'
import type { Coin } from '../types'

const REFRESH_MS = 60000

export function useMarkets() {
  const [data, setData] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    async function load() {
      try {
        const coins = await getMarkets()
        if (!mounted.current) return
        setData(coins)
        setError(null)
        setLastUpdated(Date.now())
      } catch (e) {
        if (!mounted.current) return
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        if (mounted.current) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => { mounted.current = false; clearInterval(id) }
  }, [])

  return { data, loading, error, lastUpdated }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useMarkets.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMarkets.ts src/hooks/useMarkets.test.ts
git commit -m "feat: add useMarkets polling hook"
```

---

### Task 5: SearchBar + filter helper

**Files:**
- Create: `src/components/SearchBar.tsx`, `src/lib/filterCoins.ts`
- Test: `src/lib/filterCoins.test.ts`

**Interfaces:**
- Consumes: `Coin` from types.
- Produces:
  - `filterCoins(coins: Coin[], query: string): Coin[]` — case-insensitive match on `name` or `symbol`; empty query returns all.
  - `SearchBar({ value, onChange }: { value: string; onChange: (q: string) => void })` — controlled text input.

- [ ] **Step 1: Write the failing test**

Create `src/lib/filterCoins.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/filterCoins.test.ts`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write implementations**

Create `src/lib/filterCoins.ts`:
```ts
import type { Coin } from '../types'

export function filterCoins(coins: Coin[], query: string): Coin[] {
  const q = query.trim().toLowerCase()
  if (!q) return coins
  return coins.filter(
    (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
  )
}
```
Create `src/components/SearchBar.tsx`:
```tsx
interface Props { value: string; onChange: (q: string) => void }

export function SearchBar({ value, onChange }: Props) {
  return (
    <input
      type="search"
      placeholder="Buscar moneda…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Buscar moneda"
    />
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/filterCoins.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/filterCoins.ts src/lib/filterCoins.test.ts src/components/SearchBar.tsx
git commit -m "feat: add coin filter + search bar"
```

---

### Task 6: Sparkline component

**Files:**
- Create: `src/components/Sparkline.tsx`
- Test: `src/components/Sparkline.test.tsx`

**Interfaces:**
- Produces: `Sparkline({ prices }: { prices: number[] })` — renders an inline `<svg>` with one `<polyline>`; empty array renders an empty `<svg>` (no polyline).

- [ ] **Step 1: Write the failing test**

Create `src/components/Sparkline.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('renders a polyline for a price series', () => {
    const { container } = render(<Sparkline prices={[1, 2, 3, 2, 4]} />)
    expect(container.querySelector('polyline')).toBeTruthy()
  })
  it('renders no polyline for empty data', () => {
    const { container } = render(<Sparkline prices={[]} />)
    expect(container.querySelector('polyline')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Sparkline.test.tsx`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write minimal implementation**

Create `src/components/Sparkline.tsx`:
```tsx
interface Props { prices: number[]; width?: number; height?: number }

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Sparkline.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Sparkline.tsx src/components/Sparkline.test.tsx
git commit -m "feat: add sparkline component"
```

---

### Task 7: ErrorBanner + CoinTable

**Files:**
- Create: `src/components/ErrorBanner.tsx`, `src/components/CoinTable.tsx`, `src/lib/format.ts`
- Test: `src/lib/format.test.ts`, `src/components/CoinTable.test.tsx`

**Interfaces:**
- Consumes: `Coin`, `Sparkline`.
- Produces:
  - `formatUsd(n: number): string`, `formatPct(n: number | null): string` (lib/format).
  - `ErrorBanner({ message }: { message: string })` — renders `role="alert"` with the message.
  - `CoinTable({ coins }: { coins: Coin[] })` — one `<tr>` per coin with name, price, 24h %, and a Sparkline.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatUsd, formatPct } from './format'

describe('format', () => {
  it('formats usd', () => { expect(formatUsd(1234.5)).toContain('$') })
  it('formats positive pct with sign', () => { expect(formatPct(2.3)).toBe('+2.30%') })
  it('formats negative pct', () => { expect(formatPct(-1.2)).toBe('-1.20%') })
  it('handles null pct', () => { expect(formatPct(null)).toBe('—') })
})
```
Create `src/components/CoinTable.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/format.test.ts src/components/CoinTable.test.tsx`
Expected: FAIL (cannot find modules).

- [ ] **Step 3: Write implementations**

Create `src/lib/format.ts`:
```ts
export function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n)
}

export function formatPct(n: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}
```
Create `src/components/ErrorBanner.tsx`:
```tsx
export function ErrorBanner({ message }: { message: string }) {
  return <div role="alert" className="error-banner">⚠️ {message}</div>
}
```
Create `src/components/CoinTable.tsx`:
```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.ts src/components/CoinTable.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts src/components/ErrorBanner.tsx src/components/CoinTable.tsx src/components/CoinTable.test.tsx
git commit -m "feat: add format helpers, error banner, coin table"
```

---

### Task 8: App composition + styles

**Files:**
- Modify: `src/App.tsx` (replace generated content)
- Create: `src/App.css` (or replace generated), `src/index.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useMarkets`, `SearchBar`, `CoinTable`, `ErrorBanner`, `filterCoins`.
- Produces: default-exported `App` rendering header, search, error banner (when error), and the filtered table.

- [ ] **Step 1: Write the failing test**

Create `src/App.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (generated App has no coins / getByText throws).

- [ ] **Step 3: Write the implementation**

Replace `src/App.tsx`:
```tsx
import { useMemo, useState } from 'react'
import { useMarkets } from './hooks/useMarkets'
import { filterCoins } from './lib/filterCoins'
import { SearchBar } from './components/SearchBar'
import { CoinTable } from './components/CoinTable'
import { ErrorBanner } from './components/ErrorBanner'
import './App.css'

export default function App() {
  const { data, loading, error, lastUpdated } = useMarkets()
  const [query, setQuery] = useState('')
  const coins = useMemo(() => filterCoins(data, query), [data, query])

  return (
    <main className="app">
      <header>
        <h1>🪙 Crypto Tracker</h1>
        {lastUpdated && (
          <span className="updated">
            Actualizado {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </header>
      <SearchBar value={query} onChange={setQuery} />
      {error && <ErrorBanner message={error} />}
      {loading && data.length === 0
        ? <p className="loading">Cargando mercado…</p>
        : <CoinTable coins={coins} />}
    </main>
  )
}
```
Replace `src/App.css`:
```css
.app { max-width: 1100px; margin: 0 auto; padding: 1.5rem; font-family: system-ui, sans-serif; }
header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1rem; }
.updated { color: #888; font-size: .85rem; }
input[type="search"] { width: 100%; padding: .6rem .8rem; margin-bottom: 1rem; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; }
.coin-table { width: 100%; border-collapse: collapse; font-size: .92rem; }
.coin-table th, .coin-table td { padding: .5rem .6rem; text-align: right; border-bottom: 1px solid #eee; }
.coin-table th:nth-child(2), .coin-table td.name { text-align: left; }
.coin-table td.name { display: flex; align-items: center; gap: .5rem; }
.coin-table .symbol { color: #999; font-size: .8rem; }
.up { color: #16c784; } .down { color: #ea3943; }
.error-banner { background: #fff3cd; color: #8a6d3b; padding: .6rem .8rem; border-radius: 8px; margin-bottom: 1rem; }
.loading { color: #888; }
@media (prefers-color-scheme: dark) {
  body { background: #131722; color: #e6e6e6; }
  .coin-table th, .coin-table td { border-color: #2a2e39; }
  input[type="search"] { background: #1e222d; color: #e6e6e6; border-color: #2a2e39; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.css src/App.test.tsx src/index.css
git commit -m "feat: compose app shell with search and table"
```

---

### Task 9: Full build verification

**Files:** none (verification only).

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: PASS (all tests across tasks 1–8).

- [ ] **Step 2: Type-check + production build**

Run: `npm run build`
Expected: `tsc` passes (strict) and Vite emits `dist/` with no errors.

- [ ] **Step 3: Manual smoke (optional)**

Run: `npm run preview` and open the served URL; confirm the table fills with live coins within ~2s and the "Actualizado" time appears.

- [ ] **Step 4: Commit any build-config fixes**

```bash
git add -A
git commit -m "chore: verify production build"
```

---

## Self-Review

**Spec coverage:**
- Stack (React+Vite+TS, Vitest, CSS) → Task 1. ✓
- `Coin` type → Task 2. ✓
- `api/coingecko.getMarkets` (only network module, exact query params) → Task 3. ✓
- `useMarkets` polling 60s, retains data on error → Task 4. ✓
- `SearchBar` + client-side filter → Task 5. ✓
- `Sparkline` 7d → Task 6. ✓
- `CoinTable` (rank, logo, name, price, %1h/24h/7d, market cap, sparkline) + `ErrorBanner` + formatting → Task 7. ✓
- `App` composition, loading skeleton, error banner → Task 8. ✓
- Build/type-check verification → Task 9. ✓
- Deploy → out of plan scope (handled by existing VPS deploy flow after merge).

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `Coin` fields (`price_change_percentage_*_in_currency`, `sparkline_in_7d.price`) used identically in tasks 2,3,4,7,8. `getMarkets`, `useMarkets`, `filterCoins`, `formatUsd`, `formatPct`, `Sparkline`, `CoinTable`, `ErrorBanner`, `SearchBar` signatures match across producing/consuming tasks. ✓
