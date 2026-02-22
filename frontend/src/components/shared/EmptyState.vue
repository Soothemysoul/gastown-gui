<template>
  <div class="empty-state">
    <span class="material-icons empty-state-icon">{{ icon }}</span>
    <p class="empty-state-message">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'inbox' },
  message: { type: String, default: 'Nothing here yet' },
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xxl);
  color: var(--text-muted);
}
.empty-state-icon {
  font-size: 48px;
  opacity: 0.4;
}
.empty-state-message {
  font-size: var(--text-sm);
}
</style>
