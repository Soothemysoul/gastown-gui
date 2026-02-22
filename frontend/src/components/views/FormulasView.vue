<template>
  <div class="view formulas-view">
    <div class="view-header">
      <h1>Formulas</h1>
      <div class="view-header-actions">
        <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-formula')">
          <span class="material-icons">add</span>
          New Formula
        </button>
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="loading && !formulas.length" message="Loading formulas..." />
    <ErrorState v-else-if="error && !formulas.length" :message="error" @retry="refresh" />
    <EmptyState
      v-else-if="!formulas.length"
      icon="science"
      message="No formulas found. Create workflow templates for repeatable tasks."
    >
      <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-formula')">
        <span class="material-icons">add</span>
        Create Formula
      </button>
    </EmptyState>
    <div v-else class="formula-list">
      <FormulaItem
        v-for="formula in formulas"
        :key="formula.name"
        :formula="formula"
        @view="handleView"
        @edit="handleEdit"
        @use="handleUse"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { useToast } from '../../composables/useToast'
import { api } from '../../composables/useApi'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import FormulaItem from './FormulaItem.vue'

const uiStore = useUiStore()
const toast = useToast()
const loading = ref(false)
const error = ref(null)
const formulas = ref([])

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const data = await api.getFormulas()
    formulas.value = data || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleView(formula) {
  try {
    const details = await api.getFormula(formula.name)
    uiStore.openModal('formula-detail', { formula: details })
  } catch (err) {
    toast.error(`Failed to load formula: ${err.message}`)
  }
}

function handleEdit(formula) {
  uiStore.openModal('formula-edit', { formula })
}

function handleUse(formula) {
  uiStore.openModal('formula-use', { formula })
}

async function handleDelete(name) {
  if (!confirm(`Delete formula "${name}"? This cannot be undone.`)) return
  try {
    await api.deleteFormula(name)
    toast.success(`Formula "${name}" deleted`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to delete: ${err.message}`)
  }
}

const polling = usePolling(refresh, 30000)

onMounted(async () => {
  await refresh()
  polling.start()
})
</script>

<style scoped>
.formulas-view {
  padding: var(--space-lg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
}
.view-header h1 {
  font-size: var(--text-lg);
  font-weight: 700;
}
.view-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.formula-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
