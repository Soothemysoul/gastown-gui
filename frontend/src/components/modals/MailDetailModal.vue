<template>
  <BaseModal
    v-model="visible"
    :title="mail?.subject || '(No Subject)'"
    icon="mail"
    @close="onClose"
  >
    <div v-if="mail" class="mail-detail">
      <div class="mail-meta">
        <div class="meta-row">
          <strong>From:</strong>
          <span>{{ mail.from || 'System' }}</span>
        </div>
        <div class="meta-row">
          <strong>Date:</strong>
          <span>{{ formatDate(mail.timestamp) }}</span>
        </div>
        <div v-if="mail.priority && mail.priority !== 'normal'" class="meta-row">
          <strong>Priority:</strong>
          <span class="priority-badge" :class="'priority-' + mail.priority">{{ mail.priority }}</span>
        </div>
      </div>
      <div class="mail-body">{{ mail.message || mail.body || '(No content)' }}</div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="handleReply">
        <span class="material-icons">reply</span>
        Reply
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { useUiStore } from '../../stores/uiStore'

const api = useApi()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'mail-detail',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const mail = computed(() => uiStore.modalData?.mail || null)
const mailId = computed(() => uiStore.modalData?.mailId || '')

function formatDate(d) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleString()
}

function handleReply() {
  if (!mail.value) return
  const replyTo = mail.value.from || ''
  const subject = mail.value.subject ? `Re: ${mail.value.subject}` : ''
  uiStore.openModal('mail-compose', { to: replyTo, subject })
}

function onClose() {
  // no-op
}

// Mark as read when opened
watch(visible, (v) => {
  if (v && mailId.value) {
    api.markMailRead(mailId.value).catch(() => {})
  }
})
</script>

<style scoped>
.mail-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.mail-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-muted);
}
.meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
}
.meta-row strong {
  color: var(--text-muted);
  min-width: 60px;
}
.priority-badge {
  padding: var(--space-xxs) var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
}
.priority-high, .priority-urgent {
  color: var(--accent-danger);
  background: rgba(248, 81, 73, 0.1);
}
.mail-body {
  font-size: var(--text-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-primary);
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
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }
</style>
