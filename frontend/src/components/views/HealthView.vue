<template>
  <div class="view health-view">
    <div class="view-header">
      <h1>Health</h1>
      <div class="view-header-actions">
        <button class="btn btn-primary btn-sm" :disabled="loading" @click="refresh">
          <span class="material-icons" :class="{ spin: loading }">{{ loading ? 'sync' : 'refresh' }}</span>
          {{ loading ? 'Running...' : 'Run Doctor' }}
        </button>
      </div>
    </div>

    <LoadingState v-if="loading && !checks.length" message="Running health diagnostics... (this may take 15-20 seconds)" />
    <ErrorState v-else-if="error && !checks.length" :message="error" @retry="refresh" />
    <EmptyState
      v-else-if="!checks.length && !loading"
      icon="health_and_safety"
      message="No health data yet. Run the doctor to check system health."
    >
      <button class="btn btn-primary btn-sm" @click="refresh">
        <span class="material-icons">play_arrow</span>
        Run Doctor
      </button>
    </EmptyState>

    <template v-if="checks.length">
      <!-- Summary banner -->
      <div class="health-summary" :class="`health-${overallStatus}`">
        <div class="health-summary-icon">
          <span class="material-icons">{{ statusConfig[overallStatus].icon }}</span>
        </div>
        <div class="health-summary-info">
          <h2>{{ statusConfig[overallStatus].label }}</h2>
          <div class="health-summary-stats">
            <span class="health-stat pass">
              <span class="material-icons">check_circle</span>
              {{ passCount }} Passed
            </span>
            <span class="health-stat warn">
              <span class="material-icons">warning</span>
              {{ warnCount }} Warnings
            </span>
            <span class="health-stat fail">
              <span class="material-icons">error</span>
              {{ failCount }} Errors
            </span>
          </div>
        </div>
        <div class="health-summary-actions">
          <button
            v-if="hasFixableIssues"
            class="btn btn-primary btn-sm"
            :disabled="fixing"
            @click="handleFixAll"
          >
            <span class="material-icons" :class="{ spin: fixing }">{{ fixing ? 'sync' : 'build' }}</span>
            {{ fixing ? 'Fixing...' : 'Fix All Issues' }}
          </button>
        </div>
      </div>

      <!-- Filter buttons -->
      <div class="health-filters">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          class="health-filter-btn"
          :class="{ active: currentFilter === opt.value }"
          @click="currentFilter = opt.value"
        >
          <span v-if="opt.icon" class="material-icons">{{ opt.icon }}</span>
          {{ opt.label }} ({{ opt.count }})
        </button>
      </div>

      <!-- Check items -->
      <div class="health-checks">
        <div
          v-for="check in filteredChecks"
          :key="check.id || check.name"
          class="health-check-item"
          :class="`health-${check.status}`"
        >
          <div class="health-check-status" :style="{ color: checkConfig(check.status).color }">
            <span class="material-icons">{{ checkConfig(check.status).icon }}</span>
          </div>
          <div class="health-check-content">
            <div class="health-check-header">
              <span class="health-check-name">{{ check.name }}</span>
              <span class="health-check-label" :style="{ background: checkConfig(check.status).color }">
                {{ checkConfig(check.status).label }}
              </span>
            </div>
            <div class="health-check-description">{{ check.description }}</div>
            <div v-if="check.details?.length" class="health-check-details">
              <div v-for="(d, i) in check.details.slice(0, 5)" :key="i" class="health-detail-line">{{ d }}</div>
              <div v-if="check.details.length > 5" class="health-detail-more">
                ... and {{ check.details.length - 5 }} more
              </div>
            </div>
            <div v-if="check.fix" class="health-check-fix">
              <span class="material-icons">arrow_forward</span>
              <code>{{ check.fix }}</code>
              <button class="btn btn-sm btn-ghost" title="Copy command" @click="copyFix(check.fix)">
                <span class="material-icons">content_copy</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="!filteredChecks.length" class="health-empty">
          <span class="material-icons">filter_list</span>
          <p>No {{ currentFilter === 'all' ? '' : currentFilter }} checks to display.</p>
        </div>
      </div>

      <div class="health-footer">
        Last checked: {{ lastCheckedTime }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { api } from '../../composables/useApi'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'

const toast = useToast()
const loading = ref(false)
const fixing = ref(false)
const error = ref(null)
const checks = ref([])
const currentFilter = ref('all')
const lastCheckedTime = ref('')

const statusConfig = {
  pass: { icon: 'check_circle', label: 'All Systems Healthy', color: '#4caf50' },
  warn: { icon: 'warning', label: 'Some Warnings', color: '#ff9800' },
  fail: { icon: 'error', label: 'Issues Detected', color: '#f44336' },
}

function checkConfig(status) {
  return statusConfig[status] || statusConfig.warn
}

const passCount = computed(() => checks.value.filter(c => c.status === 'pass').length)
const warnCount = computed(() => checks.value.filter(c => c.status === 'warn').length)
const failCount = computed(() => checks.value.filter(c => c.status === 'fail').length)
const overallStatus = computed(() => failCount.value > 0 ? 'fail' : warnCount.value > 0 ? 'warn' : 'pass')
const hasFixableIssues = computed(() => checks.value.some(c => c.fix && (c.status === 'warn' || c.status === 'fail')))

const filterOptions = computed(() => [
  { value: 'all', label: 'All', count: checks.value.length },
  { value: 'fail', label: 'Errors', icon: 'error', count: failCount.value },
  { value: 'warn', label: 'Warnings', icon: 'warning', count: warnCount.value },
  { value: 'pass', label: 'Passed', icon: 'check_circle', count: passCount.value },
])

const filteredChecks = computed(() => {
  const items = currentFilter.value === 'all'
    ? checks.value
    : checks.value.filter(c => c.status === currentFilter.value)

  const sortOrder = { fail: 0, warn: 1, pass: 2 }
  return [...items].sort((a, b) => (sortOrder[a.status] ?? 3) - (sortOrder[b.status] ?? 3))
})

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const data = await api.runDoctor({ refresh: true })
    checks.value = data.checks || []
    lastCheckedTime.value = new Date().toLocaleTimeString()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleFixAll() {
  if (!confirm('Run "gt doctor --fix" to automatically fix issues?')) return
  fixing.value = true
  try {
    await api.runDoctorFix()
    toast.success('Doctor fix completed. Refreshing...')
    await refresh()
  } catch (err) {
    toast.error(`Fix failed: ${err.message}`)
  } finally {
    fixing.value = false
  }
}

async function copyFix(text) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Command copied to clipboard')
  } catch {
    toast.error('Failed to copy')
  }
}

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.health-view {
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

/* Summary */
.health-summary {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}
.health-pass { background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); }
.health-warn { background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); }
.health-fail { background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); }

.health-summary-icon .material-icons { font-size: 36px; }
.health-pass .health-summary-icon { color: #4caf50; }
.health-warn .health-summary-icon { color: #ff9800; }
.health-fail .health-summary-icon { color: #f44336; }

.health-summary-info { flex: 1; }
.health-summary-info h2 {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}
.health-summary-stats {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xs);
}
.health-stat {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: 500;
}
.health-stat .material-icons { font-size: 16px; }
.health-stat.pass { color: #4caf50; }
.health-stat.warn { color: #ff9800; }
.health-stat.fail { color: #f44336; }

/* Filters */
.health-filters {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}
.health-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.health-filter-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.health-filter-btn.active { color: white; background: var(--accent-primary); border-color: var(--accent-primary); }
.health-filter-btn .material-icons { font-size: 14px; }

/* Checks */
.health-checks {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.health-check-item {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.health-check-item.health-fail { border-left: 3px solid #f44336; }
.health-check-item.health-warn { border-left: 3px solid #ff9800; }
.health-check-item.health-pass { border-left: 3px solid #4caf50; }

.health-check-status .material-icons { font-size: 20px; }
.health-check-content { flex: 1; min-width: 0; }
.health-check-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.health-check-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}
.health-check-label {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  color: white;
  font-weight: 500;
}
.health-check-description {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}
.health-check-details {
  margin-top: var(--space-xs);
  padding: var(--space-xs);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-family: monospace;
}
.health-detail-line { padding: 1px 0; }
.health-detail-more { color: var(--text-muted); font-style: italic; }

.health-check-fix {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
}
.health-check-fix .material-icons { font-size: 14px; color: var(--text-muted); }
.health-check-fix code {
  flex: 1;
  padding: 2px var(--space-xs);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.health-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  color: var(--text-muted);
}

.health-footer {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
