import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentStore } from '../agentStore'

vi.mock('../../composables/useApi', () => ({
  api: {
    getAgents: vi.fn(),
    startAgent: vi.fn(),
    stopAgent: vi.fn(),
    restartAgent: vi.fn(),
    nudge: vi.fn(),
  },
}))

import { api } from '../../composables/useApi'

describe('agentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useAgentStore()
    expect(store.agents).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('setAgents updates the list', () => {
    const store = useAgentStore()
    store.setAgents([{ id: 'mayor', type: 'mayor' }])
    expect(store.agents).toHaveLength(1)
  })

  it('setAgents handles null', () => {
    const store = useAgentStore()
    store.setAgents(null)
    expect(store.agents).toEqual([])
  })

  it('polecats computed filters correctly', () => {
    const store = useAgentStore()
    store.setAgents([
      { id: 'p1', type: 'polecat' },
      { id: 'mayor', type: 'mayor' },
      { id: 'p2', type: 'worker', running: true },
    ])
    expect(store.polecats).toHaveLength(2)
    expect(store.polecats.map(p => p.id)).toEqual(['p1', 'p2'])
  })

  it('services computed filters correctly', () => {
    const store = useAgentStore()
    store.setAgents([
      { id: 'p1', type: 'polecat' },
      { id: 'mayor', type: 'mayor' },
      { id: 'witness', type: 'witness' },
    ])
    expect(store.services).toHaveLength(2)
    expect(store.services.map(s => s.id)).toEqual(['mayor', 'witness'])
  })

  it('fetchAgents merges agents and polecats', async () => {
    const store = useAgentStore()
    api.getAgents.mockResolvedValue({
      agents: [{ id: 'mayor', type: 'mayor' }],
      polecats: [{ name: 'furiosa', running: true }],
    })

    await store.fetchAgents()

    expect(store.agents).toHaveLength(2)
    expect(store.agents[0]).toEqual({ id: 'mayor', type: 'mayor' })
    expect(store.agents[1]).toEqual({
      name: 'furiosa',
      running: true,
      id: 'furiosa',
      type: 'polecat',
      status: 'working',
    })
  })

  it('fetchAgents maps idle polecats correctly', async () => {
    const store = useAgentStore()
    api.getAgents.mockResolvedValue({
      agents: [],
      polecats: [{ name: 'max', running: false }],
    })

    await store.fetchAgents()

    expect(store.agents[0].status).toBe('idle')
  })

  it('fetchAgents sets error on failure', async () => {
    const store = useAgentStore()
    api.getAgents.mockRejectedValue(new Error('network'))

    await store.fetchAgents()

    expect(store.error).toBe('network')
  })

  it('startAgent calls API', async () => {
    const store = useAgentStore()
    api.startAgent.mockResolvedValue({})
    await store.startAgent('rig1', 'p1')
    expect(api.startAgent).toHaveBeenCalledWith('rig1', 'p1')
  })

  it('stopAgent calls API', async () => {
    const store = useAgentStore()
    api.stopAgent.mockResolvedValue({})
    await store.stopAgent('rig1', 'p1')
    expect(api.stopAgent).toHaveBeenCalledWith('rig1', 'p1')
  })

  it('restartAgent calls API', async () => {
    const store = useAgentStore()
    api.restartAgent.mockResolvedValue({})
    await store.restartAgent('rig1', 'p1')
    expect(api.restartAgent).toHaveBeenCalledWith('rig1', 'p1')
  })

  it('nudge calls API with all args', async () => {
    const store = useAgentStore()
    api.nudge.mockResolvedValue({ ok: true })
    const result = await store.nudge('target1', 'hello', false)
    expect(api.nudge).toHaveBeenCalledWith('target1', 'hello', false)
    expect(result).toEqual({ ok: true })
  })
})
