<template>
  <BaseModal
    v-model="visible"
    title="Agent Details"
    icon="smart_toy"
    @close="onClose"
  >
    <div class="agent-detail">
      <div class="agent-id-row">
        <span class="material-icons">badge</span>
        <code>{{ agentId }}</code>
      </div>
      <p class="agent-placeholder">Detailed agent view coming soon...</p>
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
.agent-id-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.agent-id-row code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--accent-primary);
}
.agent-id-row .material-icons {
  color: var(--text-muted);
}
.agent-placeholder {
  font-size: var(--text-sm);
  color: var(--text-muted);
}
</style>
