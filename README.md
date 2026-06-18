# 🪙 Crypto Tracker

A small, production-style single-page app that shows live cryptocurrency market
data from the [CoinGecko API](https://www.coingecko.com/en/api). Top-50 coins by
market cap, auto-refreshed every 60 seconds, with client-side search and 7-day
sparklines.

**Live demo:** https://cryptotracker.a-robertdev.com

## Features

- **Live market data** — top 50 coins in USD from CoinGecko (no API key required)
- **Auto-refresh** — polls every 60s; keeps the last good data if a refresh fails
- **Search** — instant client-side filter by name or symbol
- **Per-coin metrics** — price, 1h / 24h / 7d change (color-coded), market cap
- **7-day sparkline** — inline SVG trend chart per coin
- **Resilient** — rate-limit / network errors show a banner without wiping the table
- **Dark mode** — follows the OS color scheme

## Tech Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict)
- [Vite](https://vite.dev/) for dev/build
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for tests
- Plain CSS (no UI framework)

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Run the test suite
npm test

# Production build (type-check + bundle to dist/)
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
src/
├── api/coingecko.ts      # Only module that touches the network
├── hooks/useMarkets.ts   # 60s polling hook (data/loading/error/lastUpdated)
├── lib/
│   ├── filterCoins.ts    # Client-side search filter
│   └── format.ts         # USD / percentage formatting
├── components/
│   ├── SearchBar.tsx
│   ├── CoinTable.tsx
│   ├── Sparkline.tsx     # Inline SVG 7-day chart
│   └── ErrorBanner.tsx
└── App.tsx               # Composition
```

Every unit has its own focused test. Network access is confined to a single
module so the rest of the app stays pure and testable.

## Data Source

Market data comes from the free CoinGecko public API
(`/coins/markets`). No API key or backend is needed.

## License

[MIT](./LICENSE) © Robert Ruben
