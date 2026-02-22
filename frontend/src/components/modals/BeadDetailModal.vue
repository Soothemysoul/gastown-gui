<template>
  <BaseModal
    v-model="visible"
    :title="bead?.title || 'Bead Details'"
    icon="assignment"
    size="lg"
    @close="onClose"
  >
    <template #header>
      <h2 class="bead-title-row">
        <span class="material-icons status-icon" :class="'status-' + (bead?.status || 'open')">
          {{ statusIcon }}
        </span>
        {{ bead?.title || 'Bead Details' }}
      </h2>
    </template>

    <div v-if="bead" class="bead-detail">
      <!-- Meta grid -->
      <div class="bead-meta">
        <div class="meta-row">
          <span class="meta-label">ID:</span>
          <code class="bead-id-code">{{ beadId }}</code>
          <button class="btn-icon btn-xs" @click="copyText(beadId)" title="Copy ID">
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
      <div v-if="bead.description" class="bead-section">
        <h4>Description</h4>
        <div class="bead-description">{{ bead.description }}</div>
      </div>

      <!-- Completion summary (close_reason) -->
      <div v-if="bead.close_reason" class="bead-section completion-section">
        <h4>
          <span class="material-icons">check_circle</span>
          Completion Summary
        </h4>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="bead-close-reason" v-html="closeReasonHtml" @click="handleCloseReasonClick"></div>
      </div>

      <!-- Labels -->
      <div v-if="bead.labels?.length" class="bead-section">
        <h4>Labels</h4>
        <div class="bead-labels">
          <span v-for="label in bead.labels" :key="label" class="label-tag">{{ label }}</span>
        </div>
      </div>

      <!-- Related links -->
      <div class="bead-section bead-links-section">
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
import { getBeadPriority } from '../../constants/beads'
import { parseCloseReason } from '../../constants/close-reason'

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
  let result = parseCloseReason(bead.value.close_reason, beadId.value)
  // Upgrade commit links with icons
  result = result.replace(/<a\b[^>]*\bdata-commit="([^"]+)"[^>]*>.*?<\/a>/gi, (match, hash) => {
    const hrefMatch = match.match(/href="([^"]+)"/i)
    const href = hrefMatch ? hrefMatch[1] : '#'
    const shortHash = String(hash).substring(0, 7)
    const isCopy = href === '#' || /\bcommit-copy\b/i.test(match)
    if (isCopy) {
      return `<a href="#" class="commit-copy code-link" data-commit="${hash}" title="Click to copy"><span class="material-icons">commit</span>${shortHash}</a>`
    }
    return `<a href="${href}" target="_blank" class="commit-link code-link" data-commit="${hash}" title="View on GitHub"><span class="material-icons">commit</span>${shortHash}</a>`
  })
  // Upgrade PR links with icons
  result = result.replace(/<a\b[^>]*\bdata-pr="([^"]+)"[^>]*>.*?<\/a>/gi, (match, num) => {
    const hrefMatch = match.match(/href="([^"]+)"/i)
    const href = hrefMatch ? hrefMatch[1] : '#'
    const isCopy = href === '#' || /\bpr-copy\b/i.test(match)
    if (isCopy) {
      return `<a href="#" class="pr-copy code-link" data-pr="${num}" title="Click to copy"><span class="material-icons">merge</span>PR #${num}</a>`
    }
    return `<a href="${href}" target="_blank" class="pr-link code-link" data-pr="${num}" title="View on GitHub"><span class="material-icons">merge</span>PR #${num}</a>`
  })
  // File paths
  result = result.replace(/→\s*([A-Za-z0-9_.-]+\.[A-Za-z0-9]+)/g, (match, filename) => {
    return `→ <code class="filename">${filename}</code>`
  })
  return result
})

function prStateIcon(state) {
  if (state === 'MERGED') return 'merge'
  if (state === 'CLOSED') return 'close'
  return 'git_merge'
}

function formatDate(d) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleString()
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`Copied: ${text}`)
  })
}

function handleCloseReasonClick(e) {
  const target = e.target.closest('a')
  if (!target) return

  if (target.classList.contains('commit-copy')) {
    e.preventDefault()
    const hash = target.dataset.commit
    if (hash) {
      navigator.clipboard.writeText(hash).then(() => {
        toast.success(`Copied commit: ${hash}`)
      })
    }
  } else if (target.classList.contains('pr-copy')) {
    e.preventDefault()
    const pr = target.dataset.pr
    if (pr) {
      navigator.clipboard.writeText(`#${pr}`).then(() => {
        toast.success(`Copied: PR #${pr}`)
      })
    }
  }
}

function handleSling() {
  uiStore.openModal('sling', { bead: beadId.value })
}

async function loadLinks() {
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
  if (v) loadLinks()
  else onClose()
})
</script>

<style scoped>
.bead-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-lg);
  font-weight: 600;
}
.status-icon {
  font-size: 20px;
}

.bead-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Meta */
.bead-meta {
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
  color: var(--text-muted);
}
.bead-id-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--accent-primary);
}

.priority-badge {
  display: inline-block;
  padding: var(--space-xxs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}
.priority-1 { color: var(--accent-danger); background: rgba(248, 81, 73, 0.1); }
.priority-2 { color: var(--accent-warning, #d29922); background: rgba(210, 153, 34, 0.1); }
.priority-3 { color: var(--text-secondary); background: var(--bg-tertiary); }

.status-badge {
  display: inline-block;
  padding: var(--space-xxs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

/* Sections */
.bead-section h4 {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--text-secondary);
}
.bead-section h4 .material-icons {
  font-size: 18px;
}

.bead-description {
  font-size: var(--text-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
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
  white-space: pre-wrap;
  word-break: break-word;
}
.bead-close-reason :deep(.code-link) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--accent-primary);
  text-decoration: none;
}
.bead-close-reason :deep(.code-link:hover) {
  text-decoration: underline;
}
.bead-close-reason :deep(.code-link .material-icons) {
  font-size: 14px;
}
.bead-close-reason :deep(.filename) {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  background: var(--bg-tertiary);
  padding: 1px var(--space-xs);
  border-radius: var(--radius-sm);
}

/* Labels */
.bead-labels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.label-tag {
  display: inline-block;
  padding: var(--space-xxs) var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* Links */
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
  font-size: 20px;
}
.pr-state-merged > .material-icons { color: #a371f7; }
.pr-state-closed > .material-icons { color: var(--accent-danger); }
.pr-state-open > .material-icons { color: var(--status-running); }
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
  font-size: 16px;
  color: var(--text-muted);
}
.no-links {
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

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
