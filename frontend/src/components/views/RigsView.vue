<template>
  <div class="view rigs-view">
    <div class="view-header">
      <h1>Rigs</h1>
      <div class="view-header-actions">
        <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-rig')">
          <span class="material-icons">add</span>
          Add Rig
        </button>
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="loading && !rigs.length" message="Loading rigs..." />
    <ErrorState v-else-if="error && !rigs.length" :message="error" @retry="refresh" />
    <EmptyState
      v-else-if="!rigs.length"
      icon="folder_off"
      message="No rigs found. Add a rig to get started."
    >
      <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-rig')">
        <span class="material-icons">add</span>
        Add Rig
      </button>
    </EmptyState>
    <div v-else class="rig-list">
      <RigCard
        v-for="rig in rigs"
        :key="rig.name"
        :rig="rig"
        @park="handlePark"
        @boot="handleBoot"
        @remove="handleRemove"
        @peek="handlePeek"
        @start-agent="handleStartAgent"
        @stop-agent="handleStopAgent"
        @restart-agent="handleRestartAgent"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStatusStore } from '../../stores/statusStore'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { useToast } from '../../composables/useToast'
import { api } from '../../composables/useApi'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import RigCard from './RigCard.vue'

const statusStore = useStatusStore()
const uiStore = useUiStore()
const toast = useToast()
const loading = ref(false)
const error = ref(null)
const rigs = ref([])

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const data = await api.getRigs()
    rigs.value = data || []
  } catch (err) {
    error.value = err.message
    // Fallback to status store rigs
    if (statusStore.rigs.length) {
      rigs.value = statusStore.rigs
    }
  } finally {
    loading.value = false
  }
}

async function handlePark(rigName) {
  try {
    await api.parkRig(rigName)
    toast.success(`Rig "${rigName}" parked`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to park: ${err.message}`)
  }
}

async function handleBoot(rigName) {
  try {
    await api.bootRig(rigName)
    toast.success(`Rig "${rigName}" booted`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to boot: ${err.message}`)
  }
}

async function handleRemove(rigName) {
  if (!confirm(`Remove rig "${rigName}"? This will not delete any files.`)) return
  try {
    await api.removeRig(rigName)
    toast.success(`Rig "${rigName}" removed`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to remove: ${err.message}`)
  }
}

function handlePeek(agentId) {
  uiStore.openModal('agent-peek', { agentId })
}

async function handleStartAgent(rig, name) {
  try {
    await api.startAgent(rig, name)
    toast.success(`Started ${rig}/${name}`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to start: ${err.message}`)
  }
}

async function handleStopAgent(rig, name) {
  try {
    await api.stopAgent(rig, name)
    toast.success(`Stopped ${rig}/${name}`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to stop: ${err.message}`)
  }
}

async function handleRestartAgent(rig, name) {
  try {
    await api.restartAgent(rig, name)
    toast.success(`Restarted ${rig}/${name}`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to restart: ${err.message}`)
  }
}

const polling = usePolling(refresh, 15000)

onMounted(async () => {
  await refresh()
  polling.start()
})
</script>

<style scoped>
.rigs-view {
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

.rig-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
