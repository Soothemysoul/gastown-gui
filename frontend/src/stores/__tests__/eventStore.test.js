import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventStore } from '../eventStore'

vi.mock('../../composables/useApi', () => ({
  api: {
    getMayorMessages: vi.fn(),
  },
}))

import { api } from '../../composables/useApi'

describe('eventStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useEventStore()
    expect(store.events).toEqual([])
  })

  it('addEvent prepends event with timestamp', () => {
    const store = useEventStore()
    store.addEvent({ type: 'test', message: 'hello' })
    expect(store.events).toHaveLength(1)
    expect(store.events[0].type).toBe('test')
    expect(store.events[0].timestamp).toBeDefined()
  })

  it('addEvent preserves existing timestamp', () => {
    const store = useEventStore()
    const ts = '2026-01-01T00:00:00Z'
    store.addEvent({ type: 'test', timestamp: ts })
    expect(store.events[0].timestamp).toBe(ts)
  })

  it('addEvent prepends (newest first)', () => {
    const store = useEventStore()
    store.addEvent({ type: 'first' })
    store.addEvent({ type: 'second' })
    expect(store.events[0].type).toBe('second')
    expect(store.events[1].type).toBe('first')
  })

  it('addEvent caps at 500 events', () => {
    const store = useEventStore()
    for (let i = 0; i < 510; i++) {
      store.addEvent({ type: 'test', id: i })
    }
    expect(store.events).toHaveLength(500)
    // Most recent should be first
    expect(store.events[0].id).toBe(509)
  })

  it('clearEvents empties the list', () => {
    const store = useEventStore()
    store.addEvent({ type: 'test' })
    store.addEvent({ type: 'test' })
    store.clearEvents()
    expect(store.events).toEqual([])
  })

  it('loadMayorHistory adds events from API', async () => {
    const store = useEventStore()
    api.getMayorMessages.mockResolvedValue([
      { id: '1', timestamp: 't1', target: 'x', message: 'msg1', status: 'ok', response: 'r1' },
      { id: '2', timestamp: 't2', target: 'y', message: 'msg2', status: 'ok', response: 'r2' },
    ])

    await store.loadMayorHistory(20)

    expect(api.getMayorMessages).toHaveBeenCalledWith(20)
    expect(store.events).toHaveLength(2)
    // Messages are reversed then added one by one via unshift, so last added is on top
    expect(store.events[0].id).toBe('1')
    expect(store.events[0].type).toBe('mayor_message')
  })

  it('loadMayorHistory handles API error gracefully', async () => {
    const store = useEventStore()
    api.getMayorMessages.mockRejectedValue(new Error('no history'))

    await store.loadMayorHistory()

    expect(store.events).toEqual([])
  })
})
