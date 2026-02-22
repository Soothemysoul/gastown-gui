<template>
  <BaseModal
    v-model="visible"
    title="Add New Crew"
    icon="groups"
    @close="resetForm"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Crew Name</label>
        <input
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="crew-name"
        />
      </div>

      <div class="form-group">
        <label>Rig</label>
        <select v-model="form.rig" class="form-select" :disabled="rigsLoading">
          <option value="">{{ rigsLoading ? 'Loading rigs...' : 'Select a rig...' }}</option>
          <option v-for="rig in rigs" :key="rig.name" :value="rig.name">
            {{ rig.name }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="visible = false">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting || !form.name || !form.rig">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">group_add</span>
          {{ submitting ? 'Adding...' : 'Add Crew' }}
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
  get: () => uiStore.activeModal === 'new-crew',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const form = reactive({
  name: '',
  rig: '',
})

const submitting = ref(false)
const rigs = ref([])
const rigsLoading = ref(false)

async function loadRigs() {
  rigsLoading.value = true
  try {
    rigs.value = await api.getRigs()
  } catch {
    rigs.value = []
  } finally {
    rigsLoading.value = false
  }
}

async function handleSubmit() {
  if (!form.name || !form.rig) {
    toast.warning('Please enter both crew name and rig')
    return
  }

  submitting.value = true
  try {
    await api.addCrew(form.name, form.rig)
    toast.success(`Crew "${form.name}" added to rig "${form.rig}"`)
    visible.value = false
  } catch (err) {
    toast.error(`Failed to add crew: ${err.message}`)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.name = ''
  form.rig = ''
}

watch(visible, (v) => {
  if (v) loadRigs()
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
.form-select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
}
.form-select { cursor: pointer; }
.form-input:focus,
.form-select:focus {
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
