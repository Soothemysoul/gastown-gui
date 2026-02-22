<template>
  <div
    class="agent-card"
    :style="{ '--agent-color': agentConfig.color }"
    @click="$emit('detail', agentId)"
  >
    <div class="agent-header">
      <div class="agent-avatar" :style="{ backgroundColor: agentConfig.color + '20', borderColor: agentConfig.color }">
        <span class="material-icons" :style="{ color: agentConfig.color }">{{ agentConfig.icon }}</span>
      </div>
      <div class="agent-info">
        <h3 class="agent-name">{{ agent.name || formatAgentName(agent.id) }}</h3>
        <div class="agent-role" :style="{ color: agentConfig.color }">{{ agentConfig.label }}</div>
      </div>
      <div class="agent-status-icon" :class="`status-${agentStatus}`">
        <span class="material-icons" :style="{ color: statusColor }">{{ statusIcon }}</span>
      </div>
    </div>

    <div v-if="agent.current_task" class="agent-task">
      <span class="material-icons">task</span>
      <span class="task-text">{{ truncate(agent.current_task, 40) }}</span>
    </div>

    <div v-if="agent.progress !== undefined" class="agent-progress">
      <div class="progress-bar small">
        <div class="progress-fill" :style="{ width: Math.round(agent.progress * 100) + '%' }"></div>
      </div>
    </div>

    <div class="agent-footer">
      <div class="agent-stats">
        <span v-if="agent.tasks_completed !== undefined" class="agent-stat" title="Tasks Completed">
          <span class="material-icons">check</span>{{ agent.tasks_completed }}
        </span>
        <span v-if="agent.uptime" class="agent-stat" title="Uptime">
          <span class="material-icons">timer</span>{{ formatDuration(agent.uptime) }}
        </span>
        <span v-if="agent.convoy_id" class="agent-stat" title="Convoy">
          <span class="material-icons">local_shipping</span>{{ agent.convoy_id.slice(0, 6) }}
        </span>
      </div>
      <div class="agent-actions" @click.stop>
        <button class="btn btn-icon btn-sm" title="Nudge Agent" @click="$emit('nudge', agentId)">
          <span class="material-icons">notifications_active</span>
        </button>
        <template v-if="role === 'polecat'">
          <template v-if="agentStatus === 'running' || agentStatus === 'working'">
            <button class="btn btn-icon btn-sm btn-danger" title="Stop Polecat" @click="$emit('stop', rig, name)">
              <span class="material-icons">stop</span>
            </button>
            <button class="btn btn-icon btn-sm" title="Restart Polecat" @click="$emit('restart', rig, name)">
              <span class="material-icons">refresh</span>
            </button>
          </template>
          <button v-else class="btn btn-icon btn-sm btn-success" title="Start Polecat" @click="$emit('start', rig, name)">
            <span class="material-icons">play_arrow</span>
          </button>
        </template>
        <button
          v-if="role === 'polecat' || role === 'mayor' || role === 'witness'"
          class="btn btn-icon btn-sm"
          title="View Output"
          @click="$emit('peek', agentId)"
        >
          <span class="material-icons">visibility</span>
        </button>
      </div>
    </div>

    <div v-if="agentStatus === 'working'" class="agent-pulse"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getAgentConfig, formatAgentName, STATUS_ICONS, STATUS_COLORS } from '../../constants/agent-types'
import { truncate } from '../../utils/html'

const props = defineProps({
  agent: { type: Object, required: true },
})

defineEmits(['detail', 'nudge', 'start', 'stop', 'restart', 'peek'])

const agentId = computed(() => props.agent.id || props.agent.address)
const role = computed(() => (props.agent.role?.toLowerCase()) || 'polecat')
const agentConfig = computed(() => getAgentConfig(props.agent.address || props.agent.id, role.value))
const agentStatus = computed(() => props.agent.running ? 'running' : (props.agent.status || 'idle'))
const statusIcon = computed(() => STATUS_ICONS[agentStatus.value] || STATUS_ICONS.idle)
const statusColor = computed(() => STATUS_COLORS[agentStatus.value] || STATUS_COLORS.idle)

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

function formatDuration(seconds) {
  if (!seconds) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}
</script>

<style scoped>
.agent-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  position: relative;
  overflow: hidden;
}
.agent-card:hover {
  border-color: var(--agent-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.agent-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.agent-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  flex-shrink: 0;
}
.agent-avatar .material-icons { font-size: 20px; }
.agent-info { flex: 1; min-width: 0; }
.agent-name {
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agent-role {
  font-size: var(--text-xs);
  font-weight: 500;
}
.agent-status-icon .material-icons { font-size: 20px; }

.agent-task {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
.agent-task .material-icons { font-size: 14px; color: var(--text-muted); }
.task-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.agent-progress {
  padding: 0 var(--space-xs);
}
.progress-bar.small {
  height: 3px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--agent-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.agent-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-default);
}
.agent-stats {
  display: flex;
  gap: var(--space-sm);
}
.agent-stat {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.agent-stat .material-icons { font-size: 12px; }

.agent-actions {
  display: flex;
  gap: var(--space-xs);
}
.agent-actions .btn-icon { padding: 2px; }
.agent-actions .material-icons { font-size: 16px; }
.btn-danger { color: #ef4444; }
.btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
.btn-success { color: #22c55e; }
.btn-success:hover { background: rgba(34, 197, 94, 0.1); }

.agent-pulse {
  position: absolute;
  inset: 0;
  border: 2px solid var(--agent-color);
  border-radius: var(--radius-lg);
  opacity: 0;
  animation: pulse 2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes pulse {
  0%, 100% { opacity: 0; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.01); }
}
</style>
