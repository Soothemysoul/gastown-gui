<template>
  <BaseModal
    v-model="visible"
    title=""
    size="lg"
    @close="onClose"
  >
    <template #header>
      <h2>
        <span class="material-icons">local_shipping</span>
        Convoy: {{ convoyTitle }}
      </h2>
    </template>

    <!-- Loading state -->
    <div v-if="loading" class="loading-center">
      <span class="material-icons spinning">sync</span>
      Loading convoy details...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>Failed to load convoy: {{ error }}</p>
    </div>

    <!-- Loaded content -->
    <template v-else-if="convoy">
      <div class="detail-grid">
        <div class="detail-item">
          <label>ID</label>
          <code>{{ convoyId }}</code>
        </div>
        <div class="detail-item">
          <label>Status</label>
          <span class="status-badge" :class="'status-' + (convoy.status || 'pending')">
            {{ convoy.status || 'pending' }}
          </span>
        </div>
        <div class="detail-item">
          <label>Created</label>
          <span>{{ formatDate(convoy.created_at) }}</span>
        </div>
        <div v-if="convoy.issues?.length" class="detail-item full-width">
          <label>Issues</label>
          <ul class="issue-list">
            <li v-for="(issue, idx) in convoy.issues" :key="idx">
              {{ typeof issue === 'string' ? issue : issue.title }}
            </li>
          </ul>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { useUiStore } from '../../stores/uiStore'

const api = useApi()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'convoy-detail',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const loading = ref(false)
const error = ref(null)
const convoy = ref(null)

const convoyId = computed(() => uiStore.modalData?.convoyId || '')
const convoyTitle = computed(() => convoy.value?.name || convoy.value?.id || convoyId.value)

function formatDate(d) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleString()
}

function onClose() {
  convoy.value = null
  error.value = null
}

watch(visible, async (v) => {
  if (v && convoyId.value) {
    loading.value = true
    error.value = null
    try {
      convoy.value = await api.getConvoy(convoyId.value)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  } else if (!v) {
    onClose()
  }
})
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}
.detail-item.full-width {
  grid-column: 1 / -1;
}
.detail-item label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detail-item code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--accent-primary);
}
.issue-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.issue-list li {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-sm);
  border-left: 2px solid var(--border-default);
  margin-bottom: var(--space-xs);
}

.loading-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  color: var(--text-muted);
}
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  color: var(--accent-danger);
  text-align: center;
}
.error-state .material-icons {
  font-size: 36px;
}

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
