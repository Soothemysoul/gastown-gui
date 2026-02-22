<template>
  <BaseModal
    v-model="visible"
    title=""
    size="lg"
    @close="onClose"
  >
    <template #header>
      <h2>
        <span class="material-icons">mail</span>
        {{ mail?.subject || '(No Subject)' }}
      </h2>
    </template>

    <div class="mail-detail-meta">
      <div><strong>From:</strong> {{ mail?.from || 'System' }}</div>
      <div><strong>Date:</strong> {{ formatDate(mail?.timestamp) }}</div>
      <div v-if="mail?.priority && mail.priority !== 'normal'">
        <strong>Priority:</strong>
        <span class="priority-tag" :class="'priority-' + mail.priority">{{ mail.priority }}</span>
      </div>
    </div>
    <div class="mail-detail-body">
      {{ mail?.message || mail?.body || '(No content)' }}
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
import { computed } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/uiStore'

const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'mail-detail',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const mail = computed(() => uiStore.modalData?.mail || null)

function formatDate(d) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleString()
}

function handleReply() {
  if (!mail.value) return
  // Open compose modal pre-filled with reply data
  uiStore.openModal('mail-compose', {
    to: mail.value.from,
    subject: `Re: ${mail.value.subject || ''}`,
    inReplyTo: mail.value,
  })
}

function onClose() {
  // no-op
}
</script>

<style scoped>
.mail-detail-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-muted);
  margin-bottom: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.mail-detail-meta strong {
  color: var(--text-primary);
}
.priority-tag {
  display: inline-block;
  padding: 1px var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
}
.priority-high, .priority-urgent {
  color: var(--accent-danger);
  background: rgba(248, 81, 73, 0.1);
}
.priority-low {
  color: var(--text-muted);
  background: var(--bg-tertiary);
}
.mail-detail-body {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: var(--text-sm);
  line-height: 1.6;
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
