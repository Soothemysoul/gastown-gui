<template>
  <div class="mayor-command-bar">
    <span class="material-icons command-icon">assistant</span>
    <input
      ref="inputRef"
      v-model="command"
      type="text"
      placeholder="Tell Mayor what to build..."
      autocomplete="off"
      @keydown.enter="send"
    >
    <button
      class="command-send-btn"
      title="Send to Mayor (Enter)"
      :disabled="!command.trim()"
      @click="send"
    >
      <span class="material-icons">send</span>
    </button>
    <button
      class="command-view-btn"
      title="View Mayor's Output"
      @click="$emit('toggle-output')"
    >
      <span class="material-icons">visibility</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '../../composables/useApi'
import { useEventStore } from '../../stores/eventStore'
import { useToast } from '../../composables/useToast'

const emit = defineEmits(['toggle-output'])

const command = ref('')
const inputRef = ref(null)
const eventStore = useEventStore()
const toast = useToast()

async function send() {
  const msg = command.value.trim()
  if (!msg) return

  command.value = ''

  try {
    const result = await api.nudge('mayor/', msg)

    eventStore.addEvent({
      id: Date.now().toString(36),
      type: 'mayor_message',
      timestamp: new Date().toISOString(),
      target: 'mayor/',
      message: msg,
      status: result.status || 'sent',
    })

    if (result.autoStarted) {
      toast.info('Mayor was auto-started')
    }
  } catch (err) {
    toast.error(`Failed to send: ${err.message}`)
  }
}
</script>

<style scoped>
.mayor-command-bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-xs) var(--space-sm);
  min-width: 280px;
  transition: all var(--transition-fast);
}
.mayor-command-bar:focus-within {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
.command-icon {
  color: #a855f7;
  font-size: 20px;
}
input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  outline: none;
}
input::placeholder {
  color: var(--text-muted);
}
.command-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.command-send-btn:hover { background: #4a90e2; }
.command-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.command-send-btn .material-icons { font-size: 18px; }
.command-view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.command-view-btn:hover {
  background: var(--bg-tertiary);
  color: #a855f7;
  border-color: #a855f7;
}
.command-view-btn .material-icons { font-size: 18px; }
</style>
