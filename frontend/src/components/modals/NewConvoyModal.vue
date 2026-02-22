<template>
  <BaseModal
    :show="isOpen('new-convoy')"
    title="New Convoy"
    @close="close"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="convoy-name">Convoy Name</label>
        <input
          id="convoy-name"
          v-model="form.name"
          type="text"
          placeholder="e.g., auth-refactor"
          required
          autocomplete="off"
        >
      </div>
      <div class="form-group">
        <label for="convoy-issues">Issues</label>
        <textarea
          id="convoy-issues"
          v-model="form.issues"
          rows="3"
          placeholder="Comma or newline separated issue IDs..."
        ></textarea>
        <span class="form-hint">Optional: attach bead IDs to this convoy</span>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">add</span>
          {{ submitting ? 'Creating...' : 'Create Convoy' }}
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

const form = reactive({ name: '', issues: '' })
const submitting = ref(false)

// Reset form when modal opens
watch(() => isOpen('new-convoy'), (open) => {
  if (open) {
    form.name = ''
    form.issues = ''
  }
})

async function handleSubmit() {
  if (!form.name.trim()) {
    toast.warning('Please enter a convoy name')
    return
  }

  const issues = form.issues
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean)

  submitting.value = true
  try {
    await api.createConvoy(form.name.trim(), issues)
    toast.success(`Convoy "${form.name}" created`)
    close()
  } catch (err) {
    toast.error(`Failed to create convoy: ${err.message}`)
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
.form-group textarea {
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
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
}
.form-hint {
  display: block;
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
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
