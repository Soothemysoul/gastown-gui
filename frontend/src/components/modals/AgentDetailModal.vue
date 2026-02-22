<template>
  <BaseModal
    v-model="visible"
    title="Agent Details"
    @close="onClose"
  >
    <div class="agent-detail">
      <div class="detail-item">
        <label>Agent ID</label>
        <code>{{ agentId }}</code>
      </div>
      <p class="coming-soon">Detailed agent view coming soon...</p>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/uiStore'

const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'agent-detail',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const agentId = computed(() => uiStore.modalData?.agentId || '')

function onClose() {
  // no-op
}
</script>

<style scoped>
.agent-detail {
  display: flex;
  flex-direction: column;
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
.coming-soon {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
}
</style>
