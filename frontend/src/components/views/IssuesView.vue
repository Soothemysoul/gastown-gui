<template>
  <div class="view issues-view">
    <div class="view-header">
      <h1>Issues</h1>
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

    <LoadingState v-if="loading && !issues.length" message="Loading issues..." />
    <ErrorState v-else-if="error && !issues.length" :message="error" @retry="refresh" />
    <EmptyState
      v-else-if="!issues.length"
      icon="bug_report"
      :message="`No ${stateFilter} issues found`"
    />
    <div v-else class="issue-list">
      <IssueItem
        v-for="issue in issues"
        :key="`${issue.repo}-${issue.number}`"
        :issue="issue"
        @sling="handleSling"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { api } from '../../composables/useApi'
import FilterGroup from '../shared/FilterGroup.vue'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import IssueItem from './IssueItem.vue'

const uiStore = useUiStore()
const loading = ref(false)
const error = ref(null)
const issues = ref([])
const stateFilter = ref('open')

const stateOptions = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
]

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const data = await api.getGitHubIssues(stateFilter.value)
    issues.value = data || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

watch(stateFilter, () => refresh())

function handleSling(issue) {
  uiStore.openModal('sling', { bead: `gh:${issue.repo}#${issue.number}` })
}

const polling = usePolling(refresh, 30000)

onMounted(async () => {
  await refresh()
  polling.start()
})
</script>

<style scoped>
.issues-view {
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

.issue-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
