/**
 * useKeyboardShortcuts composable — global keyboard shortcut handler
 *
 * Ported from app.js lines 742-851.
 * Registers document-level keydown handler, auto-removes on unmount.
 */

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/uiStore'

export function useKeyboardShortcuts() {
  const router = useRouter()
  const ui = useUiStore()

  function isInputFocused(e) {
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (e.target.isContentEditable) return true
    return false
  }

  function handler(e) {
    if (isInputFocused(e)) return

    // Simple key shortcuts (no modifier)
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.key) {
        case '?':
          e.preventDefault()
          ui.openModal('help')
          return
        case '1':
        case 'd':
          router.push('/')
          return
        case '2':
        case 'c':
          router.push('/convoys')
          return
        case '3':
        case 'a':
          router.push('/agents')
          return
        case '4':
        case 'm':
          router.push('/mail')
          return
        case '5':
        case 'w':
          router.push('/work')
          return
        case '6':
          router.push('/rigs')
          return
        case '7':
          router.push('/prs')
          return
        case '8':
          router.push('/formulas')
          return
        case '9':
          router.push('/issues')
          return
        case '0':
        case 'h':
          router.push('/health')
          return
        case 'Escape':
          ui.closeModal()
          return
      }
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault()
          ui.openModal('new-convoy')
          break
        case 'r':
          e.preventDefault()
          // Emit a custom event for refresh
          window.dispatchEvent(new CustomEvent('gastown:refresh'))
          break
        case 's':
          e.preventDefault()
          ui.openModal('sling')
          break
        case 'k':
          e.preventDefault()
          ui.openModal('help')
          break
      }
    }

    // Alt shortcuts
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault()
          ui.openModal('new-bead')
          break
        case 'c':
          e.preventDefault()
          ui.openModal('new-convoy')
          break
        case 'm':
          e.preventDefault()
          ui.openModal('mail-compose')
          break
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handler)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handler)
  })
}
