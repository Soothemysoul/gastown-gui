/**
 * agentStore — Agents + polecats
 *
 * Ported from state.js setAgents + app.js loadAgents.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../composables/useApi'

export const useAgentStore = defineStore('agent', () => {
  const agents = ref([])
  const loading = ref(false)
  const error = ref(null)

  const polecats = computed(() =>
    agents.value.filter(a => a.type === 'polecat' || a.running !== undefined),
  )

  const services = computed(() =>
    agents.value.filter(a => a.type !== 'polecat' && a.running === undefined),
  )

  function setAgents(data) {
    agents.value = data || []
  }

  async function fetchAgents() {
    loading.value = true
    error.value = null
    try {
      const response = await api.getAgents()
      // Combine agents and polecats into a flat list (mirrors app.js loadAgents)
      const all = [
        ...(response.agents || []),
        ...(response.polecats || []).map(p => ({
          ...p,
          id: p.name,
          type: 'polecat',
          status: p.running ? 'working' : 'idle',
        })),
      ]
      agents.value = all
    } catch (err) {
      error.value = err.message
      console.error('[agentStore] fetchAgents failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function startAgent(rig, name) {
    await api.startAgent(rig, name)
  }

  async function stopAgent(rig, name) {
    await api.stopAgent(rig, name)
  }

  async function restartAgent(rig, name) {
    await api.restartAgent(rig, name)
  }

  async function nudge(target, message, autoStart = true) {
    return api.nudge(target, message, autoStart)
  }

  return {
    agents,
    loading,
    error,
    polecats,
    services,
    setAgents,
    fetchAgents,
    startAgent,
    stopAgent,
    restartAgent,
    nudge,
  }
})
