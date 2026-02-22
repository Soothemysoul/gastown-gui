<template>
  <div class="view dashboard-view">
    <LoadingState v-if="statusStore.loading && !statusStore.status" message="Loading dashboard..." />
    <ErrorState v-else-if="statusStore.error && !statusStore.status" :message="statusStore.error" @retry="refresh" />
    <template v-else>
      <!-- Health Banner -->
      <div class="health-banner" :class="`health-${healthStatus.status}`" :style="{ '--health-color': healthStatus.color }">
        <div class="health-banner-icon">
          <span class="material-icons">{{ healthStatus.icon }}</span>
        </div>
        <div class="health-banner-text">
          <span class="health-label">{{ healthStatus.label }}</span>
          <span class="health-hint">System health check</span>
        </div>
        <router-link to="/health" class="btn btn-sm btn-ghost">
          View Details
          <span class="material-icons">arrow_forward</span>
        </router-link>
      </div>

      <!-- Metrics Grid -->
      <div class="dashboard-metrics">
        <router-link to="/convoys" class="metric-card" style="--metric-color: #3b82f6">
          <div class="metric-icon"><span class="material-icons">local_shipping</span></div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.activeConvoys }}</div>
            <div class="metric-label">Active Convoys</div>
            <div v-if="metrics.totalConvoys > 0" class="metric-secondary">{{ metrics.activeConvoys }} of {{ metrics.totalConvoys }}</div>
          </div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: pct(metrics.activeConvoys, metrics.totalConvoys) + '%' }"></div>
          </div>
        </router-link>

        <router-link to="/work" class="metric-card" style="--metric-color: #22c55e">
          <div class="metric-icon"><span class="material-icons">task_alt</span></div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.openWork }}</div>
            <div class="metric-label">Open Work</div>
            <div v-if="metrics.totalWork > 0" class="metric-secondary">{{ metrics.openWork }} of {{ metrics.totalWork }}</div>
          </div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: pct(metrics.openWork, metrics.totalWork) + '%' }"></div>
          </div>
        </router-link>

        <router-link to="/agents" class="metric-card" style="--metric-color: #8b5cf6">
          <div class="metric-icon"><span class="material-icons">smart_toy</span></div>
          <div class="metric-content">
            <div class="metric-value">{{ agentStats.working + agentStats.available }}</div>
            <div class="metric-label">Active Agents</div>
            <div class="metric-secondary">{{ agentStats.statusText }}</div>
          </div>
          <div class="metric-progress agent-progress">
            <div class="metric-progress-bar working" :style="{ width: pct(agentStats.working, agentStats.total) + '%' }"></div>
            <div class="metric-progress-bar available" :style="{ width: pct(agentStats.available, agentStats.total) + '%', left: pct(agentStats.working, agentStats.total) + '%' }"></div>
          </div>
        </router-link>

        <router-link to="/mail" class="metric-card" style="--metric-color: #f59e0b">
          <div class="metric-icon"><span class="material-icons">mail</span></div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.unreadMail }}</div>
            <div class="metric-label">Unread Mail</div>
            <div v-if="metrics.totalMail > 0" class="metric-secondary">{{ metrics.unreadMail }} of {{ metrics.totalMail }}</div>
          </div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: pct(metrics.unreadMail, metrics.totalMail) + '%' }"></div>
          </div>
        </router-link>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Quick Actions -->
        <div class="dashboard-card quick-actions">
          <div class="card-header">
            <span class="material-icons">bolt</span>
            <h3>Quick Actions</h3>
          </div>
          <div class="card-body">
            <div class="quick-actions-grid">
              <button
                v-for="action in quickActions"
                :key="action.id"
                class="quick-action-btn"
                :style="{ '--action-color': action.color }"
                @click="handleQuickAction(action)"
              >
                <span class="material-icons">{{ action.icon }}</span>
                <span class="action-label">{{ action.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Agent Status -->
        <div class="dashboard-card agent-overview">
          <div class="card-header">
            <span class="material-icons">monitoring</span>
            <h3>Agent Status</h3>
          </div>
          <div class="card-body">
            <div class="agent-status-list">
              <div
                v-for="type in agentTypes"
                :key="type"
                class="agent-status-row"
                :style="{ '--agent-color': AGENT_TYPES[type].color }"
              >
                <div class="agent-status-icon">
                  <span class="material-icons">{{ AGENT_TYPES[type].icon }}</span>
                </div>
                <div class="agent-status-info">
                  <span class="agent-type-label">{{ AGENT_TYPES[type].label }}</span>
                  <span class="agent-count">{{ getTypeStats(type).statusText }}</span>
                </div>
                <div class="agent-status-bar">
                  <div class="status-bar-fill working" :style="{ width: pct(getTypeStats(type).working, getTypeStats(type).total) + '%' }"></div>
                  <div class="status-bar-fill available" :style="{ width: pct(getTypeStats(type).available, getTypeStats(type).total) + '%', left: pct(getTypeStats(type).working, getTypeStats(type).total) + '%' }"></div>
                </div>
                <span class="agent-status-indicator" :class="getTypeStats(type).working > 0 ? 'working' : getTypeStats(type).available > 0 ? 'active' : ''">
                  <span class="material-icons">{{ getTypeStats(type).working > 0 ? 'pending' : getTypeStats(type).available > 0 ? 'check_circle' : 'radio_button_unchecked' }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Work -->
        <div class="dashboard-card recent-work">
          <div class="card-header">
            <span class="material-icons">history</span>
            <h3>Recent Activity</h3>
          </div>
          <div class="card-body">
            <div v-if="!recentWork.length" class="empty-state small">
              <span class="material-icons">inbox</span>
              <p>No recent work</p>
            </div>
            <template v-else>
              <div class="recent-work-list">
                <div
                  v-for="item in recentWork"
                  :key="item.id"
                  class="recent-work-item"
                  @click="uiStore.openModal('bead-detail', { beadId: item.id, bead: item })"
                >
                  <span class="work-status-dot" :style="{ background: getWorkStatusColor(item.status) }"></span>
                  <div class="work-info">
                    <span class="work-title">{{ item.title || item.id }}</span>
                    <span class="work-meta">{{ formatTimeAgoCompact(item.updated_at || item.created_at) }}</span>
                  </div>
                  <span class="work-status-badge" :style="{ color: getWorkStatusColor(item.status) }">{{ item.status || 'open' }}</span>
                </div>
              </div>
              <router-link to="/work" class="view-all-link">
                View all work <span class="material-icons">arrow_forward</span>
              </router-link>
            </template>
          </div>
        </div>

        <!-- Rig Overview -->
        <div class="dashboard-card rig-overview">
          <div class="card-header">
            <span class="material-icons">folder_special</span>
            <h3>Rigs</h3>
          </div>
          <div class="card-body">
            <div v-if="!rigs.length" class="empty-state small">
              <span class="material-icons">folder_off</span>
              <p>No rigs configured</p>
              <button class="btn btn-sm btn-primary" @click="uiStore.openModal('new-rig')">
                <span class="material-icons">add</span>
                Add Rig
              </button>
            </div>
            <template v-else>
              <div class="rig-overview-list">
                <div
                  v-for="rig in rigs.slice(0, 4)"
                  :key="rig.name"
                  class="rig-overview-item"
                  @click="$router.push('/rigs')"
                >
                  <div class="rig-icon"><span class="material-icons">folder_special</span></div>
                  <div class="rig-info">
                    <span class="rig-name">{{ rig.name }}</span>
                    <span class="rig-agents">{{ getRigStats(rig).statusText }}</span>
                  </div>
                  <span class="rig-status-indicator" :class="getRigStats(rig).working > 0 ? 'working' : getRigStats(rig).available > 0 ? 'active' : ''"></span>
                </div>
              </div>
              <router-link v-if="rigs.length > 4" to="/rigs" class="view-all-link">
                View all {{ rigs.length }} rigs <span class="material-icons">arrow_forward</span>
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatusStore } from '../../stores/statusStore'
import { useConvoyStore } from '../../stores/convoyStore'
import { useWorkStore } from '../../stores/workStore'
import { useMailStore } from '../../stores/mailStore'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { AGENT_TYPES } from '../../constants/agent-types'
import { formatTimeAgoCompact } from '../../utils/formatting'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'

const router = useRouter()
const statusStore = useStatusStore()
const convoyStore = useConvoyStore()
const workStore = useWorkStore()
const mailStore = useMailStore()
const uiStore = useUiStore()

const agentTypes = ['mayor', 'deacon', 'witness', 'refinery', 'polecat']

const quickActions = [
  { id: 'new-bead', icon: 'add_circle', label: 'New Bead', color: '#22c55e', modal: 'new-bead' },
  { id: 'sling-work', icon: 'send', label: 'Sling Work', color: '#3b82f6', modal: 'sling' },
  { id: 'new-convoy', icon: 'local_shipping', label: 'New Convoy', color: '#a855f7', modal: 'new-convoy' },
  { id: 'compose-mail', icon: 'edit', label: 'Send Mail', color: '#f59e0b', modal: 'mail-compose' },
  { id: 'add-rig', icon: 'folder_special', label: 'Add Rig', color: '#06b6d4', modal: 'new-rig' },
  { id: 'run-doctor', icon: 'health_and_safety', label: 'Health Check', color: '#ec4899', route: '/health' },
]

const rigs = computed(() => statusStore.rigs)

function getAgentStatsFromList(agents) {
  const working = agents.filter(a => a.running && (a.has_work || a.hook)).length
  const available = agents.filter(a => a.running && !a.has_work && !a.hook).length
  const stopped = agents.filter(a => !a.running).length
  const total = agents.length
  let statusText
  if (total === 0) statusText = 'none'
  else if (working > 0 && available > 0) statusText = `${working} working, ${available} idle`
  else if (working > 0) statusText = `${working} working`
  else if (available > 0) statusText = `${available} available`
  else statusText = `${stopped} stopped`
  return { working, available, stopped, total, statusText }
}

const allRigAgents = computed(() => rigs.value.flatMap(rig => rig.agents || []))

const agentStats = computed(() => getAgentStatsFromList(allRigAgents.value))

const agentsByType = computed(() => {
  const grouped = {}
  agentTypes.forEach(type => { grouped[type] = [] })
  rigs.value.forEach(rig => {
    ;(rig.agents || []).forEach(agent => {
      const type = (agent.role || 'polecat').toLowerCase()
      if (grouped[type]) grouped[type].push(agent)
    })
  })
  return grouped
})

function getTypeStats(type) {
  return getAgentStatsFromList(agentsByType.value[type] || [])
}

function getRigStats(rig) {
  return getAgentStatsFromList(rig.agents || [])
}

const metrics = computed(() => {
  const convoys = convoyStore.convoys
  const work = workStore.beads
  const mail = mailStore.mail
  return {
    activeConvoys: convoys.filter(c => c.status !== 'completed' && c.status !== 'closed').length,
    totalConvoys: convoys.length,
    openWork: work.filter(w => w.status !== 'closed' && w.status !== 'done').length,
    totalWork: work.length,
    unreadMail: mail.filter(m => !m.read).length,
    totalMail: mail.length,
  }
})

const healthStatus = computed(() => {
  const status = statusStore.status
  if (!status) return { status: 'unknown', label: 'Unknown', icon: 'help', color: '#6b7280' }
  const checks = deriveHealthChecks(status)
  let hasError = false
  let hasWarning = false
  checks.forEach(c => {
    if (c.status === 'fail' || c.status === 'error') hasError = true
    if (c.status === 'warn') hasWarning = true
  })
  if (hasError) return { status: 'error', label: 'Issues Detected', icon: 'error', color: '#ef4444' }
  if (hasWarning) return { status: 'warning', label: 'Warnings', icon: 'warning', color: '#f59e0b' }
  return { status: 'healthy', label: 'All Systems Go', icon: 'check_circle', color: '#22c55e' }
})

function deriveHealthChecks(status) {
  const checks = []
  const rigList = status.rigs || []
  const agents = status.agents || []
  if (rigList.length === 0) checks.push({ name: 'Rigs', status: 'warn', message: 'No rigs configured' })
  else checks.push({ name: 'Rigs', status: 'pass' })
  const mayor = agents.find(a => a.name === 'mayor' || a.role === 'coordinator')
  if (mayor && !mayor.running) checks.push({ name: 'Mayor', status: 'warn' })
  const deacon = agents.find(a => a.name === 'deacon' || a.role === 'health-check')
  if (deacon && !deacon.running) checks.push({ name: 'Deacon', status: 'warn' })
  let runningPolecats = 0
  let totalPolecats = 0
  rigList.forEach(rig => {
    ;(rig.agents || []).forEach(agent => {
      totalPolecats++
      if (agent.running) runningPolecats++
    })
  })
  if (totalPolecats > 0 && runningPolecats === 0) checks.push({ name: 'Polecats', status: 'warn' })
  return checks
}

const recentWork = computed(() => {
  const work = workStore.beads
  if (!work.length) return []
  return [...work]
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    .slice(0, 5)
})

function getWorkStatusColor(status) {
  if (status === 'closed' || status === 'done') return '#22c55e'
  if (status === 'in_progress' || status === 'in-progress') return '#3b82f6'
  return '#6b7280'
}

function pct(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function handleQuickAction(action) {
  if (action.route) {
    router.push(action.route)
  } else if (action.modal) {
    uiStore.openModal(action.modal)
  }
}

async function refresh() {
  await Promise.all([
    statusStore.fetchStatus(true),
    convoyStore.fetchConvoys(),
    workStore.fetchBeads(),
    mailStore.fetchMail(),
  ])
}

const polling = usePolling(refresh, 15000)

onMounted(async () => {
  await Promise.all([
    statusStore.fetchStatus(),
    convoyStore.fetchConvoys(),
    workStore.fetchBeads(),
    mailStore.fetchMail(),
  ])
  polling.start()
})
</script>

<style scoped>
.dashboard-view {
  padding: var(--space-lg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Health Banner */
.health-banner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--health-color) 10%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, var(--health-color) 30%, transparent);
}
.health-banner-icon .material-icons {
  font-size: 28px;
  color: var(--health-color);
}
.health-banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.health-label {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--health-color);
}
.health-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Metrics Grid */
.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}
.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  color: inherit;
}
.metric-card:hover {
  border-color: var(--metric-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.metric-icon .material-icons {
  font-size: 24px;
  color: var(--metric-color);
}
.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}
.metric-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: 500;
}
.metric-secondary {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.metric-progress {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}
.metric-progress-bar {
  position: absolute;
  height: 100%;
  background: var(--metric-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}
.agent-progress .metric-progress-bar.working {
  background: #22c55e;
}
.agent-progress .metric-progress-bar.available {
  background: #3b82f6;
}

/* Main Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}
.dashboard-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-default);
}
.card-header .material-icons {
  font-size: 18px;
  color: var(--text-secondary);
}
.card-header h3 {
  font-size: var(--text-sm);
  font-weight: 600;
}
.card-body {
  padding: var(--space-md);
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}
.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-sm);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--action-color) 8%, transparent);
  transition: all var(--transition-fast);
}
.quick-action-btn:hover {
  background: color-mix(in srgb, var(--action-color) 18%, transparent);
  transform: translateY(-1px);
}
.quick-action-btn .material-icons {
  font-size: 24px;
  color: var(--action-color);
}
.action-label {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
}

/* Agent Status */
.agent-status-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.agent-status-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}
.agent-status-icon .material-icons {
  font-size: 18px;
  color: var(--agent-color);
}
.agent-status-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.agent-type-label {
  font-size: var(--text-sm);
  font-weight: 500;
}
.agent-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.agent-status-bar {
  width: 60px;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  position: relative;
}
.status-bar-fill {
  position: absolute;
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
.status-bar-fill.working { background: #22c55e; }
.status-bar-fill.available { background: #3b82f6; }
.agent-status-indicator .material-icons {
  font-size: 16px;
  color: var(--text-muted);
}
.agent-status-indicator.working .material-icons { color: #f59e0b; }
.agent-status-indicator.active .material-icons { color: #22c55e; }

/* Recent Work */
.recent-work-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.recent-work-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.recent-work-item:hover {
  background: var(--bg-hover);
}
.work-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.work-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.work-title {
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.work-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.work-status-badge {
  font-size: var(--text-xs);
  font-weight: 500;
  flex-shrink: 0;
}
.view-all-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--accent-primary);
  text-decoration: none;
}
.view-all-link .material-icons {
  font-size: 14px;
}

/* Rig Overview */
.rig-overview-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.rig-overview-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.rig-overview-item:hover {
  background: var(--bg-hover);
}
.rig-icon .material-icons {
  font-size: 18px;
  color: var(--text-secondary);
}
.rig-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.rig-name {
  font-size: var(--text-sm);
  font-weight: 500;
}
.rig-agents {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.rig-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}
.rig-status-indicator.working { background: #f59e0b; }
.rig-status-indicator.active { background: #22c55e; }

/* Empty state small variant */
.empty-state.small {
  padding: var(--space-lg);
  gap: var(--space-xs);
}
.empty-state.small .material-icons {
  font-size: 32px;
  opacity: 0.4;
  color: var(--text-muted);
}
.empty-state.small p {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
