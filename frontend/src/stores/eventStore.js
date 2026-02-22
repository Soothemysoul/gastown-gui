/**
 * eventStore — Activity feed (max 500 events)
 *
 * Ported from state.js addEvent/clearEvents (MAX_EVENTS = 500).
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../composables/useApi'

const MAX_EVENTS = 500

export const useEventStore = defineStore('event', () => {
  const events = ref([])

  function addEvent(event) {
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString()
    }
    events.value.unshift(event)
    if (events.value.length > MAX_EVENTS) {
      events.value = events.value.slice(0, MAX_EVENTS)
    }
  }

  function clearEvents() {
    events.value = []
  }

  async function loadMayorHistory(limit = 20) {
    try {
      const messages = await api.getMayorMessages(limit)
      if (messages && messages.length > 0) {
        for (const msg of messages.reverse()) {
          addEvent({
            id: msg.id,
            type: 'mayor_message',
            timestamp: msg.timestamp,
            target: msg.target,
            message: msg.message,
            status: msg.status,
            response: msg.response,
          })
        }
      }
    } catch (err) {
      console.log('[eventStore] No mayor message history:', err.message)
    }
  }

  return {
    events,
    addEvent,
    clearEvents,
    loadMayorHistory,
  }
})
