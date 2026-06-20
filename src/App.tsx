import { useMemo, useState } from 'react'
import { useMarkets } from './hooks/useMarkets'
import { filterCoins } from './lib/filterCoins'
import { SearchBar } from './components/SearchBar'
import { CoinTable } from './components/CoinTable'
import { ErrorBanner } from './components/ErrorBanner'
import './App.css'

function friendlyError(error: string): string {
  if (error.includes('429')) return 'Too many requests, retrying…'
  return 'Failed to update markets, retrying…'
}

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
            Updated at {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </header>
      <SearchBar value={query} onChange={setQuery} />
      {error && <ErrorBanner message={friendlyError(error)} />}
      {loading && data.length === 0
        ? <p className="loading">Loading markets…</p>
        : <CoinTable coins={coins} />}
    </main>
  )
}
