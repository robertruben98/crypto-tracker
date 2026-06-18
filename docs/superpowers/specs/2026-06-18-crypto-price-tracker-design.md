# Crypto Price Tracker — Design

**Date:** 2026-06-18
**Status:** Approved

## Purpose

A simple, production-style single-page app that displays live cryptocurrency
market data. Serves as a clean reference example of consuming a real public API
(CoinGecko) and rendering auto-refreshing data in React.

## Stack

- React 18 + Vite + TypeScript
- Native `fetch` (no axios)
- Plain CSS Modules (no UI framework)
- No state library — `useState`/`useEffect` are sufficient

## Architecture

Small, single-purpose units communicating through typed interfaces:

| Unit | Responsibility | Depends on |
|------|----------------|------------|
| `src/api/coingecko.ts` | Only module that touches the network. Exposes `getMarkets(): Promise<Coin[]>` hitting `/coins/markets`. | fetch, types |
| `src/types.ts` | `Coin` interface (id, symbol, name, image, current_price, price_change_percentage_1h/24h/7d, market_cap, total_volume, sparkline_in_7d). | — |
| `src/hooks/useMarkets.ts` | Polling logic. Fetches on mount + every 60s. Returns `{ data, loading, error, lastUpdated }`. Keeps last good data on error. | api/coingecko |
| `src/components/CoinTable.tsx` | Renders the table: rank, logo, name/symbol, price, %1h/24h/7d (green/red), market cap, volume, 7d sparkline. | types |
| `src/components/Sparkline.tsx` | Tiny inline SVG line chart from `sparkline_in_7d.price`. | — |
| `src/components/SearchBar.tsx` | Controlled input, emits filter string. Client-side filter by name/symbol. | — |
| `src/components/ErrorBanner.tsx` | Shows API error (rate limit / network) without clearing the table. | — |
| `src/App.tsx` | Composes hook + components, holds the search filter state. | all above |

## Data Flow

1. `useMarkets` fetches `getMarkets()` on mount, then on a 60s interval.
2. State flows down to `App`.
3. `SearchBar` updates a filter string in `App`.
4. `App` filters the coin list client-side and passes it to `CoinTable`.
5. `Sparkline` draws each row's 7d price series.

## API

CoinGecko free tier, no key required:

```
GET https://api.coingecko.com/api/v3/coins/markets
  ?vs_currency=usd
  &order=market_cap_desc
  &per_page=50
  &page=1
  &sparkline=true
  &price_change_percentage=1h,24h,7d
```

## Error Handling

- **429 (rate limit):** show `ErrorBanner` ("Demasiadas peticiones, reintentando…"), keep last good data, next poll retries.
- **Network failure:** same — banner + retain data.
- **Initial load (no data yet):** loading skeleton rows.

## Testing

- `getMarkets` — mock fetch: maps JSON to `Coin[]`, throws on non-2xx.
- `useMarkets` — fake timers: fetches on mount, re-fetches after 60s, retains data on error.
- `SearchBar`/filter — filtering by name and symbol, case-insensitive.
- `Sparkline` — renders an SVG path for a price array; handles empty array.

## Scope

**In:** top 50 coins in USD, search filter, 60s auto-refresh, 7d sparkline,
error banner, loading skeleton.

**Out (YAGNI):** auth, own backend, multi-fiat, websockets, detailed coin pages,
pagination, sorting controls.

## Deploy

`npm run build` → `dist/` → same VPS static pattern already in use (nginx vhost,
e.g. `cryptotracker.a-robertdev.com`, certbot SSL).
