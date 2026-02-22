<template>
  <BaseModal
    :show="isOpen('bead-detail')"
    title=""
    size="lg"
    @close="close"
  >
    <template #header>
      <div class="bead-detail-title-row">
        <span class="material-icons" :class="'status-' + (bead?.status || 'open')">
          {{ statusIcon }}
        </span>
        <h2>{{ bead?.title || 'Bead Details' }}</h2>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons spinning">sync</span>
      Loading bead details...
    </div>

    <!-- Content -->
    <div v-else-if="bead" class="bead-detail-body">
      <!-- Meta grid -->
      <div class="bead-detail-meta">
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
          <span class="status-badge" :class="'status-' + (bead.status || 'open')">
            {{ bead.status || 'open' }}
          </span>
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
      <div v-if="bead.description" class="bead-detail-section">
        <h4>Description</h4>
        <div class="bead-description">{{ bead.description }}</div>
      </div>

      <!-- Close reason -->
      <div v-if="bead.close_reason" class="bead-detail-section completion-section">
        <h4>
          <span class="material-icons">check_circle</span>
          Completion Summary
        </h4>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="bead-close-reason" v-html="closeReasonHtml"></div>
      </div>

      <!-- Labels -->
      <div v-if="bead.labels?.length" class="bead-detail-section">
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
        <div v-if="linksLoading" class="loading-inline">
          <span class="material-icons spinning">sync</span>
          Searching for PRs...
        </div>
        <div v-else-if="links.length === 0" class="no-links">
          <span class="material-icons">link_off</span>
          No related PRs found
        </div>
        <div v-else class="bead-links-content">
          <a
            v-for="pr in links"
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
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="close">Close</button>
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
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useUiStore } from '../../stores/uiStore'
import { getBeadPriority } from '../../constants/beads'
import { parseCloseReason } from '../../constants/close-reason'

const { isOpen, modalData, close } = useModal()
const api = useApi()
const toast = useToast()
const uiStore = useUiStore()

const loading = ref(false)
const bead = ref(null)
const links = ref([])
const linksLoading = ref(false)

const beadId = computed(() => modalData.value?.beadId || '')

const statusIcons = {
  open: 'radio_button_unchecked',
  closed: 'check_circle',
  'in-progress': 'pending',
  in_progress: 'pending',
  blocked: 'block',
}

const typeIcons = {
  task: 'task_alt',
  bug: 'bug_report',
  feature: 'star',
  chore: 'build',
  epic: 'flag',
}

const statusIcon = computed(() => statusIcons[bead.value?.status] || 'help_outline')
const typeIcon = computed(() => typeIcons[bead.value?.issue_type] || 'assignment')
const priority = computed(() => bead.value ? getBeadPriority(bead.value) : 2)
const assignee = computed(() => {
  const raw = bead.value?.assignee
  return raw ? raw.split('/').pop() : null
})

const closeReasonHtml = computed(() => {
  if (!bead.value?.close_reason) return ''
  return parseCloseReason(bead.value.close_reason, beadId.value)
})

watch(() => isOpen('bead-detail'), async (open) => {
  if (!open) {
    bead.value = null
    links.value = []
    return
  }

  const data = modalData.value || {}

  // Use passed bead data if available, otherwise fetch
  if (data.bead) {
    bead.value = data.bead
  } else if (data.beadId) {
    loading.value = true
    try {
      bead.value = await api.getBead(data.beadId)
    } catch {
      bead.value = null
    } finally {
      loading.value = false
    }
  }

  // Fetch related links
  if (data.beadId) {
    fetchLinks(data.beadId)
  }
})

async function fetchLinks(id) {
  linksLoading.value = true
  links.value = []
  try {
    const result = await api.getBeadLinks(id)
    links.value = result.prs || []
  } catch {
    links.value = []
  } finally {
    linksLoading.value = false
  }
}

function prStateIcon(state) {
  if (state === 'MERGED') return 'merge'
  if (state === 'CLOSED') return 'close'
  return 'git_merge'
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleString()
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`Copied: ${text}`)
  })
}

function handleSling() {
  close()
  uiStore.openModal('sling', { bead: beadId.value })
}
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

.loading-state {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  justify-content: center;
  padding: var(--space-xl);
  color: var(--text-muted);
}

.bead-detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.bead-detail-meta {
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
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
}
.meta-value .material-icons {
  font-size: 16px;
}
.bead-id-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: 1px var(--space-xs);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.btn-icon.btn-xs {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
}
.btn-icon.btn-xs:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.btn-icon.btn-xs .material-icons {
  font-size: 14px;
}

.bead-detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.bead-detail-section h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
.bead-detail-section h4 .material-icons {
  font-size: 16px;
}

.bead-description {
  font-size: var(--text-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--text-primary);
}

.completion-section {
  background: rgba(63, 185, 80, 0.05);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid rgba(63, 185, 80, 0.2);
}
.bead-close-reason {
  font-size: var(--text-sm);
  line-height: 1.6;
  white-space: pre-wrap;
}

.bead-labels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.label-tag {
  padding: 2px var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-muted);
}
.no-links {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.bead-links-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
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
  transition: background var(--transition-fast);
}
.pr-link:hover {
  background: var(--bg-hover);
}
.pr-link > .material-icons {
  font-size: 18px;
  color: var(--text-muted);
}
.pr-state-merged > .material-icons { color: var(--accent-success); }
.pr-state-closed > .material-icons { color: var(--accent-danger); }
.pr-state-open > .material-icons { color: var(--accent-primary); }
.pr-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.pr-title {
  font-size: var(--text-sm);
  font-weight: 500;
}
.pr-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.open-icon {
  font-size: 14px;
  color: var(--text-muted);
}

.priority-badge {
  padding: 1px var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
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
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
