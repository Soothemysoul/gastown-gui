/**
 * convoyStore — Convoy list + filter state
 *
 * Ported from state.js setConvoys/updateConvoy + app.js loadConvoys.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../composables/useApi'

export const useConvoyStore = defineStore('convoy', () => {
  const convoys = ref([])
  const loading = ref(false)
  const error = ref(null)
  const showAll = ref(false) // false = active only, true = all

  const activeConvoys = computed(() =>
    convoys.value.filter(c => c.status !== 'completed' && c.status !== 'cancelled'),
  )

  const displayConvoys = computed(() =>
    showAll.value ? convoys.value : activeConvoys.value,
  )

  function setConvoys(data) {
    convoys.value = data || []
  }

  function updateConvoy(convoy) {
    if (!convoy?.id) return
    const idx = convoys.value.findIndex(c => c.id === convoy.id)
    if (idx >= 0) {
      convoys.value[idx] = { ...convoys.value[idx], ...convoy }
    } else {
      convoys.value.unshift(convoy)
    }
  }

  function setFilter(all) {
    showAll.value = all
  }

  async function fetchConvoys() {
    loading.value = true
    error.value = null
    try {
      const params = showAll.value ? { all: 'true' } : {}
      const data = await api.getConvoys(params)
      convoys.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('[convoyStore] fetchConvoys failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function createConvoy(name, issues = [], notify = null) {
    const result = await api.createConvoy(name, issues, notify)
    await fetchConvoys()
    return result
  }

  return {
    convoys,
    loading,
    error,
    showAll,
    activeConvoys,
    displayConvoys,
    setConvoys,
    updateConvoy,
    setFilter,
    fetchConvoys,
    createConvoy,
  }
})
