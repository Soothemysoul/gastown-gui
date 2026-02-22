import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkStore } from '../workStore'

vi.mock('../../composables/useApi', () => ({
  api: {
    getBeads: vi.fn(),
    markWorkDone: vi.fn(),
    parkWork: vi.fn(),
    releaseWork: vi.fn(),
    reassignWork: vi.fn(),
    createBead: vi.fn(),
    searchBeads: vi.fn(),
  },
}))

import { api } from '../../composables/useApi'

describe('workStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useWorkStore()
    expect(store.beads).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.filter).toBe('closed')
  })

  it('setFilter updates filter value', () => {
    const store = useWorkStore()
    store.setFilter('open')
    expect(store.filter).toBe('open')
  })

  it('fetchBeads calls API with current filter', async () => {
    const store = useWorkStore()
    api.getBeads.mockResolvedValue([{ id: 'b1' }])

    await store.fetchBeads()

    expect(api.getBeads).toHaveBeenCalledWith('closed')
    expect(store.beads).toEqual([{ id: 'b1' }])
  })

  it('fetchBeads handles null response', async () => {
    const store = useWorkStore()
    api.getBeads.mockResolvedValue(null)

    await store.fetchBeads()

    expect(store.beads).toEqual([])
  })

  it('fetchBeads sets error on failure', async () => {
    const store = useWorkStore()
    api.getBeads.mockRejectedValue(new Error('api error'))

    await store.fetchBeads()

    expect(store.error).toBe('api error')
    expect(store.loading).toBe(false)
  })

  it('markDone calls API and refetches', async () => {
    const store = useWorkStore()
    api.markWorkDone.mockResolvedValue({})
    api.getBeads.mockResolvedValue([])

    await store.markDone('b1', 'done summary')

    expect(api.markWorkDone).toHaveBeenCalledWith('b1', 'done summary')
    expect(api.getBeads).toHaveBeenCalled()
  })

  it('park calls API and refetches', async () => {
    const store = useWorkStore()
    api.parkWork.mockResolvedValue({})
    api.getBeads.mockResolvedValue([])

    await store.park('b1', 'need info')

    expect(api.parkWork).toHaveBeenCalledWith('b1', 'need info')
    expect(api.getBeads).toHaveBeenCalled()
  })

  it('release calls API and refetches', async () => {
    const store = useWorkStore()
    api.releaseWork.mockResolvedValue({})
    api.getBeads.mockResolvedValue([])

    await store.release('b1')

    expect(api.releaseWork).toHaveBeenCalledWith('b1')
  })

  it('reassign calls API and refetches', async () => {
    const store = useWorkStore()
    api.reassignWork.mockResolvedValue({})
    api.getBeads.mockResolvedValue([])

    await store.reassign('b1', 'polecat/max')

    expect(api.reassignWork).toHaveBeenCalledWith('b1', 'polecat/max')
  })

  it('createBead calls API and refetches', async () => {
    const store = useWorkStore()
    api.createBead.mockResolvedValue({ id: 'new-1' })
    api.getBeads.mockResolvedValue([])

    const result = await store.createBead('New Bug', { priority: 1 })

    expect(api.createBead).toHaveBeenCalledWith('New Bug', { priority: 1 })
    expect(result).toEqual({ id: 'new-1' })
  })

  it('searchBeads calls API directly', async () => {
    const store = useWorkStore()
    api.searchBeads.mockResolvedValue([{ id: 's1' }])

    const result = await store.searchBeads('login')

    expect(api.searchBeads).toHaveBeenCalledWith('login')
    expect(result).toEqual([{ id: 's1' }])
  })
})
