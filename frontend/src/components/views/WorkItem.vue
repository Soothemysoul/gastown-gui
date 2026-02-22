<template>
  <div
    class="bead-card"
    :class="statusConfig.class"
    @click="$emit('detail', bead.id, bead)"
  >
    <div class="bead-header">
      <div class="bead-status">
        <span class="material-icons">{{ statusConfig.icon }}</span>
      </div>
      <div class="bead-info">
        <h3 class="bead-title">{{ bead.title }}</h3>
        <div class="bead-meta">
          <span class="bead-id">#{{ bead.id }}</span>
          <span class="bead-type">
            <span class="material-icons">{{ typeIcon }}</span>
            {{ bead.issue_type || 'task' }}
          </span>
          <span v-if="assignee" class="bead-assignee">
            <span class="material-icons">person</span>
            {{ assignee }}
          </span>
        </div>
      </div>
      <div class="bead-priority" :class="`priority-${priority}`">
        P{{ priority }}
      </div>
    </div>

    <div v-if="bead.close_reason" class="bead-result">
      <span class="material-icons">check</span>
      <span class="result-text" v-html="parsedCloseReason"></span>
    </div>

    <div class="bead-footer">
      <div class="bead-time">
        {{ bead.closed_at ? `Completed ${formatTimeAgoOrDate(bead.closed_at)}` : `Created ${formatTimeAgoOrDate(bead.created_at)}` }}
      </div>
      <div v-if="status !== 'closed'" class="bead-actions" @click.stop>
        <button class="btn btn-xs btn-success-ghost" title="Mark as done" @click="$emit('action', 'done', bead.id)">
          <span class="material-icons">check_circle</span>
        </button>
        <button class="btn btn-xs btn-ghost" title="Park work" @click="$emit('action', 'park', bead.id)">
          <span class="material-icons">pause_circle</span>
        </button>
        <button class="btn btn-xs btn-ghost" title="Release work" @click="$emit('action', 'release', bead.id)">
          <span class="material-icons">cancel</span>
        </button>
        <button class="btn btn-xs btn-ghost" title="Reassign work" @click="$emit('action', 'reassign', bead.id)">
          <span class="material-icons">person_add</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatTimeAgoOrDate } from '../../utils/formatting'
import { truncate } from '../../utils/html'
import { getBeadPriority } from '../../constants/beads'
import { parseCloseReason } from '../../constants/close-reason'

const TYPE_ICONS = {
  task: 'task_alt',
  bug: 'bug_report',
  feature: 'star',
  message: 'mail',
  convoy: 'local_shipping',
  agent: 'smart_toy',
  chore: 'build',
  epic: 'flag',
}

const STATUS_CONFIG = {
  open: { icon: 'radio_button_unchecked', class: 'status-open', label: 'Open' },
  closed: { icon: 'check_circle', class: 'status-closed', label: 'Completed' },
  'in-progress': { icon: 'pending', class: 'status-progress', label: 'In Progress' },
  in_progress: { icon: 'pending', class: 'status-progress', label: 'In Progress' },
  blocked: { icon: 'block', class: 'status-blocked', label: 'Blocked' },
}

const props = defineProps({
  bead: { type: Object, required: true },
})

defineEmits(['detail', 'action'])

const status = computed(() => props.bead.status || 'open')
const statusConfig = computed(() => STATUS_CONFIG[status.value] || STATUS_CONFIG.open)
const typeIcon = computed(() => TYPE_ICONS[props.bead.issue_type] || 'assignment')
const assignee = computed(() => props.bead.assignee ? props.bead.assignee.split('/').pop() : null)
const priority = computed(() => getBeadPriority(props.bead))
const parsedCloseReason = computed(() =>
  parseCloseReason(truncate(props.bead.close_reason, 150), props.bead.id),
)
</script>

<style scoped>
.bead-card {
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
.bead-card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.bead-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}
.bead-status .material-icons { font-size: 20px; }
.status-open .bead-status { color: var(--text-muted); }
.status-closed .bead-status { color: #22c55e; }
.status-progress .bead-status { color: #3b82f6; }
.status-blocked .bead-status { color: #ef4444; }

.bead-info { flex: 1; min-width: 0; }
.bead-title {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.3;
}
.bead-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.bead-type, .bead-assignee {
  display: flex;
  align-items: center;
  gap: 2px;
}
.bead-type .material-icons, .bead-assignee .material-icons { font-size: 12px; }

.bead-priority {
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 2px var(--space-xs);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.priority-1 { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.priority-2 { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.priority-3 { color: #6b7280; background: rgba(107, 114, 128, 0.1); }
.priority-4 { color: #6b7280; background: rgba(107, 114, 128, 0.05); }

.bead-result {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(34, 197, 94, 0.06);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
.bead-result .material-icons { font-size: 14px; color: #22c55e; flex-shrink: 0; margin-top: 1px; }
.result-text { flex: 1; line-height: 1.4; }

.bead-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-default);
}
.bead-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.bead-actions {
  display: flex;
  gap: var(--space-xs);
}
.bead-actions .btn {
  padding: 2px 4px;
}
.bead-actions .material-icons { font-size: 16px; }
.btn-xs { font-size: var(--text-xs); }
.btn-success-ghost { color: #22c55e; }
.btn-success-ghost:hover { background: rgba(34, 197, 94, 0.1); }
.btn-ghost { color: var(--text-muted); }
.btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); }
</style>
