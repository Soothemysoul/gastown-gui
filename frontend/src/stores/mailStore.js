/**
 * mailStore — Inbox, unread count, filter state
 *
 * Ported from state.js setMail/markMailRead + app.js loadMail + mailFilter logic.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../composables/useApi'

export const useMailStore = defineStore('mail', () => {
  const mail = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filter = ref('mine') // 'mine' | 'all'

  const unreadCount = computed(() =>
    mail.value.filter(m => !m.read).length,
  )

  function setMail(data) {
    mail.value = data || []
  }

  function markRead(id) {
    const item = mail.value.find(m => m.id === id)
    if (item) {
      item.read = true
    }
  }

  function setFilter(value) {
    filter.value = value
  }

  async function fetchMail() {
    loading.value = true
    error.value = null
    try {
      let data
      if (filter.value === 'all') {
        const response = await api.getAllMail()
        data = response.items || response
      } else {
        data = await api.getMail()
      }
      mail.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('[mailStore] fetchMail failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function markMailRead(id) {
    markRead(id)
    try {
      await api.markMailRead(id)
    } catch (err) {
      console.warn('[mailStore] markMailRead API failed:', err)
    }
  }

  async function markMailUnread(id) {
    const item = mail.value.find(m => m.id === id)
    if (item) {
      item.read = false
    }
    try {
      await api.markMailUnread(id)
    } catch (err) {
      console.warn('[mailStore] markMailUnread API failed:', err)
    }
  }

  async function sendMail(to, subject, message, priority = 'normal') {
    return api.sendMail(to, subject, message, priority)
  }

  return {
    mail,
    loading,
    error,
    filter,
    unreadCount,
    setMail,
    markRead,
    setFilter,
    fetchMail,
    markMailRead,
    markMailUnread,
    sendMail,
  }
})
