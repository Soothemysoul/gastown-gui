import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConvoyStore } from '../convoyStore'

vi.mock('../../composables/useApi', () => ({
  api: {
    getConvoys: vi.fn(),
    createConvoy: vi.fn(),
  },
}))

import { api } from '../../composables/useApi'

describe('convoyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useConvoyStore()
    expect(store.convoys).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.showAll).toBe(false)
  })

  it('setConvoys updates the list', () => {
    const store = useConvoyStore()
    store.setConvoys([{ id: '1', status: 'active' }])
    expect(store.convoys).toEqual([{ id: '1', status: 'active' }])
  })

  it('setConvoys handles null', () => {
    const store = useConvoyStore()
    store.setConvoys(null)
    expect(store.convoys).toEqual([])
  })

  it('activeConvoys filters out completed/cancelled', () => {
    const store = useConvoyStore()
    store.setConvoys([
      { id: '1', status: 'active' },
      { id: '2', status: 'completed' },
      { id: '3', status: 'cancelled' },
      { id: '4', status: 'running' },
    ])
    expect(store.activeConvoys).toEqual([
      { id: '1', status: 'active' },
      { id: '4', status: 'running' },
    ])
  })

  it('displayConvoys returns active only when showAll=false', () => {
    const store = useConvoyStore()
    store.setConvoys([
      { id: '1', status: 'active' },
      { id: '2', status: 'completed' },
    ])
    expect(store.displayConvoys).toHaveLength(1)
    expect(store.displayConvoys[0].id).toBe('1')
  })

  it('displayConvoys returns all when showAll=true', () => {
    const store = useConvoyStore()
    store.setFilter(true)
    store.setConvoys([
      { id: '1', status: 'active' },
      { id: '2', status: 'completed' },
    ])
    expect(store.displayConvoys).toHaveLength(2)
  })

  it('updateConvoy updates existing convoy', () => {
    const store = useConvoyStore()
    store.setConvoys([{ id: '1', status: 'active', name: 'old' }])
    store.updateConvoy({ id: '1', name: 'new' })
    expect(store.convoys[0].name).toBe('new')
    expect(store.convoys[0].status).toBe('active')
  })

  it('updateConvoy adds new convoy if not found', () => {
    const store = useConvoyStore()
    store.setConvoys([])
    store.updateConvoy({ id: '99', status: 'new' })
    expect(store.convoys).toHaveLength(1)
    expect(store.convoys[0].id).toBe('99')
  })

  it('updateConvoy ignores null/missing id', () => {
    const store = useConvoyStore()
    store.setConvoys([])
    store.updateConvoy(null)
    store.updateConvoy({})
    expect(store.convoys).toHaveLength(0)
  })

  it('fetchConvoys calls API with correct params', async () => {
    const store = useConvoyStore()
    api.getConvoys.mockResolvedValue([{ id: '1' }])

    await store.fetchConvoys()

    expect(api.getConvoys).toHaveBeenCalledWith({})
    expect(store.convoys).toEqual([{ id: '1' }])
  })

  it('fetchConvoys passes all=true when showAll', async () => {
    const store = useConvoyStore()
    store.setFilter(true)
    api.getConvoys.mockResolvedValue([])

    await store.fetchConvoys()

    expect(api.getConvoys).toHaveBeenCalledWith({ all: 'true' })
  })

  it('fetchConvoys sets error on failure', async () => {
    const store = useConvoyStore()
    api.getConvoys.mockRejectedValue(new Error('fail'))

    await store.fetchConvoys()

    expect(store.error).toBe('fail')
    expect(store.loading).toBe(false)
  })

  it('createConvoy calls API and refetches', async () => {
    const store = useConvoyStore()
    api.createConvoy.mockResolvedValue({ id: '2' })
    api.getConvoys.mockResolvedValue([{ id: '2' }])

    await store.createConvoy('test', ['issue1'])

    expect(api.createConvoy).toHaveBeenCalledWith('test', ['issue1'], null)
    expect(api.getConvoys).toHaveBeenCalled()
  })
})
