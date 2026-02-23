<template>
  <BaseModal
    v-model="visible"
    :title="isEditing ? 'Edit Formula' : 'New Formula'"
    :icon="isEditing ? 'edit' : 'science'"
    size="lg"
    @close="resetForm"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Formula Name</label>
        <input
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="my-formula"
          :disabled="isEditing"
        />
      </div>

      <div class="form-group">
        <label>Description</label>
        <input
          v-model="form.description"
          type="text"
          class="form-input"
          placeholder="What this formula does..."
        />
      </div>

      <div class="form-group">
        <label>Template</label>
        <textarea
          v-model="form.template"
          class="form-textarea"
          rows="10"
          placeholder="Formula template content...

Use {{variable}} for parameters."
        ></textarea>
        <span class="form-hint">Supports <code v-text="'{{variable}}'"></code> placeholders for parameters</span>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="visible = false">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting || !form.name">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">{{ isEditing ? 'save' : 'add' }}</span>
          {{ submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Formula') }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useUiStore } from '../../stores/uiStore'

const api = useApi()
const toast = useToast()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'new-formula',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const form = reactive({
  name: '',
  description: '',
  template: '',
})

const submitting = ref(false)

const isEditing = computed(() => !!uiStore.modalData?.formula)

// Pre-fill when editing
watch(visible, (v) => {
  if (v && uiStore.modalData?.formula) {
    const f = uiStore.modalData.formula
    form.name = f.name || ''
    form.description = f.description || ''
    form.template = f.template || ''
  }
})

async function handleSubmit() {
  if (!form.name) {
    toast.warning('Please enter a formula name')
    return
  }

  submitting.value = true
  try {
    if (isEditing.value) {
      await api.updateFormula(form.name, form.description, form.template)
      toast.success(`Formula "${form.name}" updated`)
    } else {
      await api.createFormula(form.name, form.description, form.template)
      toast.success(`Formula "${form.name}" created`)
    }
    visible.value = false
  } catch (err) {
    toast.error(`Failed to ${isEditing.value ? 'update' : 'create'} formula: ${err.message}`)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.template = ''
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
.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
}
.form-textarea {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.6;
  resize: vertical;
  min-height: 160px;
}
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-hint {
  display: block;
  margin-top: var(--space-xxs);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.form-hint code {
  background: var(--bg-tertiary);
  padding: 1px var(--space-xxs);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
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
