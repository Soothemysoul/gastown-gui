<template>
  <div class="pr-card" @click="$emit('detail', pr)">
    <div class="pr-icon" :class="[pr.state?.toLowerCase(), { draft: pr.isDraft }]">
      <span class="material-icons">{{ stateIcon }}</span>
    </div>
    <div class="pr-content">
      <div class="pr-header">
        <span class="pr-number">#{{ pr.number }}</span>
        <span class="pr-title">{{ pr.title }}</span>
        <span v-if="pr.isDraft" class="pr-draft-badge">Draft</span>
      </div>
      <div class="pr-meta">
        <span class="pr-repo" title="Repository">
          <span class="material-icons">folder</span>
          {{ pr.rig }}
        </span>
        <span class="pr-branch" title="Branch">
          <span class="material-icons">account_tree</span>
          {{ pr.headRefName }}
        </span>
        <span class="pr-author" title="Author">
          <span class="material-icons">person</span>
          {{ pr.author?.login || 'unknown' }}
        </span>
        <span class="pr-time" title="Last updated">
          <span class="material-icons">schedule</span>
          {{ formatRelativeTime(pr.updatedAt) }}
        </span>
        <span v-if="reviewHtml" class="pr-review" :class="pr.reviewDecision?.toLowerCase()">
          <span class="material-icons">{{ reviewIcon }}</span>
        </span>
      </div>
    </div>
    <div class="pr-actions" @click.stop>
      <a :href="pr.url" target="_blank" class="btn btn-sm btn-icon" title="Open in GitHub">
        <span class="material-icons">open_in_new</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '../../utils/formatting'

const props = defineProps({
  pr: { type: Object, required: true },
})

defineEmits(['detail'])

const stateIcon = computed(() => {
  if (props.pr.isDraft) return 'edit_note'
  switch (props.pr.state?.toUpperCase()) {
    case 'OPEN': return 'merge_type'
    case 'CLOSED': return 'close'
    case 'MERGED': return 'merge'
    default: return 'merge_type'
  }
})

const reviewIcon = computed(() => {
  switch (props.pr.reviewDecision?.toUpperCase()) {
    case 'APPROVED': return 'check_circle'
    case 'CHANGES_REQUESTED': return 'change_circle'
    case 'REVIEW_REQUIRED': return 'pending'
    default: return null
  }
})

const reviewHtml = computed(() => reviewIcon.value !== null)
</script>

<style scoped>
.pr-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}
.pr-card:hover {
  border-color: var(--accent-primary);
}

.pr-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}
.pr-icon .material-icons { font-size: 20px; }
.pr-icon.open { color: #22c55e; }
.pr-icon.closed { color: #ef4444; }
.pr-icon.merged { color: #a855f7; }
.pr-icon.draft { color: var(--text-muted); }

.pr-content { flex: 1; min-width: 0; }
.pr-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}
.pr-number {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: 600;
}
.pr-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}
.pr-draft-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-muted);
  font-weight: 500;
}

.pr-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.pr-meta > span {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.pr-meta .material-icons { font-size: 14px; }

.pr-review .material-icons { font-size: 16px; }
.pr-review.approved { color: #22c55e; }
.pr-review.changes_requested { color: #f59e0b; }
.pr-review.review_required { color: var(--text-muted); }

.pr-actions {
  flex-shrink: 0;
}
</style>
