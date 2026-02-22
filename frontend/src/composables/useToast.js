/**
 * useToast composable — reactive toast notification system
 *
 * Ported from js/components/toast.js.
 * Provides a reactive toast queue consumed by ToastContainer.vue.
 */

import { ref } from 'vue'

const TOAST_DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
}

const TOAST_ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

let nextId = 0
const toasts = ref([])

function addToast(message, type = 'info', duration = null) {
  const id = ++nextId
  const finalDuration = duration !== null ? duration : TOAST_DURATIONS[type] || 3000
  const icon = TOAST_ICONS[type] || TOAST_ICONS.info

  const toast = { id, message, type, icon }
  toasts.value.push(toast)

  if (finalDuration > 0) {
    setTimeout(() => dismissToast(id), finalDuration)
  }

  return id
}

function dismissToast(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx >= 0) {
    toasts.value.splice(idx, 1)
  }
}

function clearAll() {
  toasts.value = []
}

export function useToast() {
  return {
    toasts,
    show: addToast,
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    dismiss: dismissToast,
    clearAll,
  }
}
