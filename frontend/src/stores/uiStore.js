/**
 * uiStore — Theme, sidebar, modal state
 *
 * Ported from app.js setupThemeToggle + modal/sidebar logic.
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Theme
  const theme = ref(localStorage.getItem('theme') || 'dark')

  watch(theme, (val) => {
    document.documentElement.dataset.theme = val
    localStorage.setItem('theme', val)
  }, { immediate: true })

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  // Sidebar
  const sidebarOpen = ref(true)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  // Modal
  const activeModal = ref(null) // null | string (modal name)
  const modalData = ref(null) // arbitrary data passed to the active modal

  function openModal(name, data = null) {
    activeModal.value = name
    modalData.value = data
  }

  function closeModal() {
    activeModal.value = null
    modalData.value = null
  }

  // Status message (header bar)
  const statusMessage = ref('Loading...')

  return {
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar,
    activeModal,
    modalData,
    openModal,
    closeModal,
    statusMessage,
  }
})
