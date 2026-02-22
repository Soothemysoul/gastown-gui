<template>
  <div class="view convoys-view">
    <div class="view-header">
      <h1>Convoys</h1>
      <div class="view-header-actions">
        <FilterGroup
          v-model:modelValue="filterValue"
          :options="filterOptions"
        />
        <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-convoy')">
          <span class="material-icons">add</span>
          New Convoy
        </button>
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: convoyStore.loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="convoyStore.loading && !convoyStore.convoys.length" message="Loading convoys..." />
    <ErrorState v-else-if="convoyStore.error && !convoyStore.convoys.length" :message="convoyStore.error" @retry="refresh" />
    <EmptyState
      v-else-if="!displayConvoys.length"
      icon="local_shipping"
      message="No convoys found"
    >
      <button class="btn btn-primary btn-sm" @click="uiStore.openModal('new-convoy')">
        <span class="material-icons">add</span>
        New Convoy
      </button>
    </EmptyState>
    <div v-else class="convoy-list">
      <ConvoyCard
        v-for="convoy in displayConvoys"
        :key="convoy.id"
        :convoy="convoy"
        @sling="handleSling"
        @escalate="handleEscalate"
        @view="handleView"
        @issue-detail="handleIssueDetail"
        @nudge="handleNudge"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useConvoyStore } from '../../stores/convoyStore'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { useToast } from '../../composables/useToast'
import { api } from '../../composables/useApi'
import FilterGroup from '../shared/FilterGroup.vue'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import ConvoyCard from './ConvoyCard.vue'

const convoyStore = useConvoyStore()
const uiStore = useUiStore()
const toast = useToast()

const filterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
]

const filterValue = computed({
  get: () => convoyStore.showAll ? 'all' : 'active',
  set: (val) => {
    convoyStore.setFilter(val === 'all')
    convoyStore.fetchConvoys()
  },
})

const displayConvoys = computed(() => convoyStore.displayConvoys)

async function refresh() {
  await convoyStore.fetchConvoys()
}

function handleSling(convoyId) {
  uiStore.openModal('sling', { convoyId })
}

function handleEscalate(convoyId, convoyName) {
  uiStore.openModal('escalate', { convoyId, convoyName })
}

function handleView(convoyId) {
  uiStore.openModal('convoy-detail', { convoyId })
}

function handleIssueDetail(issueId) {
  if (issueId) uiStore.openModal('issue-detail', { issueId })
}

function handleNudge(workerId) {
  uiStore.openModal('nudge', { agentId: workerId })
}

const polling = usePolling(refresh, 10000)

onMounted(async () => {
  await convoyStore.fetchConvoys()
  polling.start()
})
</script>

<style scoped>
.convoys-view {
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

.convoy-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
