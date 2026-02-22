import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatusStore } from '../statusStore'

vi.mock('../../composables/useApi', () => ({
  api: {
    getStatus: vi.fn(),
    getHealth: vi.fn(),
  },
}))

import { api } from '../../composables/useApi'

describe('statusStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useStatusStore()
    expect(store.status).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('computes townName from status', () => {
    const store = useStatusStore()
    expect(store.townName).toBe('')
    store.setStatus({ name: 'TestTown' })
    expect(store.townName).toBe('TestTown')
  })

  it('computes hook from status', () => {
    const store = useStatusStore()
    expect(store.hook).toBeNull()
    store.setStatus({ hook: { bead: 'abc-123' } })
    expect(store.hook).toEqual({ bead: 'abc-123' })
  })

  it('computes rigs from status', () => {
    const store = useStatusStore()
    expect(store.rigs).toEqual([])
    store.setStatus({ rigs: [{ name: 'rig1' }] })
    expect(store.rigs).toEqual([{ name: 'rig1' }])
  })

  it('computes agents from status', () => {
    const store = useStatusStore()
    expect(store.agents).toEqual([])
    store.setStatus({ agents: [{ id: 'a1' }] })
    expect(store.agents).toEqual([{ id: 'a1' }])
  })

  it('setStatus updates state', () => {
    const store = useStatusStore()
    const data = { name: 'GT', rigs: [], agents: [] }
    store.setStatus(data)
    expect(store.status).toEqual(data)
  })

  it('fetchStatus calls API and updates state', async () => {
    const store = useStatusStore()
    const data = { name: 'Town', rigs: [{ name: 'r1' }] }
    api.getStatus.mockResolvedValue(data)

    await store.fetchStatus()

    expect(api.getStatus).toHaveBeenCalledWith(false)
    expect(store.status).toEqual(data)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchStatus with force=true passes through', async () => {
    const store = useStatusStore()
    api.getStatus.mockResolvedValue({})

    await store.fetchStatus(true)

    expect(api.getStatus).toHaveBeenCalledWith(true)
  })

  it('fetchStatus sets error on failure', async () => {
    const store = useStatusStore()
    api.getStatus.mockRejectedValue(new Error('Network error'))

    await store.fetchStatus()

    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('fetchHealth returns health data', async () => {
    const store = useStatusStore()
    const health = { status: 'ok', checks: [] }
    api.getHealth.mockResolvedValue(health)

    const result = await store.fetchHealth()

    expect(result).toEqual(health)
  })

  it('fetchHealth throws on error', async () => {
    const store = useStatusStore()
    api.getHealth.mockRejectedValue(new Error('Doctor failed'))

    await expect(store.fetchHealth()).rejects.toThrow('Doctor failed')
  })
})
