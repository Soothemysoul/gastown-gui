<template>
  <BaseModal
    :show="isOpen('mail-detail')"
    :title="mail?.subject || '(No Subject)'"
    size="md"
    @close="close"
  >
    <div v-if="mail" class="mail-detail">
      <div class="mail-meta">
        <div><strong>From:</strong> {{ mail.from || 'System' }}</div>
        <div><strong>Date:</strong> {{ formatDate(mail.timestamp) }}</div>
        <div v-if="mail.priority && mail.priority !== 'normal'">
          <strong>Priority:</strong> {{ mail.priority }}
        </div>
      </div>
      <div class="mail-body">
        {{ mail.message || mail.body || '(No content)' }}
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="handleMarkRead">
        <span class="material-icons">mark_email_read</span>
        Mark Read
      </button>
      <button class="btn btn-secondary" @click="handleReply">
        <span class="material-icons">reply</span>
        Reply
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useUiStore } from '../../stores/uiStore'

const { isOpen, modalData, close } = useModal()
const api = useApi()
const toast = useToast()
const uiStore = useUiStore()

const mail = computed(() => modalData.value?.mail || null)
const mailId = computed(() => modalData.value?.mailId || '')

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleString()
}

async function handleMarkRead() {
  if (!mailId.value) return
  try {
    await api.markMailRead(mailId.value)
    toast.success('Mail marked as read')
  } catch (err) {
    toast.error(`Failed to mark read: ${err.message}`)
  }
}

function handleReply() {
  if (!mail.value) return
  close()
  uiStore.openModal('mail-compose', {
    replyTo: mail.value.from,
    subject: `Re: ${mail.value.subject || ''}`,
  })
}
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
  border-bottom: 1px solid var(--border-default);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.mail-body {
  font-size: var(--text-sm);
  line-height: 1.6;
  white-space: pre-wrap;
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
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }
</style>
