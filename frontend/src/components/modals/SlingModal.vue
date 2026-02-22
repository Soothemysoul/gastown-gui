<template>
  <BaseModal
    v-model="visible"
    title="Sling Work"
    icon="send"
    @close="resetForm"
  >
    <form @submit.prevent="handleSubmit">
      <!-- Bead search with autocomplete -->
      <div class="form-group">
        <label>Bead / Formula</label>
        <Autocomplete
          v-model="form.bead"
          placeholder="Search beads or formulas..."
          :search="searchBeads"
          :min-chars="1"
          :debounce-ms="150"
          @select="onBeadSelect"
        >
          <template #item="{ item }">
            <span v-if="item.type === 'formula'" class="bead-item formula">
              <span class="bead-icon">📜</span>
              <span class="bead-id">{{ item.name || item.id }}</span>
              <span class="bead-desc">{{ item.description || 'Formula' }}</span>
            </span>
            <span v-else class="bead-item">
              <span class="bead-id">{{ item.id }}</span>
              <span class="bead-title">{{ item.title || '' }}</span>
              <span class="bead-status" :class="'status-' + (item.status || 'open')">{{ item.status || 'open' }}</span>
            </span>
          </template>
        </Autocomplete>
      </div>

      <!-- Target dropdown with optgroups -->
      <div class="form-group">
        <label>Target Agent</label>
        <select v-model="form.target" class="form-select" :disabled="targetsLoading">
          <option value="">{{ targetsLoading ? 'Loading targets...' : 'Select target agent...' }}</option>
          <optgroup v-for="group in targetGroups" :key="group.label" :label="group.label">
            <option v-for="t in group.targets" :key="t.id" :value="t.id" :title="t.description || ''">
              {{ t.name || t.id }}{{ t.has_work ? ' (busy)' : '' }}{{ t.running === false ? ' (stopped)' : '' }}
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Optional fields -->
      <div class="form-group">
        <label>Molecule (optional)</label>
        <input v-model="form.molecule" type="text" class="form-input" placeholder="Molecule name..." />
      </div>

      <div class="form-group">
        <label>Quality (optional)</label>
        <input v-model="form.quality" type="text" class="form-input" placeholder="Formula quality level..." />
      </div>

      <!-- Error display -->
      <div v-if="error" class="sling-error">
        <span class="material-icons">{{ errorIcon }}</span>
        <div class="sling-error-content">
          <div class="sling-error-title">{{ errorTitle }}</div>
          <div class="sling-error-message">{{ error }}</div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="visible = false">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">send</span>
          {{ submitting ? 'Slinging...' : 'Sling' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import Autocomplete from '../shared/Autocomplete.vue'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useUiStore } from '../../stores/uiStore'

const api = useApi()
const toast = useToast()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'sling',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const form = reactive({
  bead: '',
  target: '',
  molecule: '',
  quality: '',
})

const targetsLoading = ref(false)
const targets = ref([])
const submitting = ref(false)
const error = ref(null)
const errorTitle = ref('')
const errorIcon = ref('error')

const targetGroups = computed(() => {
  const groups = {
    global: { label: 'Global Agents', targets: [] },
    rig: { label: 'Rigs (auto-spawn polecat)', targets: [] },
    agent: { label: 'Running Agents', targets: [] },
  }
  targets.value.forEach(t => {
    const type = t.type || 'agent'
    if (groups[type]) {
      groups[type].targets.push(t)
    } else {
      groups.agent.targets.push(t)
    }
  })
  return Object.values(groups).filter(g => g.targets.length > 0)
})

async function searchBeads(query) {
  const [beads, formulas] = await Promise.all([
    api.searchBeads(query).catch(() => []),
    api.searchFormulas(query).catch(() => []),
  ])
  return [
    ...beads.map(b => ({ ...b, type: 'bead' })),
    ...formulas.map(f => ({ ...f, type: 'formula', id: f.name })),
  ]
}

function onBeadSelect(item) {
  form.bead = item.id || item.name || ''
}

async function loadTargets() {
  targetsLoading.value = true
  try {
    targets.value = await api.getTargets()
  } catch {
    targets.value = []
  } finally {
    targetsLoading.value = false
  }
}

async function handleSubmit() {
  if (!form.bead || !form.target) {
    toast.warning('Please enter both bead and target')
    return
  }

  error.value = null
  submitting.value = true

  try {
    const result = await api.sling(form.bead, form.target, {
      molecule: form.molecule || undefined,
      quality: form.quality || undefined,
    })
    toast.success(`Work slung: ${form.bead} → ${form.target}`)
    visible.value = false
  } catch (err) {
    if (err.errorType === 'formula_missing') {
      errorTitle.value = 'Formula Not Found'
      errorIcon.value = 'warning'
      error.value = err.errorData?.hint || err.message
    } else if (err.errorType === 'bead_missing') {
      errorTitle.value = 'Bead Not Found'
      errorIcon.value = 'search_off'
      error.value = err.errorData?.hint || err.message
    } else {
      errorTitle.value = 'Sling Failed'
      errorIcon.value = 'error'
      error.value = err.message
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.bead = ''
  form.target = ''
  form.molecule = ''
  form.quality = ''
  error.value = null
}

// Pre-fill from modal data
watch(visible, (v) => {
  if (v) {
    const data = uiStore.modalData || {}
    if (data.bead) form.bead = data.bead
    if (data.target) form.target = data.target
    loadTargets()
  }
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
.form-select {
  cursor: pointer;
}
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

.sling-error {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid var(--accent-danger);
  border-radius: var(--radius-md);
  margin-top: var(--space-md);
}
.sling-error > .material-icons {
  color: var(--accent-danger);
  flex-shrink: 0;
}
.sling-error-title {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--accent-danger);
}
.sling-error-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-xxs);
}

.bead-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
}
.bead-item.formula .bead-icon {
  font-size: var(--text-base);
}
.bead-id {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--accent-primary);
}
.bead-title,
.bead-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bead-status {
  margin-left: auto;
  font-size: var(--text-xs);
  padding: 1px var(--space-xs);
  border-radius: var(--radius-sm);
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
