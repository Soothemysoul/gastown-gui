/**
 * workStore — Beads (work items) + filter state
 *
 * Ported from app.js loadWork + work filter logic.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../composables/useApi'

export const useWorkStore = defineStore('work', () => {
  const beads = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filter = ref('closed') // 'all' | 'open' | 'closed'

  function setFilter(value) {
    filter.value = value
  }

  async function fetchBeads() {
    loading.value = true
    error.value = null
    try {
      const data = await api.getBeads(filter.value)
      beads.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('[workStore] fetchBeads failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function markDone(beadId, summary) {
    await api.markWorkDone(beadId, summary)
    await fetchBeads()
  }

  async function park(beadId, reason) {
    await api.parkWork(beadId, reason)
    await fetchBeads()
  }

  async function release(beadId) {
    await api.releaseWork(beadId)
    await fetchBeads()
  }

  async function reassign(beadId, target) {
    await api.reassignWork(beadId, target)
    await fetchBeads()
  }

  async function createBead(title, options = {}) {
    const result = await api.createBead(title, options)
    await fetchBeads()
    return result
  }

  async function searchBeads(query) {
    return api.searchBeads(query)
  }

  return {
    beads,
    loading,
    error,
    filter,
    setFilter,
    fetchBeads,
    markDone,
    park,
    release,
    reassign,
    createBead,
    searchBeads,
  }
})
