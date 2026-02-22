<template>
  <Teleport to="#modal-target">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="onOverlayClick">
        <div
          class="modal"
          :class="[sizeClass]"
          role="dialog"
          aria-modal="true"
          ref="modalEl"
          @keydown.esc="onEsc"
        >
          <div class="modal-header">
            <slot name="header">
              <h2>{{ title }}</h2>
            </slot>
            <button class="btn btn-icon modal-close" @click="close" aria-label="Close">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: '' },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  closeOnOverlay: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const modalEl = ref(null)
const sizeClass = `modal-${props.size}`

function close() {
  emit('close')
}

function onOverlayClick() {
  if (props.closeOnOverlay) close()
}

function onEsc() {
  if (props.closeOnEsc) close()
}

// Focus trap
let previousFocus = null

function trapFocus(e) {
  if (!modalEl.value) return
  const focusable = modalEl.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(() => props.show, async (visible) => {
  if (visible) {
    previousFocus = document.activeElement
    await nextTick()
    // Focus first focusable element inside modal
    if (modalEl.value) {
      const firstInput = modalEl.value.querySelector('input, textarea, select')
      if (firstInput) {
        firstInput.focus()
      } else {
        modalEl.value.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
  } else {
    document.removeEventListener('keydown', trapFocus)
    if (previousFocus) {
      previousFocus.focus()
      previousFocus = null
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 300);
  padding: var(--space-lg);
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  width: 100%;
  outline: none;
}

.modal-sm { max-width: 420px; }
.modal-md { max-width: 560px; }
.modal-lg { max-width: 780px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-default);
}

.modal-header h2 {
  font-size: var(--text-lg);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  flex-shrink: 0;
}
.modal-close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.modal-body {
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-default);
}

/* Transitions */
.modal-enter-active { animation: modal-in 0.2s ease; }
.modal-leave-active { animation: modal-out 0.15s ease; }

@keyframes modal-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modal-in .modal {
  from { transform: scale(0.95) translateY(10px); }
  to { transform: scale(1) translateY(0); }
}
@keyframes modal-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
