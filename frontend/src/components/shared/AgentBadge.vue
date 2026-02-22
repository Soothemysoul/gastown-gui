<template>
  <span class="agent-badge" :style="{ color: config.color }">
    <span class="material-icons agent-badge-icon">{{ config.icon }}</span>
    <span class="agent-badge-name">{{ displayName }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getAgentConfig, formatAgentName } from '../../constants/agent-types'

const props = defineProps({
  agentPath: { type: String, default: '' },
  role: { type: String, default: null },
})

const config = computed(() => getAgentConfig(props.agentPath, props.role))
const displayName = computed(() => formatAgentName(props.agentPath))
</script>

<style scoped>
.agent-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  font-weight: 500;
}
.agent-badge-icon {
  font-size: 14px;
}
.agent-badge-name {
  white-space: nowrap;
}
</style>
