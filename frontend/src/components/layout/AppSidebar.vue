<template>
  <aside class="sidebar" :class="{ collapsed: !ui.sidebarOpen }">
    <div class="sidebar-header">
      <h2>Agents</h2>
      <button class="icon-btn-sm" @click="ui.toggleSidebar()">
        <span class="material-icons">chevron_left</span>
      </button>
    </div>

    <div class="sidebar-body">
      <!-- Agent Tree -->
      <div class="sidebar-section">
        <h3 class="sidebar-title">
          <span class="material-icons">account_tree</span>
          Agents
        </h3>
        <ul class="tree-view">
          <li
            v-for="group in agentGroups"
            :key="group.role"
            class="tree-node expandable"
            :class="{ expanded: expanded[group.role] }"
          >
            <div class="tree-node-content" @click="toggleGroup(group.role)">
              <span class="material-icons tree-icon" :style="{ color: group.config.color }">{{ group.config.icon }}</span>
              <span class="tree-label" :style="{ color: group.config.color }">{{ group.label }}</span>
              <span class="tree-badge">{{ group.agents.length }}</span>
            </div>
            <ul v-if="expanded[group.role]" class="tree-children">
              <li v-for="agent in group.agents" :key="agent.id || agent.address" class="tree-node">
                <div class="tree-node-content agent-node">
                  <span
                    class="material-icons tree-icon"
                    :class="`status-${agent.running ? 'running' : (agent.status || 'idle')}`"
                    :style="{ color: group.config.color }"
                  >{{ statusIcon(agent) }}</span>
                  <span class="tree-label" :style="{ color: group.config.color }">{{ agent.name || 'Unknown' }}</span>
                  <span v-if="agent.current_task" class="tree-task">{{ truncate(agent.current_task, 20) }}</span>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <!-- Service Controls -->
      <div class="sidebar-section">
        <h3 class="sidebar-title">
          <span class="material-icons">settings_applications</span>
          Services
        </h3>
        <div class="service-controls">
          <div v-for="svc in services" :key="svc.name" class="service-item">
            <div class="service-info">
              <span class="material-icons service-icon" :style="{ color: svc.color }">{{ svc.icon }}</span>
              <span class="service-name">{{ svc.label }}</span>
              <span class="service-status" :class="`status-${svc.isRunning ? 'running' : 'stopped'}`">
                {{ svc.isRunning ? 'Running' : 'Stopped' }}
              </span>
            </div>
            <div class="service-actions">
              <template v-if="svc.isRunning">
                <button class="btn-icon-xs btn-danger-ghost" title="Stop" @click="serviceAction('stop', svc)">
                  <span class="material-icons">stop</span>
                </button>
                <button class="btn-icon-xs" title="Restart" @click="serviceAction('restart', svc)">
                  <span class="material-icons">refresh</span>
                </button>
              </template>
              <template v-else>
                <button class="btn-icon-xs btn-success-ghost" title="Start" @click="serviceAction('start', svc)">
                  <span class="material-icons">play_arrow</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Hook Status -->
      <div v-if="statusStore.hook" class="sidebar-section hook-section">
        <h3 class="sidebar-title">
          <span class="material-icons">anchor</span>
          Hook
        </h3>
        <div class="hook-card">
          <div class="hook-bead">{{ statusStore.hook.bead_id || 'Unknown' }}</div>
          <div class="hook-meta">
            <span class="hook-status-text" :class="`status-${statusStore.hook.status || 'idle'}`">
              {{ statusStore.hook.status || 'idle' }}
            </span>
          </div>
          <div v-if="statusStore.hook.title" class="hook-title">{{ truncate(statusStore.hook.title, 40) }}</div>
        </div>
      </div>

      <!-- Stats -->
      <div class="sidebar-section">
        <h3 class="sidebar-title">
          <span class="material-icons">insights</span>
          Stats
        </h3>
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-item">
            <span class="material-icons stat-icon">{{ stat.icon }}</span>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useStatusStore } from '../../stores/statusStore'
import { useUiStore } from '../../stores/uiStore'
import { AGENT_TYPES, STATUS_ICONS } from '../../constants/agent-types'
import { api } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { truncate, capitalize } from '../../utils/html'

const statusStore = useStatusStore()
const ui = useUiStore()
const toast = useToast()

const ROLE_MAP = { coordinator: 'mayor', 'health-check': 'deacon' }
const ROLES = ['mayor', 'deacon', 'polecat', 'witness', 'refinery']

const expanded = reactive({
  mayor: true,
  deacon: true,
  polecat: true,
  witness: true,
  refinery: true,
  other: true,
})

function toggleGroup(role) {
  expanded[role] = !expanded[role]
}

function pluralize(word, count) {
  if (count === 1) return word
  if (word.toLowerCase() === 'witness') return 'Witnesses'
  if (word.toLowerCase() === 'refinery') return 'Refineries'
  return word + 's'
}

function statusIcon(agent) {
  const st = agent.running ? 'running' : (agent.status || 'idle')
  return STATUS_ICONS[st] || 'help'
}

const allAgents = computed(() => {
  const status = statusStore.status
  if (!status) return []
  const townAgents = status.agents || []
  const rigAgents = []
  for (const rig of status.rigs || []) {
    for (const agent of rig.agents || []) {
      rigAgents.push({
        ...agent,
        rig: rig.name,
        id: agent.address || `${rig.name}/${agent.name}`,
      })
    }
  }
  return [...townAgents, ...rigAgents]
})

const agentGroups = computed(() => {
  const groups = {}
  for (const role of ROLES) groups[role] = []
  groups.other = []

  for (const agent of allAgents.value) {
    const apiRole = agent.role?.toLowerCase() || 'other'
    const role = ROLE_MAP[apiRole] || apiRole
    if (groups[role]) {
      groups[role].push(agent)
    } else {
      groups.other.push(agent)
    }
  }

  return [...ROLES, 'other']
    .filter(role => groups[role].length > 0)
    .map(role => {
      const config = AGENT_TYPES[role] || AGENT_TYPES.system
      return {
        role,
        config,
        label: pluralize(config.label, groups[role].length),
        agents: groups[role],
      }
    })
})

const services = computed(() => {
  const defs = [
    { name: 'mayor', label: 'Mayor', icon: 'account_balance', color: AGENT_TYPES.mayor.color },
    { name: 'deacon', label: 'Deacon', icon: 'gavel', color: AGENT_TYPES.deacon.color },
    { name: 'witness', label: 'Witness', icon: 'visibility', color: AGENT_TYPES.witness.color },
    { name: 'refinery', label: 'Refinery', icon: 'precision_manufacturing', color: AGENT_TYPES.refinery.color },
  ]

  const groups = {}
  for (const agent of allAgents.value) {
    const apiRole = agent.role?.toLowerCase() || 'other'
    const role = ROLE_MAP[apiRole] || apiRole
    if (!groups[role]) groups[role] = []
    groups[role].push(agent)
  }

  return defs.map(svc => {
    const agents = groups[svc.name] || []
    return {
      ...svc,
      isRunning: agents.some(a => a.running),
      rig: agents[0]?.rig || null,
    }
  })
})

const stats = computed(() => {
  const s = statusStore.status
  return [
    { label: 'Convoys', value: s?.convoy_count || 0, icon: 'local_shipping' },
    { label: 'Active', value: s?.active_agents || 0, icon: 'person' },
    { label: 'Pending', value: s?.pending_tasks || 0, icon: 'pending' },
  ]
})

async function serviceAction(action, svc) {
  try {
    let result
    if (action === 'start') result = await api.startService(svc.name, svc.rig)
    else if (action === 'stop') result = await api.stopService(svc.name, svc.rig)
    else result = await api.restartService(svc.name, svc.rig)

    if (result.success) {
      toast.success(`${capitalize(svc.name)} ${action}ed successfully`)
      statusStore.fetchStatus(true)
    } else {
      toast.error(`Failed to ${action} ${svc.name}: ${result.error}`)
    }
  } catch (err) {
    toast.error(`Error: ${err.message}`)
  }
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base), min-width var(--transition-base);
  flex-shrink: 0;
}
.sidebar.collapsed {
  width: 0;
  min-width: 0;
  overflow: hidden;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-muted);
  flex-shrink: 0;
}
.sidebar-header h2 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.icon-btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--text-muted);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.icon-btn-sm:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
}
.sidebar-section {
  margin-bottom: var(--space-md);
}
.sidebar-title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--space-xs) var(--space-sm);
  margin-bottom: var(--space-xs);
}
.sidebar-title .material-icons { font-size: 16px; }

/* Tree */
.tree-view { list-style: none; padding: 0; margin: 0; }
.tree-node { list-style: none; }
.tree-node-content {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.tree-node-content:hover { background: var(--bg-hover); }
.tree-icon { font-size: 18px; }
.tree-label { font-size: var(--text-sm); font-weight: 500; }
.tree-badge {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}
.tree-children {
  list-style: none;
  padding-left: var(--space-lg);
  margin: 0;
}
.tree-task {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

/* Service controls */
.service-controls { display: flex; flex-direction: column; gap: var(--space-xs); }
.service-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}
.service-info {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
.service-icon { font-size: 18px; }
.service-name { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); }
.service-status {
  font-size: var(--text-xs);
  margin-left: var(--space-xs);
}
.service-status.status-running { color: var(--status-running); }
.service-status.status-stopped { color: var(--status-idle); }
.service-actions { display: flex; gap: 2px; }
.btn-icon-xs {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-icon-xs:hover { background: var(--bg-hover); color: var(--text-primary); }
.btn-icon-xs .material-icons { font-size: 16px; }
.btn-danger-ghost:hover { color: var(--accent-danger); }
.btn-success-ghost:hover { color: var(--accent-success); }

/* Hook */
.hook-card {
  padding: var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}
.hook-bead {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-primary);
}
.hook-meta { margin-top: var(--space-xs); }
.hook-status-text {
  font-size: var(--text-xs);
  font-weight: 500;
}
.hook-status-text.status-idle { color: var(--status-idle); }
.hook-status-text.status-working { color: var(--status-working); }
.hook-title {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}

/* Stats */
.stats-grid { display: flex; flex-direction: column; gap: var(--space-xs); }
.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
}
.stat-icon { font-size: 18px; color: var(--text-muted); }
.stat-content { display: flex; gap: var(--space-sm); align-items: baseline; }
.stat-value { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); }
.stat-label { font-size: var(--text-xs); color: var(--text-muted); }

/* Status icon colors */
.status-running { color: var(--status-running); }
.status-working { color: var(--status-working); }
.status-idle { color: var(--status-idle); }
.status-error { color: var(--status-stuck); }

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: var(--header-height);
    bottom: var(--status-bar-height);
    z-index: var(--z-dropdown);
    transform: translateX(-100%);
  }
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
}
</style>
