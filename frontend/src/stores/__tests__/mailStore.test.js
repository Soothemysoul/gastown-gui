import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMailStore } from '../mailStore'

vi.mock('../../composables/useApi', () => ({
  api: {
    getMail: vi.fn(),
    getAllMail: vi.fn(),
    markMailRead: vi.fn(),
    markMailUnread: vi.fn(),
    sendMail: vi.fn(),
  },
}))

import { api } from '../../composables/useApi'

describe('mailStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useMailStore()
    expect(store.mail).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.filter).toBe('mine')
  })

  it('computes unreadCount', () => {
    const store = useMailStore()
    store.setMail([
      { id: '1', read: false },
      { id: '2', read: true },
      { id: '3', read: false },
    ])
    expect(store.unreadCount).toBe(2)
  })

  it('markRead updates local state', () => {
    const store = useMailStore()
    store.setMail([{ id: '1', read: false }])
    store.markRead('1')
    expect(store.mail[0].read).toBe(true)
  })

  it('setFilter updates filter', () => {
    const store = useMailStore()
    store.setFilter('all')
    expect(store.filter).toBe('all')
  })

  it('fetchMail calls getMail for mine filter', async () => {
    const store = useMailStore()
    api.getMail.mockResolvedValue([{ id: 'm1' }])

    await store.fetchMail()

    expect(api.getMail).toHaveBeenCalled()
    expect(store.mail).toEqual([{ id: 'm1' }])
  })

  it('fetchMail calls getAllMail for all filter', async () => {
    const store = useMailStore()
    store.setFilter('all')
    api.getAllMail.mockResolvedValue({ items: [{ id: 'm2' }] })

    await store.fetchMail()

    expect(api.getAllMail).toHaveBeenCalled()
    expect(store.mail).toEqual([{ id: 'm2' }])
  })

  it('fetchMail handles getAllMail returning array directly', async () => {
    const store = useMailStore()
    store.setFilter('all')
    api.getAllMail.mockResolvedValue([{ id: 'm3' }])

    await store.fetchMail()

    expect(store.mail).toEqual([{ id: 'm3' }])
  })

  it('fetchMail sets error on failure', async () => {
    const store = useMailStore()
    api.getMail.mockRejectedValue(new Error('mail fail'))

    await store.fetchMail()

    expect(store.error).toBe('mail fail')
  })

  it('markMailRead updates local and calls API', async () => {
    const store = useMailStore()
    store.setMail([{ id: '1', read: false }])
    api.markMailRead.mockResolvedValue({})

    await store.markMailRead('1')

    expect(store.mail[0].read).toBe(true)
    expect(api.markMailRead).toHaveBeenCalledWith('1')
  })

  it('markMailUnread updates local and calls API', async () => {
    const store = useMailStore()
    store.setMail([{ id: '1', read: true }])
    api.markMailUnread.mockResolvedValue({})

    await store.markMailUnread('1')

    expect(store.mail[0].read).toBe(false)
    expect(api.markMailUnread).toHaveBeenCalledWith('1')
  })

  it('sendMail calls API', async () => {
    const store = useMailStore()
    api.sendMail.mockResolvedValue({ ok: true })

    const result = await store.sendMail('witness', 'help', 'stuck', 'high')

    expect(api.sendMail).toHaveBeenCalledWith('witness', 'help', 'stuck', 'high')
    expect(result).toEqual({ ok: true })
  })
})
