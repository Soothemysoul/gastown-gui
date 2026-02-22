<template>
  <div class="formula-card">
    <div class="formula-header">
      <div class="formula-icon">
        <span class="material-icons">science</span>
      </div>
      <div class="formula-info">
        <h3 class="formula-name">{{ formula.name }}</h3>
        <p class="formula-description">{{ formula.description || 'No description' }}</p>
      </div>
    </div>
    <div class="formula-template">
      <code>{{ templatePreview }}</code>
    </div>
    <div class="formula-actions">
      <button class="btn btn-sm btn-secondary" title="View full template" @click="$emit('view', formula)">
        <span class="material-icons">visibility</span>
        View
      </button>
      <button class="btn btn-sm btn-secondary" title="Edit formula" @click="$emit('edit', formula)">
        <span class="material-icons">edit</span>
        Edit
      </button>
      <button class="btn btn-sm btn-primary" title="Use this formula" @click="$emit('use', formula)">
        <span class="material-icons">play_arrow</span>
        Use
      </button>
      <button class="btn btn-sm btn-icon btn-danger-ghost" title="Delete formula" @click="$emit('delete', formula.name)">
        <span class="material-icons">delete</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  formula: { type: Object, required: true },
})

defineEmits(['view', 'edit', 'use', 'delete'])

const templatePreview = computed(() => {
  const t = props.formula.template
  if (!t) return 'No template'
  return t.length > 100 ? t.substring(0, 100) + '...' : t
})
</script>

<style scoped>
.formula-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.formula-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}
.formula-icon .material-icons {
  font-size: 24px;
  color: #a855f7;
}
.formula-info { flex: 1; min-width: 0; }
.formula-name {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}
.formula-description {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

.formula-template {
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-sm);
}
.formula-template code {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  word-break: break-all;
}

.formula-actions {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  border-top: 1px solid var(--border-default);
  padding-top: var(--space-sm);
}
</style>
