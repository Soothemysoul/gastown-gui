<template>
  <BaseModal
    :show="isOpen('convoy-detail')"
    title=""
    size="md"
    @close="close"
  >
    <template #header>
      <h2>Convoy: {{ convoyId }}</h2>
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
    <div v-else-if="convoy" class="detail-grid">
      <div class="detail-item">
        <label>ID</label>
        <span>{{ convoyId }}</span>
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
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'
import { useApi } from '../../composables/useApi'

const { isOpen, modalData, close } = useModal()
const api = useApi()

const loading = ref(false)
const error = ref(null)
const convoy = ref(null)

const convoyId = computed(() => modalData.value?.convoyId || '')

watch(() => isOpen('convoy-detail'), async (open) => {
  if (!open) return
  const id = modalData.value?.convoyId
  if (!id) return

  loading.value = true
  error.value = null
  convoy.value = null

  try {
    convoy.value = await api.getConvoy(id)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleString()
}
</script>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  justify-content: center;
  padding: var(--space-xl);
  color: var(--text-muted);
}
.error-state {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  justify-content: center;
  padding: var(--space-xl);
  color: var(--accent-danger);
}
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
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.issue-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.issue-list li {
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
