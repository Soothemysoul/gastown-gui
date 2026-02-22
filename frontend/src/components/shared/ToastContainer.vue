<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
        >
          <span class="material-icons toast-icon">{{ toast.icon }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="dismiss(toast.id)">
            <span class="material-icons">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../../composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(var(--header-height, 56px) + var(--space-md));
  right: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  z-index: var(--z-toast, 400);
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: var(--text-sm);
  pointer-events: auto;
}
.toast-success { border-color: var(--accent-success); }
.toast-error { border-color: var(--accent-danger); }
.toast-warning { border-color: var(--accent-warning); }
.toast-icon { font-size: 18px; }
.toast-success .toast-icon { color: var(--accent-success); }
.toast-error .toast-icon { color: var(--accent-danger); }
.toast-warning .toast-icon { color: var(--accent-warning); }
.toast-info .toast-icon { color: var(--accent-primary); }
.toast-message { flex: 1; }
.toast-close {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: var(--radius-sm);
}
.toast-close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.toast-close .material-icons { font-size: 16px; }

/* Transitions */
.toast-enter-active { animation: toast-in 0.3s ease; }
.toast-leave-active { animation: toast-out 0.3s ease; }
@keyframes toast-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes toast-out {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
</style>
