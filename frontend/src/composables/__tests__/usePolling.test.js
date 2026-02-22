import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock vue lifecycle hooks since we're not in a component
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onUnmounted: vi.fn(),
  }
})

import { onUnmounted } from 'vue'
import { usePolling } from '../usePolling'

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts inactive', () => {
    const cb = vi.fn()
    const { isActive } = usePolling(cb, 1000)
    expect(isActive.value).toBe(false)
  })

  it('start enables polling', () => {
    const cb = vi.fn()
    const { isActive, start } = usePolling(cb, 1000)
    start()
    expect(isActive.value).toBe(true)
  })

  it('calls callback on interval', () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { start } = usePolling(cb, 1000)
    start()

    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(cb).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('stop clears interval', () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { start, stop, isActive } = usePolling(cb, 1000)
    start()
    stop()

    expect(isActive.value).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('restart resets the interval', () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { start, restart } = usePolling(cb, 1000)
    start()

    vi.advanceTimersByTime(500)
    restart()
    vi.advanceTimersByTime(500)
    expect(cb).not.toHaveBeenCalled() // Not yet — reset the timer

    vi.advanceTimersByTime(500)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('start is idempotent (no double intervals)', () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { start } = usePolling(cb, 1000)
    start()
    start() // Should not create a second interval

    vi.advanceTimersByTime(1000)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('registers onUnmounted cleanup', () => {
    const cb = vi.fn()
    usePolling(cb, 1000)
    expect(onUnmounted).toHaveBeenCalled()
  })

  it('handles callback errors gracefully', () => {
    const cb = vi.fn().mockRejectedValue(new Error('poll error'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { start } = usePolling(cb, 1000)
    start()

    vi.advanceTimersByTime(1000)
    // Should not throw, error is caught internally
    expect(cb).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
