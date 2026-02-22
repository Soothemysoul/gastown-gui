/**
 * useModal composable — open/close modals via uiStore
 *
 * Convenience wrapper so components can open/close modals
 * without importing the store directly.
 */

import { computed } from 'vue'
import { useUiStore } from '../stores/uiStore'

export function useModal() {
  const ui = useUiStore()

  const activeModal = computed(() => ui.activeModal)
  const modalData = computed(() => ui.modalData)

  function open(name, data = null) {
    ui.openModal(name, data)
  }

  function close() {
    ui.closeModal()
  }

  function isOpen(name) {
    return ui.activeModal === name
  }

  return {
    activeModal,
    modalData,
    open,
    close,
    isOpen,
  }
}
