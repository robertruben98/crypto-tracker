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
