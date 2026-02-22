<template>
  <BaseModal
    :show="isOpen('new-bead')"
    title="New Work Item"
    @close="close"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="bead-title">Title</label>
        <input
          id="bead-title"
          v-model="form.title"
          type="text"
          placeholder="Short description of the work item"
          required
          autocomplete="off"
        >
      </div>
      <div class="form-group">
        <label for="bead-description">Description</label>
        <textarea
          id="bead-description"
          v-model="form.description"
          rows="4"
          placeholder="Detailed description (optional)..."
        ></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="bead-priority">Priority</label>
          <select id="bead-priority" v-model="form.priority">
            <option value="1">P1 - Critical</option>
            <option value="2" selected>P2 - Normal</option>
            <option value="3">P3 - Low</option>
          </select>
        </div>
        <div class="form-group flex-1">
          <label for="bead-labels">Labels</label>
          <input
            id="bead-labels"
            v-model="form.labels"
            type="text"
            placeholder="Comma-separated labels"
            autocomplete="off"
          >
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">add</span>
          {{ submitting ? 'Creating...' : 'Create Work Item' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'

const { isOpen, close } = useModal()
const api = useApi()
const toast = useToast()

const form = reactive({
  title: '',
  description: '',
  priority: '2',
  labels: '',
})
const submitting = ref(false)

watch(() => isOpen('new-bead'), (open) => {
  if (open) {
    form.title = ''
    form.description = ''
    form.priority = '2'
    form.labels = ''
  }
})

async function handleSubmit() {
  if (!form.title.trim()) {
    toast.warning('Please enter a title')
    return
  }

  const labels = form.labels
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  submitting.value = true
  toast.info(`Creating work item "${form.title}"...`)
  close()

  try {
    const result = await api.createBead(form.title.trim(), {
      description: form.description,
      priority: form.priority,
      labels,
    })
    if (result.success) {
      toast.success(`Work item created: ${result.bead_id}`)
    } else {
      toast.error(`Failed to create work item: ${result.error}`)
    }
  } catch (err) {
    toast.error(`Failed to create work item: ${err.message}`)
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
.form-group input,
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
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
}
.form-row {
  display: flex;
  gap: var(--space-md);
}
.flex-1 { flex: 1; }
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
