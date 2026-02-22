<template>
  <BaseModal
    v-model="visible"
    title="Convoy Details"
    icon="local_shipping"
    size="lg"
    @close="onClose"
  >
    <template #header>
      <h2>
        <span class="material-icons modal-title-icon">local_shipping</span>
        Convoy: {{ convoyName }}
      </h2>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons spinning">sync</span>
      Loading convoy details...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>Failed to load convoy: {{ error }}</p>
    </div>

    <!-- Content -->
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

const convoy = ref(null)
const loading = ref(false)
const error = ref(null)

const convoyId = computed(() => uiStore.modalData?.convoyId || '')
const convoyName = computed(() => convoy.value?.name || convoy.value?.id || convoyId.value)

async function loadConvoy() {
  if (!convoyId.value) return
  loading.value = true
  error.value = null
  try {
    convoy.value = await api.getConvoy(convoyId.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function formatDate(d) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleString()
}

function onClose() {
  convoy.value = null
  error.value = null
}

watch(visible, (v) => {
  if (v) loadConvoy()
  else onClose()
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
.detail-item.full-width {
  grid-column: 1 / -1;
}
.issue-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.issue-list li {
  padding: var(--space-xs) var(--space-sm);
  border-left: 2px solid var(--border-default);
  margin-bottom: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  color: var(--text-muted);
  text-align: center;
}
.error-state .material-icons {
  font-size: 48px;
  color: var(--accent-danger);
}

.status-badge {
  display: inline-block;
  padding: var(--space-xxs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
