<template>
  <div class="view agents-view">
    <div class="view-header">
      <h1>Agents</h1>
      <div class="view-header-actions">
        <FilterGroup
          v-model:modelValue="roleFilter"
          :options="roleFilterOptions"
        />
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: agentStore.loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="agentStore.loading && !agentStore.agents.length" message="Loading agents..." />
    <ErrorState v-else-if="agentStore.error && !agentStore.agents.length" :message="agentStore.error" @retry="refresh" />
    <EmptyState
      v-else-if="!filteredAgents.length"
      icon="group"
      message="No agents found"
    />
    <div v-else class="agent-grid">
      <AgentCard
        v-for="agent in filteredAgents"
        :key="agent.id || agent.address"
        :agent="agent"
        @detail="handleDetail"
        @nudge="handleNudge"
        @start="handleStart"
        @stop="handleStop"
        @restart="handleRestart"
        @peek="handlePeek"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAgentStore } from '../../stores/agentStore'
import { useStatusStore } from '../../stores/statusStore'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { useToast } from '../../composables/useToast'
import { getAgentType } from '../../constants/agent-types'
import FilterGroup from '../shared/FilterGroup.vue'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import AgentCard from './AgentCard.vue'

const agentStore = useAgentStore()
const statusStore = useStatusStore()
const uiStore = useUiStore()
const toast = useToast()

const roleFilter = ref('all')

const roleFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'polecat', label: 'Polecats' },
  { value: 'mayor', label: 'Mayor' },
  { value: 'witness', label: 'Witness' },
  { value: 'refinery', label: 'Refinery' },
]

// Combine agents from both agentStore and statusStore rigs
const allAgents = computed(() => {
  const fromStore = agentStore.agents
  if (fromStore.length) return fromStore
  // Fallback: extract from status rigs
  return statusStore.rigs.flatMap(rig =>
    (rig.agents || []).map(a => ({
      ...a,
      id: a.id || `${rig.name}/${a.name}`,
      address: a.address || `${rig.name}/${a.name}`,
    })),
  )
})

const filteredAgents = computed(() => {
  if (roleFilter.value === 'all') return allAgents.value
  return allAgents.value.filter(a => {
    const type = getAgentType(a.address || a.id, a.role)
    return type === roleFilter.value
  })
})

async function refresh() {
  await Promise.all([
    agentStore.fetchAgents(),
    statusStore.fetchStatus(),
  ])
}

function handleDetail(agentId) {
  uiStore.openModal('agent-detail', { agentId })
}

function handleNudge(agentId) {
  uiStore.openModal('nudge', { agentId })
}

async function handleStart(rig, name) {
  try {
    await agentStore.startAgent(rig, name)
    toast.success(`Started ${name}`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to start: ${err.message}`)
  }
}

async function handleStop(rig, name) {
  try {
    await agentStore.stopAgent(rig, name)
    toast.success(`Stopped ${name}`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to stop: ${err.message}`)
  }
}

async function handleRestart(rig, name) {
  try {
    await agentStore.restartAgent(rig, name)
    toast.success(`Restarted ${name}`)
    await refresh()
  } catch (err) {
    toast.error(`Failed to restart: ${err.message}`)
  }
}

function handlePeek(agentId) {
  uiStore.openModal('agent-peek', { agentId })
}

const polling = usePolling(refresh, 10000)

onMounted(async () => {
  await refresh()
  polling.start()
})
</script>

<style scoped>
.agents-view {
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

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
