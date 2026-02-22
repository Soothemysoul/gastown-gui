<template>
  <div class="view crews-view">
    <div class="view-header">
      <h1>Crews</h1>
      <div class="view-header-actions">
        <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-crew')">
          <span class="material-icons">group_add</span>
          New Crew
        </button>
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="loading && !crews.length" message="Loading crews..." />
    <ErrorState v-else-if="error && !crews.length" :message="error" @retry="refresh" />
    <EmptyState
      v-else-if="!crews.length"
      icon="group_off"
      message="No crews found. Create a crew to group polecats."
    >
      <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-crew')">
        <span class="material-icons">group_add</span>
        Create First Crew
      </button>
    </EmptyState>
    <div v-else class="crew-grid">
      <CrewCard
        v-for="crew in crews"
        :key="crew.name"
        :crew="crew"
        @status="handleStatus"
        @remove="handleRemove"
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
import CrewCard from './CrewCard.vue'

const uiStore = useUiStore()
const toast = useToast()
const loading = ref(false)
const error = ref(null)
const crews = ref([])

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const data = await api.getCrews()
    crews.value = data || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleStatus(name) {
  try {
    const status = await api.getCrewStatus(name)
    uiStore.openModal('crew-status', { name, status })
  } catch (err) {
    toast.error(`Failed to get crew status: ${err.message}`)
  }
}

async function handleRemove(name) {
  if (!confirm(`Remove crew "${name}"?`)) return
  try {
    await api.removeCrew(name)
    toast.success(`Crew "${name}" removed`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to remove: ${err.message}`)
  }
}

const polling = usePolling(refresh, 15000)

onMounted(async () => {
  await refresh()
  polling.start()
})
</script>

<style scoped>
.crews-view {
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

.crew-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
