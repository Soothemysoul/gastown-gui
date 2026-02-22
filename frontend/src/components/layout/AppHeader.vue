<template>
  <header class="header">
    <div class="header-left">
      <div class="logo">
        <span class="material-icons logo-icon">factory</span>
        <span class="logo-text">GAS TOWN</span>
      </div>
      <div class="town-name">{{ statusStore.townName || 'Loading...' }}</div>
      <MayorCommandBar @toggle-output="showOutput = !showOutput" />
    </div>
    <div class="header-center">
      <NavTabs />
    </div>
    <div class="header-right">
      <button class="icon-btn" title="Toggle theme" @click="ui.toggleTheme()">
        <span class="material-icons">{{ ui.theme === 'dark' ? 'dark_mode' : 'light_mode' }}</span>
      </button>
      <button class="icon-btn" title="Refresh" @click="refresh">
        <span class="material-icons" :class="{ spinning: refreshing }">refresh</span>
      </button>
      <div class="connection-status" :class="ws.connectionStatus.value">
        <span class="status-dot"></span>
        <span class="status-text">{{ connectionLabel }}</span>
      </div>
    </div>

    <MayorOutputPanel :visible="showOutput" @close="showOutput = false" />
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStatusStore } from '../../stores/statusStore'
import { useUiStore } from '../../stores/uiStore'
import { useWebSocket } from '../../composables/useWebSocket'
import { useToast } from '../../composables/useToast'
import NavTabs from './NavTabs.vue'
import MayorCommandBar from './MayorCommandBar.vue'
import MayorOutputPanel from './MayorOutputPanel.vue'

const statusStore = useStatusStore()
const ui = useUiStore()
const ws = useWebSocket()
const toast = useToast()

const showOutput = ref(false)
const refreshing = ref(false)

const connectionLabel = computed(() => {
  switch (ws.connectionStatus.value) {
    case 'connected': return 'Connected'
    case 'connecting': return 'Connecting...'
    case 'error': return 'Error'
    default: return 'Disconnected'
  }
})

async function refresh() {
  refreshing.value = true
  try {
    await statusStore.fetchStatus(true)
    toast.info('Refreshed', 1000)
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-default);
  z-index: var(--z-sticky);
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--text-primary);
}
.logo-icon { font-size: var(--text-2xl); }
.logo-text {
  font-family: var(--font-mono);
  letter-spacing: 2px;
}
.town-name {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}
.header-center {
  display: flex;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}
.connection-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-idle);
}
.connection-status.connected .status-dot {
  background: var(--status-running);
  animation: pulse 2s infinite;
}
.connection-status.disconnected .status-dot { background: var(--status-dead); }
.connection-status.error .status-dot { background: var(--status-stuck); }

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
