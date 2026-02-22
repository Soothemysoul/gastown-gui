<template>
  <BaseModal
    v-model="visible"
    title="Nudge Agent"
    @close="resetForm"
  >
    <form @submit.prevent="handleSubmit">
      <input type="hidden" :value="agentId" />
      <div class="form-group">
        <label for="nudge-target">Target</label>
        <input
          id="nudge-target"
          type="text"
          class="form-input"
          :value="agentId"
          disabled
        />
      </div>
      <div class="form-group">
        <label for="nudge-message">Message</label>
        <textarea
          id="nudge-message"
          v-model="message"
          rows="3"
          class="form-textarea"
          placeholder="Enter a message to send to the agent..."
        ></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="visible = false">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">send</span>
          {{ submitting ? 'Sending...' : 'Send Nudge' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useUiStore } from '../../stores/uiStore'

const api = useApi()
const toast = useToast()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'nudge',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const message = ref('')
const submitting = ref(false)

const agentId = computed(() => uiStore.modalData?.agentId || '')

async function handleSubmit() {
  submitting.value = true
  try {
    await api.nudge(agentId.value, message.value)
    toast.success('Nudge sent')
    visible.value = false
  } catch (err) {
    toast.error(`Failed to nudge agent: ${err.message}`)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  message.value = ''
}

watch(visible, (v) => {
  if (!v) resetForm()
})
</script>

<style scoped>
.form-group {
  margin-bottom: var(--space-md);
}
.form-group label {
  display: block;
  margin-bottom: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
}
.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
}
.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-textarea {
  resize: vertical;
  min-height: 80px;
}
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
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
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
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
