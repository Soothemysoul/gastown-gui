<template>
  <div class="filter-group">
    <button
      v-for="option in options"
      :key="option.value"
      class="filter-btn"
      :class="{ active: modelValue === option.value }"
      @click="$emit('update:modelValue', option.value)"
    >
      <span v-if="option.icon" class="material-icons">{{ option.icon }}</span>
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  options: {
    type: Array,
    required: true,
    // Each item: { value: string, label: string, icon?: string }
  },
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.filter-group {
  display: flex;
  gap: var(--space-xs);
}
.filter-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.filter-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.filter-btn.active {
  color: white;
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}
.filter-btn .material-icons {
  font-size: 16px;
}
</style>
