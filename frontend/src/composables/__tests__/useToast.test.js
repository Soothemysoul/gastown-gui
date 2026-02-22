import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const { clearAll } = useToast()
    clearAll()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('show adds a toast', () => {
    const { toasts, show } = useToast()
    show('Hello', 'info')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Hello')
    expect(toasts.value[0].type).toBe('info')
    expect(toasts.value[0].icon).toBe('info')
  })

  it('success shortcut uses correct type and icon', () => {
    const { toasts, success } = useToast()
    success('Done')
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].icon).toBe('check_circle')
  })

  it('error shortcut uses correct type and icon', () => {
    const { toasts, error } = useToast()
    error('Failed')
    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].icon).toBe('error')
  })

  it('warning shortcut uses correct type and icon', () => {
    const { toasts, warning } = useToast()
    warning('Watch out')
    expect(toasts.value[0].type).toBe('warning')
    expect(toasts.value[0].icon).toBe('warning')
  })

  it('auto-dismisses after default duration', () => {
    const { toasts, info } = useToast()
    info('Temp')
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(3000)
    expect(toasts.value).toHaveLength(0)
  })

  it('error has longer duration (5s)', () => {
    const { toasts, error } = useToast()
    error('Err')
    vi.advanceTimersByTime(3000)
    expect(toasts.value).toHaveLength(1) // Still there
    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0) // Gone at 5s
  })

  it('custom duration overrides default', () => {
    const { toasts, show } = useToast()
    show('Custom', 'info', 1000)
    vi.advanceTimersByTime(1000)
    expect(toasts.value).toHaveLength(0)
  })

  it('dismiss removes a specific toast', () => {
    const { toasts, show, dismiss } = useToast()
    const id = show('A', 'info', 0)
    show('B', 'info', 0)
    expect(toasts.value).toHaveLength(2)
    dismiss(id)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('B')
  })

  it('clearAll removes everything', () => {
    const { toasts, show, clearAll } = useToast()
    show('A', 'info', 0)
    show('B', 'info', 0)
    show('C', 'info', 0)
    clearAll()
    expect(toasts.value).toHaveLength(0)
  })

  it('each toast gets unique id', () => {
    const { toasts, show } = useToast()
    show('A', 'info', 0)
    show('B', 'info', 0)
    expect(toasts.value[0].id).not.toBe(toasts.value[1].id)
  })
})
