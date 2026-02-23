<template>
  <BaseModal
    v-model="visible"
    :title="agentName || 'Agent Details'"
    icon="smart_toy"
    size="lg"
    @close="onClose"
  >
    <template #header>
      <h2 class="agent-title-row">
        <span
          class="agent-avatar-sm"
          :style="{ backgroundColor: agentConfig.color + '20', borderColor: agentConfig.color }"
        >
          <span class="material-icons" :style="{ color: agentConfig.color }">{{ agentConfig.icon }}</span>
        </span>
        {{ agentName }}
      </h2>
    </template>

    <div class="agent-detail">
      <!-- Meta grid -->
      <div class="agent-meta">
        <div class="meta-row">
          <span class="meta-label">ID:</span>
          <code class="agent-id-code">{{ agentId }}</code>
        </div>
        <div class="meta-row">
          <span class="meta-label">Role:</span>
          <span class="meta-value">
            <span class="material-icons" :style="{ color: agentConfig.color }">{{ agentConfig.icon }}</span>
            {{ agentConfig.label }}
          </span>
        </div>
        <div v-if="rig" class="meta-row">
          <span class="meta-label">Rig:</span>
          <span class="meta-value">{{ rig }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Status:</span>
          <span class="status-badge" :class="'status-' + agentStatus">
            <span class="material-icons">{{ statusIcon }}</span>
            {{ agentStatus }}
          </span>
        </div>
        <div v-if="agent?.hook_bead" class="meta-row">
          <span class="meta-label">Hook:</span>
          <code class="hook-bead-code">{{ agent.hook_bead }}</code>
        </div>
        <div v-if="agent?.current_task" class="meta-row">
          <span class="meta-label">Task:</span>
          <span class="meta-value task-value">{{ agent.current_task }}</span>
        </div>
        <div v-if="agent?.convoy_id" class="meta-row">
          <span class="meta-label">Convoy:</span>
          <code class="meta-value">{{ agent.convoy_id }}</code>
        </div>
      </div>

      <!-- Stats row -->
      <div v-if="hasStats" class="agent-stats-row">
        <div v-if="agent?.tasks_completed !== undefined" class="stat-card">
          <span class="material-icons">check_circle</span>
          <div class="stat-info">
            <span class="stat-value">{{ agent.tasks_completed }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
        <div v-if="agent?.uptime" class="stat-card">
          <span class="material-icons">timer</span>
          <div class="stat-info">
            <span class="stat-value">{{ formatDuration(agent.uptime) }}</span>
            <span class="stat-label">Uptime</span>
          </div>
        </div>
        <div v-if="agent?.progress !== undefined" class="stat-card">
          <span class="material-icons">donut_large</span>
          <div class="stat-info">
            <span class="stat-value">{{ Math.round(agent.progress * 100) }}%</span>
            <span class="stat-label">Progress</span>
          </div>
        </div>
      </div>

      <!-- Recent output -->
      <div class="agent-section">
        <h4>
          <span class="material-icons">terminal</span>
          Recent Output
          <button class="btn-icon btn-xs" @click="loadOutput" title="Refresh output" :disabled="outputLoading">
            <span class="material-icons" :class="{ spinning: outputLoading }">refresh</span>
          </button>
        </h4>
        <div v-if="outputLoading && !output" class="loading-inline">
          <span class="material-icons spinning">sync</span>
          Loading output...
        </div>
        <div v-else-if="output" class="output-box">
          <pre>{{ output }}</pre>
        </div>
        <div v-else class="no-output">
          <span class="material-icons">info</span>
          No recent output available
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="visible = false">Close</button>
      <button class="btn btn-outline" @click="handleNudge">
        <span class="material-icons">notifications_active</span>
        Nudge
      </button>
      <button class="btn btn-outline" @click="handlePeek">
        <span class="material-icons">visibility</span>
        Full Output
      </button>
      <template v-if="isPolecat">
        <button
          v-if="agentStatus === 'running' || agentStatus === 'working'"
          class="btn btn-danger"
          @click="handleStop"
        >
          <span class="material-icons">stop</span>
          Stop
        </button>
        <button v-else class="btn btn-primary" @click="handleStart">
          <span class="material-icons">play_arrow</span>
          Start
        </button>
      </template>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { useUiStore } from '../../stores/uiStore'
import { useAgentStore } from '../../stores/agentStore'
import { useToast } from '../../composables/useToast'
import { getAgentConfig, getAgentType, formatAgentName, STATUS_ICONS, STATUS_COLORS } from '../../constants/agent-types'

const api = useApi()
const uiStore = useUiStore()
const agentStore = useAgentStore()
const toast = useToast()

const output = ref(null)
const outputLoading = ref(false)

const visible = computed({
  get: () => uiStore.activeModal === 'agent-detail',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const agentId = computed(() => uiStore.modalData?.agentId || '')

const agent = computed(() => {
  const id = agentId.value
  if (!id) return null
  return agentStore.agents.find(a => (a.id || a.address) === id) || null
})

const agentName = computed(() => formatAgentName(agentId.value))

const role = computed(() => {
  const r = agent.value?.role?.toLowerCase()
  if (r) return r
  return getAgentType(agentId.value)
})

const agentConfig = computed(() => getAgentConfig(agentId.value, role.value))

const agentStatus = computed(() => {
  if (!agent.value) return 'idle'
  if (agent.value.running) return 'running'
  return agent.value.status || 'idle'
})

const statusIcon = computed(() => STATUS_ICONS[agentStatus.value] || STATUS_ICONS.idle)

const isPolecat = computed(() => role.value === 'polecat')

const rig = computed(() => {
  const id = agentId.value || ''
  const parts = id.split('/')
  return parts.length >= 2 ? parts[0] : ''
})

const name = computed(() => {
  const id = agentId.value || ''
  const parts = id.split('/')
  return parts.length >= 2 ? parts.slice(1).join('/') : id
})

const hasStats = computed(() =>
  agent.value && (
    agent.value.tasks_completed !== undefined ||
    agent.value.uptime ||
    agent.value.progress !== undefined
  ),
)

function formatDuration(seconds) {
  if (!seconds) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

async function loadOutput() {
  if (!rig.value || !name.value) return
  outputLoading.value = true
  try {
    const data = await api.getPeekOutput(rig.value, name.value)
    output.value = data?.output || null
  } catch {
    output.value = null
  } finally {
    outputLoading.value = false
  }
}

function handleNudge() {
  uiStore.openModal('nudge', { agentId: agentId.value })
}

function handlePeek() {
  uiStore.openModal('agent-peek', { agentId: agentId.value })
}

async function handleStart() {
  try {
    await agentStore.startAgent(rig.value, name.value)
    toast.success(`Started ${name.value}`)
    await agentStore.fetchAgents()
  } catch (err) {
    toast.error(`Failed to start: ${err.message}`)
  }
}

async function handleStop() {
  try {
    await agentStore.stopAgent(rig.value, name.value)
    toast.success(`Stopped ${name.value}`)
    await agentStore.fetchAgents()
  } catch (err) {
    toast.error(`Failed to stop: ${err.message}`)
  }
}

function onClose() {
  output.value = null
}

watch(visible, (v) => {
  if (v) loadOutput()
  else onClose()
})
</script>

<style scoped>
.agent-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-lg);
  font-weight: 600;
}

.agent-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  flex-shrink: 0;
}
.agent-avatar-sm .material-icons { font-size: 18px; }

.agent-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Meta */
.agent-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
}
.meta-label {
  color: var(--text-muted);
  min-width: 80px;
  font-weight: 500;
}
.meta-value {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
}
.meta-value .material-icons {
  font-size: 16px;
}
.agent-id-code, .hook-bead-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--accent-primary);
}
.task-value {
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-xxs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: capitalize;
}
.status-badge .material-icons { font-size: 14px; }
.status-running { color: var(--status-running, #22c55e); background: rgba(34, 197, 94, 0.1); }
.status-working { color: var(--status-running, #22c55e); background: rgba(34, 197, 94, 0.1); }
.status-idle { color: var(--text-muted); background: var(--bg-tertiary); }
.status-stopped { color: var(--text-muted); background: var(--bg-tertiary); }
.status-error { color: var(--accent-danger, #ef4444); background: rgba(239, 68, 68, 0.1); }
.status-waiting { color: var(--accent-warning, #f59e0b); background: rgba(245, 158, 11, 0.1); }

/* Stats */
.agent-stats-row {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  flex: 1;
  min-width: 120px;
}
.stat-card > .material-icons {
  font-size: 20px;
  color: var(--text-muted);
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: var(--text-sm);
  font-weight: 600;
}
.stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Section */
.agent-section h4 {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--text-secondary);
}
.agent-section h4 .material-icons {
  font-size: 18px;
}

/* Output */
.output-box {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  max-height: 200px;
  overflow-y: auto;
}
.output-box pre {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  color: var(--text-primary);
}
.no-output {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.loading-inline {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

/* Buttons */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  border: none;
  background: none;
}
.btn-icon:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.btn-icon .material-icons { font-size: 16px; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
}
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
}
.btn-primary:hover { opacity: 0.9; }
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }
.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-outline:hover { background: var(--bg-hover); }
.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-danger:hover { background: rgba(239, 68, 68, 0.2); }

.btn .material-icons { font-size: 16px; }

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
