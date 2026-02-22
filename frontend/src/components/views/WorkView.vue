<template>
  <div class="view work-view">
    <div class="view-header">
      <h1>Work</h1>
      <div class="view-header-actions">
        <FilterGroup
          v-model:modelValue="filterValue"
          :options="filterOptions"
        />
        <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-bead')">
          <span class="material-icons">add</span>
          New Bead
        </button>
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: workStore.loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="workStore.loading && !workStore.beads.length" message="Loading work items..." />
    <ErrorState v-else-if="workStore.error && !workStore.beads.length" :message="workStore.error" @retry="refresh" />
    <EmptyState
      v-else-if="!filteredBeads.length"
      icon="task_alt"
      message="No work items found"
    >
      <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-bead')">
        <span class="material-icons">add</span>
        New Bead
      </button>
    </EmptyState>
    <div v-else class="work-list">
      <WorkItem
        v-for="bead in filteredBeads"
        :key="bead.id"
        :bead="bead"
        @detail="handleDetail"
        @action="handleAction"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useWorkStore } from '../../stores/workStore'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { useToast } from '../../composables/useToast'
import FilterGroup from '../shared/FilterGroup.vue'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import WorkItem from './WorkItem.vue'

const workStore = useWorkStore()
const uiStore = useUiStore()
const toast = useToast()

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

const filterValue = computed({
  get: () => workStore.filter,
  set: (val) => {
    workStore.setFilter(val)
    workStore.fetchBeads()
  },
})

const HIDDEN_TYPES = ['message', 'convoy', 'agent', 'gate', 'role', 'event', 'slot']

const filteredBeads = computed(() =>
  workStore.beads.filter(b => !HIDDEN_TYPES.includes(b.issue_type)),
)

async function refresh() {
  await workStore.fetchBeads()
}

function handleDetail(beadId, bead) {
  uiStore.openModal('bead-detail', { beadId, bead })
}

async function handleAction(action, beadId) {
  try {
    switch (action) {
      case 'done': {
        const summary = prompt('Enter completion summary (optional):')
        if (summary === null) return
        await workStore.markDone(beadId, summary || 'Completed via GUI')
        toast.success(`Work completed: ${beadId}`)
        break
      }
      case 'park': {
        const reason = prompt('Enter reason for parking:')
        if (!reason) return
        await workStore.park(beadId, reason)
        toast.success(`Work parked: ${beadId}`)
        break
      }
      case 'release': {
        if (!confirm('Release this work item?')) return
        await workStore.release(beadId)
        toast.success(`Work released: ${beadId}`)
        break
      }
      case 'reassign': {
        const target = prompt('Enter target agent address:')
        if (!target) return
        await workStore.reassign(beadId, target)
        toast.success(`Work reassigned: ${beadId}`)
        break
      }
    }
  } catch (err) {
    toast.error(`Error: ${err.message}`)
  }
}

const polling = usePolling(refresh, 10000)

onMounted(async () => {
  await workStore.fetchBeads()
  polling.start()
})
</script>

<style scoped>
.work-view {
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

.work-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
