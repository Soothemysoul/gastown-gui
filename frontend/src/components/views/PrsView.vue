<template>
  <div class="view prs-view">
    <div class="view-header">
      <h1>Pull Requests</h1>
      <div class="view-header-actions">
        <FilterGroup
          v-model:modelValue="stateFilter"
          :options="stateOptions"
        />
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="loading && !prs.length" message="Loading pull requests..." />
    <ErrorState v-else-if="error && !prs.length" :message="error" @retry="refresh" />
    <EmptyState
      v-else-if="!prs.length"
      icon="merge_type"
      :message="`No ${stateFilter} pull requests found`"
    />
    <div v-else class="pr-list">
      <PrItem
        v-for="pr in prs"
        :key="`${pr.repo}-${pr.number}`"
        :pr="pr"
        @detail="handleDetail"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { usePolling } from '../../composables/usePolling'
import { api } from '../../composables/useApi'
import FilterGroup from '../shared/FilterGroup.vue'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import PrItem from './PrItem.vue'

const loading = ref(false)
const error = ref(null)
const prs = ref([])
const stateFilter = ref('open')

const stateOptions = [
  { value: 'open', label: 'Open' },
  { value: 'merged', label: 'Merged' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
]

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const data = await api.getGitHubPRs(stateFilter.value)
    prs.value = data || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

watch(stateFilter, () => refresh())

function handleDetail(pr) {
  if (pr.url) window.open(pr.url, '_blank')
}

const polling = usePolling(refresh, 30000)

onMounted(async () => {
  await refresh()
  polling.start()
})
</script>

<style scoped>
.prs-view {
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

.pr-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
