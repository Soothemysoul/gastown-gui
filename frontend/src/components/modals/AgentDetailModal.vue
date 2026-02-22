<template>
  <BaseModal
    :show="isOpen('agent-detail')"
    title="Agent Details"
    size="sm"
    @close="close"
  >
    <div v-if="agentId" class="agent-info">
      <div class="agent-info-row">
        <span class="material-icons">person</span>
        <div>
          <div class="agent-label">Agent ID</div>
          <code class="agent-id">{{ agentId }}</code>
        </div>
      </div>
      <p class="agent-placeholder">Detailed agent view coming soon...</p>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'

const { isOpen, modalData, close } = useModal()

const agentId = computed(() => modalData.value?.agentId || '')
</script>

<style scoped>
.agent-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.agent-info-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.agent-info-row > .material-icons {
  font-size: 32px;
  color: var(--accent-primary);
}
.agent-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.agent-id {
  font-size: var(--text-base);
  color: var(--text-primary);
}
.agent-placeholder {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-style: italic;
}
</style>
