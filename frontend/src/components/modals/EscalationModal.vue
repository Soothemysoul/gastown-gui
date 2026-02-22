<template>
  <BaseModal
    :show="isOpen('escalation')"
    title="Escalate Issue"
    @close="close"
  >
    <template #header>
      <h2>
        <span class="material-icons warning-icon">warning</span>
        Escalate Issue
      </h2>
    </template>

    <div class="escalation-info">
      <p v-if="convoyName">
        Escalating convoy: <strong>{{ convoyName }}</strong>
      </p>
      <p class="escalation-warning">
        This will notify the Mayor and may interrupt other workflows.
      </p>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="escalation-reason">Reason for Escalation</label>
        <textarea
          id="escalation-reason"
          v-model="form.reason"
          rows="4"
          required
          placeholder="Describe why this issue needs immediate attention..."
        ></textarea>
      </div>
      <div class="form-group">
        <label for="escalation-priority">Priority Level</label>
        <select id="escalation-priority" v-model="form.priority">
          <option value="normal">Normal - Needs attention soon</option>
          <option value="high">High - Blocking other work</option>
          <option value="critical">Critical - Production issue</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
        <button type="submit" class="btn btn-danger" :disabled="submitting">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">priority_high</span>
          {{ submitting ? 'Escalating...' : 'Escalate' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'

const { isOpen, close, modalData } = useModal()
const api = useApi()
const toast = useToast()

const form = reactive({
  reason: '',
  priority: 'normal',
})
const submitting = ref(false)

const convoyId = computed(() => modalData.value?.convoyId || '')
const convoyName = computed(() => modalData.value?.convoyName || modalData.value?.convoyId || '')

watch(() => isOpen('escalation'), (open) => {
  if (open) {
    form.reason = ''
    form.priority = 'normal'
  }
})

async function handleSubmit() {
  if (!form.reason.trim()) {
    toast.warning('Please provide a reason for escalation')
    return
  }

  submitting.value = true
  try {
    await api.escalate(convoyId.value, form.reason.trim(), form.priority)
    toast.success('Issue escalated to Mayor')
    close()
  } catch (err) {
    toast.error(`Failed to escalate: ${err.message}`)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.warning-icon {
  color: var(--accent-warning);
}
.escalation-info {
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.escalation-info p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.escalation-warning {
  margin-top: var(--space-sm);
  color: var(--accent-warning) !important;
  font-weight: 500;
}
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
}
.form-group textarea:focus,
.form-group select:focus {
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
.btn-danger {
  background: var(--accent-danger);
  color: #fff;
}
.btn-danger:hover:not(:disabled) { filter: brightness(1.1); }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
