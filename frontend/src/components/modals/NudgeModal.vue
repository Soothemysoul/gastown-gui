<template>
  <BaseModal
    :show="isOpen('nudge')"
    title="Nudge Agent"
    size="sm"
    @close="close"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Target</label>
        <code class="nudge-target">{{ agentId }}</code>
      </div>
      <div class="form-group">
        <label for="nudge-message">Message</label>
        <textarea
          id="nudge-message"
          v-model="message"
          rows="3"
          placeholder="Enter a message to send to the agent..."
        ></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
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
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'

const { isOpen, modalData, close } = useModal()
const api = useApi()
const toast = useToast()

const message = ref('')
const submitting = ref(false)

const agentId = computed(() => modalData.value?.agentId || '')

// Reset form when modal opens
watch(() => isOpen('nudge'), (open) => {
  if (open) {
    message.value = ''
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    await api.nudge(agentId.value, message.value)
    toast.success('Nudge sent')
    close()
  } catch (err) {
    toast.error(`Failed to nudge agent: ${err.message}`)
  } finally {
    submitting.value = false
  }
}
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
.nudge-target {
  display: block;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
.form-group textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
  resize: vertical;
}
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
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
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
