/**
 * statusStore — Town status, connection state, hook info
 *
 * Ported from state.js setStatus + app.js loadInitialData/loadRigs.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../composables/useApi'

export const useStatusStore = defineStore('status', () => {
  const status = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Derived
  const townName = computed(() => status.value?.name ?? '')
  const hook = computed(() => status.value?.hook ?? null)
  const rigs = computed(() => status.value?.rigs ?? [])
  const agents = computed(() => status.value?.agents ?? [])

  function setStatus(data) {
    status.value = data
  }

  async function fetchStatus(force = false) {
    loading.value = true
    error.value = null
    try {
      const data = await api.getStatus(force)
      status.value = data
    } catch (err) {
      error.value = err.message
      console.error('[statusStore] fetchStatus failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchHealth() {
    try {
      return await api.getHealth()
    } catch (err) {
      console.error('[statusStore] fetchHealth failed:', err)
      throw err
    }
  }

  return {
    status,
    loading,
    error,
    townName,
    hook,
    rigs,
    agents,
    setStatus,
    fetchStatus,
    fetchHealth,
  }
})
