<template>
  <span class="status-badge" :class="`status-${status}`">
    <span class="material-icons status-badge-icon">{{ icon }}</span>
    <span v-if="showLabel" class="status-badge-label">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { STATUS_ICONS } from '../../constants/agent-types'
import { capitalize } from '../../utils/html'

const props = defineProps({
  status: { type: String, default: 'idle' },
  showLabel: { type: Boolean, default: true },
})

const icon = computed(() => STATUS_ICONS[props.status] || 'help')
const label = computed(() => capitalize(props.status))
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: 500;
}
.status-badge-icon {
  font-size: 14px;
}
.status-running { color: var(--status-running); }
.status-working { color: var(--status-working); }
.status-idle { color: var(--status-idle); }
.status-error { color: var(--status-stuck); }
.status-complete { color: var(--status-done); }
.status-stopped { color: var(--status-idle); }
</style>
