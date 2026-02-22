<template>
  <div class="error-state">
    <span class="material-icons error-state-icon">error_outline</span>
    <p class="error-state-message">{{ message }}</p>
    <button v-if="retry" class="btn btn-secondary btn-sm" @click="$emit('retry')">
      <span class="material-icons">refresh</span>
      Retry
    </button>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: 'Something went wrong' },
  retry: { type: Boolean, default: true },
})

defineEmits(['retry'])
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xxl);
  color: var(--text-secondary);
}
.error-state-icon {
  font-size: 48px;
  color: var(--accent-danger);
  opacity: 0.6;
}
.error-state-message {
  font-size: var(--text-sm);
  color: var(--accent-danger);
}
</style>
