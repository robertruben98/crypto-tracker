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
