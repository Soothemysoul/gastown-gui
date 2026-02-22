<template>
  <BaseModal
    v-model="visible"
    title=""
    size="lg"
    @close="onClose"
  >
    <template #header>
      <div class="bead-detail-title-row">
        <span class="material-icons status-icon" :class="'status-' + (bead?.status || 'open')">
          {{ statusIcon }}
        </span>
        <h2>{{ bead?.title || beadId }}</h2>
      </div>
    </template>

    <!-- Meta info -->
    <div v-if="bead" class="bead-detail-meta">
      <div class="meta-row">
        <span class="meta-label">ID:</span>
        <code class="bead-id-code">{{ beadId }}</code>
        <button class="btn btn-icon btn-xs" title="Copy ID" @click="copyText(beadId)">
          <span class="material-icons">content_copy</span>
        </button>
      </div>
      <div class="meta-row">
        <span class="meta-label">Type:</span>
        <span class="meta-value">
          <span class="material-icons">{{ typeIcon }}</span>
          {{ bead.issue_type || 'task' }}
        </span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Priority:</span>
        <span class="priority-badge" :class="'priority-' + priority">P{{ priority }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Status:</span>
        <span class="status-badge" :class="'status-' + (bead.status || 'open')">{{ bead.status || 'open' }}</span>
      </div>
      <div v-if="assignee" class="meta-row">
        <span class="meta-label">Assignee:</span>
        <span class="meta-value">
          <span class="material-icons">person</span>
          {{ assignee }}
        </span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Created:</span>
        <span class="meta-value">{{ formatDate(bead.created_at) }}</span>
      </div>
      <div v-if="bead.closed_at" class="meta-row">
        <span class="meta-label">Completed:</span>
        <span class="meta-value">{{ formatDate(bead.closed_at) }}</span>
      </div>
    </div>

    <!-- Description -->
    <div v-if="bead?.description" class="bead-detail-section">
      <h4>Description</h4>
      <div class="bead-description">{{ bead.description }}</div>
    </div>

    <!-- Close reason / completion summary -->
    <div v-if="bead?.close_reason" class="bead-detail-section completion-section">
      <h4>
        <span class="material-icons">check_circle</span>
        Completion Summary
      </h4>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="bead-close-reason" v-html="closeReasonHtml"></div>
    </div>

    <!-- Labels -->
    <div v-if="bead?.labels?.length" class="bead-detail-section">
      <h4>Labels</h4>
      <div class="bead-labels">
        <span v-for="label in bead.labels" :key="label" class="label-tag">{{ label }}</span>
      </div>
    </div>

    <!-- Related links -->
    <div class="bead-detail-section bead-links-section">
      <h4>
        <span class="material-icons">link</span>
        Related Links
      </h4>
      <div class="bead-links-content">
        <div v-if="linksLoading" class="loading-inline">
          <span class="material-icons spinning">sync</span>
          Searching for PRs...
        </div>
        <template v-else-if="links?.prs?.length">
          <a
            v-for="pr in links.prs"
            :key="pr.number"
            :href="pr.url"
            target="_blank"
            class="pr-link"
            :class="'pr-state-' + pr.state.toLowerCase()"
          >
            <span class="material-icons">{{ prStateIcon(pr.state) }}</span>
            <span class="pr-info">
              <span class="pr-title">{{ pr.title }}</span>
              <span class="pr-meta">{{ pr.repo }} #{{ pr.number }}</span>
            </span>
            <span class="material-icons open-icon">open_in_new</span>
          </a>
        </template>
        <div v-else class="no-links">
          <span class="material-icons">link_off</span>
          No related PRs found
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="visible = false">Close</button>
      <button
        v-if="bead && bead.status !== 'closed'"
        class="btn btn-primary"
        @click="handleSling"
      >
        <span class="material-icons">send</span>
        Sling Work
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useUiStore } from '../../stores/uiStore'
import { parseCloseReason } from '../../constants/close-reason'
import { getBeadPriority } from '../../constants/beads'

const api = useApi()
const toast = useToast()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'bead-detail',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const links = ref(null)
const linksLoading = ref(false)

const beadId = computed(() => uiStore.modalData?.beadId || '')
const bead = computed(() => uiStore.modalData?.bead || null)
const priority = computed(() => bead.value ? getBeadPriority(bead.value) : 2)
const assignee = computed(() => {
  const raw = bead.value?.assignee
  return raw ? raw.split('/').pop() : null
})

const STATUS_ICONS = {
  open: 'radio_button_unchecked',
  closed: 'check_circle',
  'in-progress': 'pending',
  in_progress: 'pending',
  blocked: 'block',
}
const TYPE_ICONS = {
  task: 'task_alt',
  bug: 'bug_report',
  feature: 'star',
  chore: 'build',
  epic: 'flag',
}

const statusIcon = computed(() => STATUS_ICONS[bead.value?.status] || 'help_outline')
const typeIcon = computed(() => TYPE_ICONS[bead.value?.issue_type] || 'assignment')

const closeReasonHtml = computed(() => {
  if (!bead.value?.close_reason) return ''
  return parseCloseReason(bead.value.close_reason, beadId.value)
})

function formatDate(d) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleString()
}

function prStateIcon(state) {
  if (state === 'MERGED') return 'merge'
  if (state === 'CLOSED') return 'close'
  return 'git_merge'
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`Copied: ${text}`)
  })
}

function handleSling() {
  uiStore.openModal('sling', { bead: beadId.value })
}

async function fetchLinks() {
  if (!beadId.value) return
  linksLoading.value = true
  try {
    links.value = await api.getBeadLinks(beadId.value)
  } catch {
    links.value = null
  } finally {
    linksLoading.value = false
  }
}

function onClose() {
  links.value = null
}

watch(visible, (v) => {
  if (v) {
    fetchLinks()
  } else {
    onClose()
  }
})
</script>

<style scoped>
.bead-detail-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.bead-detail-title-row h2 {
  font-size: var(--text-lg);
  font-weight: 600;
}
.status-icon {
  font-size: 20px;
}
.status-icon.status-open { color: var(--status-open, var(--accent-primary)); }
.status-icon.status-closed { color: var(--status-closed, var(--accent-success)); }
.status-icon.status-in-progress,
.status-icon.status-in_progress { color: var(--status-running, #f0883e); }
.status-icon.status-blocked { color: var(--accent-danger); }

.bead-detail-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-muted);
  margin-bottom: var(--space-md);
}
.meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
}
.meta-label {
  font-weight: 600;
  color: var(--text-muted);
  min-width: 80px;
}
.meta-value {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
}
.meta-value .material-icons {
  font-size: 16px;
}
.bead-id-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--accent-primary);
}
.btn-xs {
  width: 24px;
  height: 24px;
  font-size: 14px;
}
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  border: none;
  background: none;
}
.btn-icon:hover { color: var(--text-primary); background: var(--bg-hover); }
.btn-icon .material-icons { font-size: inherit; }

.priority-badge {
  display: inline-block;
  padding: 1px var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}
.priority-1 { color: var(--accent-danger); background: rgba(248, 81, 73, 0.15); }
.priority-2 { color: #f0883e; background: rgba(240, 136, 62, 0.15); }
.priority-3 { color: var(--text-secondary); background: var(--bg-tertiary); }
.priority-4 { color: var(--text-muted); background: var(--bg-tertiary); }

.status-badge {
  display: inline-block;
  padding: 1px var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
}
.status-badge.status-open { color: var(--accent-primary); background: rgba(88, 166, 255, 0.1); }
.status-badge.status-closed { color: var(--accent-success, #3fb950); background: rgba(63, 185, 80, 0.1); }
.status-badge.status-in-progress,
.status-badge.status-in_progress { color: #f0883e; background: rgba(240, 136, 62, 0.1); }
.status-badge.status-blocked { color: var(--accent-danger); background: rgba(248, 81, 73, 0.1); }

.bead-detail-section {
  margin-bottom: var(--space-md);
}
.bead-detail-section h4 {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}
.bead-detail-section h4 .material-icons {
  font-size: 18px;
}
.bead-description {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--text-primary);
}
.completion-section {
  background: rgba(63, 185, 80, 0.05);
  border: 1px solid rgba(63, 185, 80, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}
.bead-close-reason {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--text-primary);
}
.bead-close-reason :deep(a) {
  color: var(--accent-primary);
  text-decoration: none;
}
.bead-close-reason :deep(a:hover) {
  text-decoration: underline;
}
.bead-close-reason :deep(.code-link) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.bead-labels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.label-tag {
  display: inline-block;
  padding: 2px var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.bead-links-section {
  border-top: 1px solid var(--border-muted);
  padding-top: var(--space-md);
}
.bead-links-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.loading-inline {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.no-links {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.pr-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: background var(--transition-fast);
}
.pr-link:hover {
  background: var(--bg-hover);
}
.pr-link .material-icons {
  font-size: 18px;
}
.pr-state-merged .material-icons { color: #a371f7; }
.pr-state-closed .material-icons { color: var(--accent-danger); }
.pr-state-open .material-icons { color: var(--accent-success, #3fb950); }
.pr-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.pr-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pr-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.open-icon {
  color: var(--text-muted);
  font-size: 14px !important;
}

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

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
