<template>
  <div class="issue-card" :class="`issue-${issue.state}`">
    <div class="issue-header">
      <div class="issue-state-icon">
        <span class="material-icons" :class="issue.state === 'open' ? 'text-success' : 'text-muted'">
          {{ issue.state === 'open' ? 'radio_button_unchecked' : 'check_circle' }}
        </span>
      </div>
      <div class="issue-info">
        <a :href="issue.url" target="_blank" class="issue-title">{{ issue.title }}</a>
        <div class="issue-meta">
          <span class="issue-number">#{{ issue.number }}</span>
          <span class="issue-repo">{{ issue.repo }}</span>
          <span v-if="issue.rig" class="issue-rig">
            <span class="material-icons">folder</span>
            {{ issue.rig }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="labels.length" class="issue-labels">
      <span
        v-for="label in labels"
        :key="label.name"
        class="issue-label"
        :style="{ background: '#' + (label.color || '6c757d') }"
      >{{ label.name }}</span>
    </div>
    <div class="issue-footer">
      <div class="issue-author">
        <span class="material-icons">person</span>
        {{ issue.author?.login || 'Unknown' }}
      </div>
      <div v-if="assignees" class="issue-assignees">
        <span class="material-icons">assignment_ind</span>
        {{ assignees }}
      </div>
      <div class="issue-time">
        {{ formatRelativeTime(issue.updatedAt) }}
      </div>
      <div class="issue-actions" @click.stop>
        <button class="btn btn-xs btn-ghost" title="Sling to worker" @click="$emit('sling', issue)">
          <span class="material-icons">send</span>
        </button>
        <a :href="issue.url" target="_blank" class="btn btn-xs btn-ghost" title="Open on GitHub">
          <span class="material-icons">open_in_new</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '../../utils/formatting'

const props = defineProps({
  issue: { type: Object, required: true },
})

defineEmits(['sling'])

const labels = computed(() => props.issue.labels || [])
const assignees = computed(() => (props.issue.assignees || []).map(a => a.login).join(', '))
</script>

<style scoped>
.issue-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.issue-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}
.issue-state-icon .material-icons { font-size: 20px; }
.text-success { color: #22c55e; }
.text-muted { color: var(--text-muted); }

.issue-info { flex: 1; min-width: 0; }
.issue-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
}
.issue-title:hover { text-decoration: underline; }

.issue-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.issue-number { font-weight: 600; }
.issue-rig {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.issue-rig .material-icons { font-size: 12px; }

.issue-labels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.issue-label {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  color: #fff;
  font-weight: 500;
}

.issue-footer {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--text-muted);
  border-top: 1px solid var(--border-default);
  padding-top: var(--space-xs);
}
.issue-footer > div {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.issue-footer .material-icons { font-size: 14px; }
.issue-actions { margin-left: auto; display: flex; gap: 2px; }
</style>
