<template>
  <footer class="status-bar">
    <div class="status-left">
      <span class="hook-status" :class="{ active: !!statusStore.hook }">
        <span class="material-icons">anchor</span>
        <span class="hook-text">{{ hookText }}</span>
      </span>
    </div>
    <div class="status-center">
      <span>{{ ui.statusMessage }}</span>
    </div>
    <div class="status-right">
      <span v-if="mailStore.unreadCount > 0" class="status-mail">
        <span class="material-icons">mail</span>
        {{ mailStore.unreadCount }} unread
      </span>
      <span class="keyboard-hint">Press <kbd>?</kbd> for help</span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useStatusStore } from '../../stores/statusStore'
import { useMailStore } from '../../stores/mailStore'
import { useUiStore } from '../../stores/uiStore'

const statusStore = useStatusStore()
const mailStore = useMailStore()
const ui = useUiStore()

const hookText = computed(() => {
  const hook = statusStore.hook
  if (!hook) return 'No work hooked'
  return `${hook.bead_id || 'Unknown'}${hook.title ? ': ' + hook.title : ''}`
})
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--status-bar-height);
  padding: 0 var(--space-md);
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-default);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  flex-shrink: 0;
}
.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.hook-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
.hook-status .material-icons {
  font-size: 14px;
  color: var(--text-muted);
}
.hook-status.active {
  color: var(--accent-primary);
}
.hook-status.active .material-icons {
  color: var(--accent-primary);
}
.hook-text {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-mail {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--accent-primary);
}
.status-mail .material-icons { font-size: 14px; }
kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}
</style>
