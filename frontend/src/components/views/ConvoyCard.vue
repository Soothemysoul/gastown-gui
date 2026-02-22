<template>
  <div
    class="convoy-card"
    :class="{ expanded: isExpanded }"
    :data-convoy-id="convoy.id"
    @click="toggleExpand"
  >
    <div class="convoy-header">
      <button class="btn btn-icon convoy-expand-btn" title="Expand" @click.stop="toggleExpand">
        <span class="material-icons">{{ isExpanded ? 'expand_less' : 'expand_more' }}</span>
      </button>
      <div class="convoy-status" :class="`status-${status}`">
        <span class="material-icons" :class="{ spin: status === 'running' }">{{ statusIcon }}</span>
      </div>
      <div class="convoy-info">
        <h3 class="convoy-name">{{ convoy.name || convoy.id }}</h3>
        <div class="convoy-meta">
          <span class="convoy-id">#{{ (convoy.id || 'unknown').slice(0, 8) }}</span>
          <span v-if="convoy.priority" class="convoy-priority" :class="priorityClass">{{ convoy.priority }}</span>
        </div>
      </div>
      <div class="convoy-actions">
        <button class="btn btn-icon" title="Sling Work" @click.stop="$emit('sling', convoy.id)">
          <span class="material-icons">send</span>
        </button>
        <button class="btn btn-icon" title="Escalate" @click.stop="$emit('escalate', convoy.id, convoy.name || convoy.id)">
          <span class="material-icons">priority_high</span>
        </button>
        <button class="btn btn-icon" title="View Details" @click.stop="$emit('view', convoy.id)">
          <span class="material-icons">visibility</span>
        </button>
      </div>
    </div>

    <!-- Issue Chips (collapsed view) -->
    <div v-if="issues.length && !isExpanded" class="convoy-issues">
      <div
        v-for="(issue, i) in issues.slice(0, 3)"
        :key="i"
        class="issue-chip"
        :class="`status-${getIssueStatus(issue)}`"
        :title="getIssueTitle(issue)"
      >
        <span class="material-icons">{{ issueStatusIcon(getIssueStatus(issue)) }}</span>
        {{ truncate(getIssueTitle(issue), 20) }}
      </div>
      <div v-if="issues.length > 3" class="issue-chip more">+{{ issues.length - 3 }} more</div>
    </div>

    <!-- Progress Bar -->
    <div class="convoy-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ progress }}%</span>
    </div>

    <!-- Expanded Detail -->
    <div v-if="isExpanded" class="convoy-detail">
      <div class="convoy-detail-grid">
        <div class="convoy-detail-section">
          <h4><span class="material-icons">assignment</span> Issues ({{ issues.length }})</h4>
          <p v-if="!issues.length" class="empty-hint">No issues tracked</p>
          <div v-else class="issue-tree">
            <div
              v-for="(issue, i) in issues"
              :key="i"
              class="issue-item"
              :class="`status-${getIssueStatus(issue)}`"
              @click.stop="$emit('issue-detail', getIssueId(issue))"
            >
              <span class="material-icons issue-status-icon">{{ issueStatusIcon(getIssueStatus(issue)) }}</span>
              <span class="issue-title">{{ getIssueTitle(issue) }}</span>
              <span v-if="getIssueAssignee(issue)" class="issue-assignee">&rarr; {{ getIssueAssignee(issue) }}</span>
            </div>
          </div>
        </div>
        <div class="convoy-detail-section">
          <h4><span class="material-icons">groups</span> Workers ({{ workers.length }})</h4>
          <p v-if="!workers.length" class="empty-hint">No workers assigned</p>
          <div v-else class="worker-panel">
            <div
              v-for="(worker, i) in workers"
              :key="i"
              class="worker-item"
              :class="`status-${getWorkerStatus(worker)}`"
            >
              <div class="worker-info">
                <span class="worker-avatar">{{ getWorkerInitials(getWorkerName(worker)) }}</span>
                <div class="worker-details">
                  <span class="worker-name">{{ getWorkerName(worker) }}</span>
                  <span class="worker-status">{{ getWorkerStatus(worker) }}</span>
                </div>
              </div>
              <div class="worker-actions">
                <button class="btn btn-icon btn-sm" title="Nudge" @click.stop="$emit('nudge', getWorkerId(worker))">
                  <span class="material-icons">notifications</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="convoy-detail-section">
        <h4><span class="material-icons">analytics</span> Progress Breakdown</h4>
        <div v-if="totalTasks === 0" class="empty-hint">No tasks to track</div>
        <div v-else class="progress-breakdown">
          <div class="progress-bar-stacked">
            <div class="progress-segment done" :style="{ width: donePct + '%' }" :title="'Done: ' + doneCount"></div>
            <div class="progress-segment in-progress" :style="{ width: inProgressPct + '%' }" :title="'In Progress: ' + inProgressCount"></div>
            <div class="progress-segment pending" :style="{ width: pendingPct + '%' }" :title="'Pending: ' + pendingCount"></div>
          </div>
          <div class="progress-legend">
            <span class="legend-item done"><span class="legend-dot"></span> Done ({{ doneCount }})</span>
            <span class="legend-item in-progress"><span class="legend-dot"></span> In Progress ({{ inProgressCount }})</span>
            <span class="legend-item pending"><span class="legend-dot"></span> Pending ({{ pendingCount }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="convoy-footer">
      <div class="convoy-stats">
        <span v-if="workerCount > 0" title="Workers"><span class="material-icons">person</span>{{ workerCount }}</span>
        <span v-if="convoy.task_count !== undefined" title="Tasks"><span class="material-icons">task</span>{{ convoy.task_count }}</span>
        <span v-if="issueCount > 0" title="Issues"><span class="material-icons">bubble_chart</span>{{ issueCount }}</span>
      </div>
      <div class="convoy-time">{{ formatTimeAgoOrDate(convoy.created_at || convoy.timestamp) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { truncate } from '../../utils/html'
import { formatTimeAgoOrDate } from '../../utils/formatting'

const STATUS_ICONS = {
  pending: 'hourglass_empty',
  running: 'sync',
  complete: 'check_circle',
  failed: 'error',
  cancelled: 'cancel',
}

const ISSUE_STATUS_ICONS = {
  open: 'radio_button_unchecked',
  'in-progress': 'pending',
  done: 'check_circle',
  blocked: 'block',
}

const PRIORITY_CLASSES = {
  high: 'priority-high',
  normal: 'priority-normal',
  low: 'priority-low',
}

const props = defineProps({
  convoy: { type: Object, required: true },
})

defineEmits(['sling', 'escalate', 'view', 'issue-detail', 'nudge'])

const isExpanded = ref(false)

const status = computed(() => props.convoy.status || 'pending')
const statusIcon = computed(() => STATUS_ICONS[status.value] || 'help')
const priorityClass = computed(() => PRIORITY_CLASSES[props.convoy.priority] || '')
const issues = computed(() => props.convoy.issues || [])
const workers = computed(() => props.convoy.workers || [])
const workerCount = computed(() => props.convoy.agent_count ?? workers.value.length)
const issueCount = computed(() => props.convoy.bead_count ?? issues.value.length)

const progress = computed(() => {
  if (props.convoy.progress !== undefined) return Math.round(props.convoy.progress * 100)
  if (props.convoy.done !== undefined && props.convoy.task_count) return Math.round((props.convoy.done / props.convoy.task_count) * 100)
  if (props.convoy.completed && props.convoy.total) return Math.round((props.convoy.completed / props.convoy.total) * 100)
  if (status.value === 'complete') return 100
  if (status.value === 'pending') return 0
  return 50
})

const doneCount = computed(() => props.convoy.done || 0)
const inProgressCount = computed(() => props.convoy.in_progress || 0)
const pendingCount = computed(() => props.convoy.pending || props.convoy.task_count || 0)
const totalTasks = computed(() => doneCount.value + inProgressCount.value + pendingCount.value)
const donePct = computed(() => totalTasks.value > 0 ? Math.round((doneCount.value / totalTasks.value) * 100) : 0)
const inProgressPct = computed(() => totalTasks.value > 0 ? Math.round((inProgressCount.value / totalTasks.value) * 100) : 0)
const pendingPct = computed(() => 100 - donePct.value - inProgressPct.value)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function getIssueStatus(issue) {
  return (typeof issue === 'string' ? 'open' : issue.status) || 'open'
}
function getIssueTitle(issue) {
  return typeof issue === 'string' ? issue : (issue.title || issue)
}
function getIssueId(issue) {
  return typeof issue === 'string' ? '' : (issue.id || '')
}
function getIssueAssignee(issue) {
  return typeof issue === 'string' ? null : issue.assignee
}
function issueStatusIcon(s) {
  return ISSUE_STATUS_ICONS[s] || 'radio_button_unchecked'
}
function getWorkerName(w) {
  return typeof w === 'string' ? w : (w.name || 'unknown')
}
function getWorkerStatus(w) {
  return typeof w === 'string' ? 'idle' : (w.status || 'idle')
}
function getWorkerId(w) {
  return typeof w === 'string' ? w : (w.id || w.name)
}
function getWorkerInitials(name) {
  if (!name) return '?'
  const parts = name.split(/[\s\-_]+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
</script>

<style scoped>
.convoy-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.convoy-card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.convoy-card.expanded {
  border-color: var(--accent-primary);
}

.convoy-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.convoy-expand-btn .material-icons {
  font-size: 20px;
}
.convoy-status .material-icons {
  font-size: 20px;
}
.convoy-status.status-pending { color: #f59e0b; }
.convoy-status.status-running { color: #3b82f6; }
.convoy-status.status-complete { color: #22c55e; }
.convoy-status.status-failed { color: #ef4444; }
.convoy-status.status-cancelled { color: #6b7280; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.convoy-info { flex: 1; min-width: 0; }
.convoy-name {
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.convoy-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.convoy-priority.priority-high { color: #ef4444; font-weight: 600; }
.convoy-priority.priority-low { color: #6b7280; }

.convoy-actions {
  display: flex;
  gap: var(--space-xs);
}
.convoy-actions .btn-icon { padding: var(--space-xs); }
.convoy-actions .material-icons { font-size: 16px; }

/* Issue Chips */
.convoy-issues {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.issue-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px var(--space-xs);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}
.issue-chip .material-icons { font-size: 12px; }
.issue-chip.status-done { color: #22c55e; }
.issue-chip.status-in-progress { color: #3b82f6; }
.issue-chip.more { color: var(--text-muted); font-style: italic; }

/* Progress */
.convoy-progress {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
  min-width: 32px;
  text-align: right;
}

/* Detail Section */
.convoy-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-default);
}
.convoy-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}
.convoy-detail-section h4 {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}
.convoy-detail-section h4 .material-icons { font-size: 14px; }
.empty-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
}

/* Issue Tree */
.issue-tree { display: flex; flex-direction: column; gap: 2px; }
.issue-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 2px var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  cursor: pointer;
}
.issue-item:hover { background: var(--bg-hover); }
.issue-status-icon { font-size: 14px; }
.issue-item.status-done .issue-status-icon { color: #22c55e; }
.issue-item.status-in-progress .issue-status-icon { color: #3b82f6; }
.issue-item.status-blocked .issue-status-icon { color: #ef4444; }
.issue-title { flex: 1; }
.issue-assignee { color: var(--text-muted); font-size: var(--text-xs); }

/* Worker Panel */
.worker-panel { display: flex; flex-direction: column; gap: var(--space-xs); }
.worker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
}
.worker-info { display: flex; align-items: center; gap: var(--space-sm); }
.worker-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}
.worker-details { display: flex; flex-direction: column; }
.worker-name { font-size: var(--text-xs); font-weight: 500; }
.worker-status { font-size: 10px; color: var(--text-muted); }
.worker-actions .material-icons { font-size: 14px; }

/* Progress Breakdown */
.progress-bar-stacked {
  height: 8px;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-tertiary);
}
.progress-segment { height: 100%; transition: width 0.3s ease; }
.progress-segment.done { background: #22c55e; }
.progress-segment.in-progress { background: #3b82f6; }
.progress-segment.pending { background: var(--bg-tertiary); }
.progress-legend {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-item.done .legend-dot { background: #22c55e; }
.legend-item.in-progress .legend-dot { background: #3b82f6; }
.legend-item.pending .legend-dot { background: var(--bg-tertiary); border: 1px solid var(--border-default); }

/* Footer */
.convoy-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-default);
}
.convoy-stats {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.convoy-stats span {
  display: flex;
  align-items: center;
  gap: 2px;
}
.convoy-stats .material-icons { font-size: 14px; }
.convoy-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
