<template>
  <div class="autocomplete-wrapper" ref="wrapperRef">
    <input
      ref="inputRef"
      :value="modelValue"
      :placeholder="placeholder"
      class="autocomplete-input"
      autocomplete="off"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    />
    <div v-if="dropdownVisible" class="autocomplete-dropdown">
      <div v-if="loading" class="autocomplete-loading">
        <span class="material-icons spinning">sync</span> Searching...
      </div>
      <div v-else-if="items.length === 0" class="autocomplete-empty">
        No results found
      </div>
      <div
        v-for="(item, i) in items"
        v-else
        :key="item.id || item.name || i"
        class="autocomplete-item"
        :class="{ selected: i === selectedIndex }"
        @mousedown.prevent="selectItem(item)"
        @mouseenter="selectedIndex = i"
      >
        <slot name="item" :item="item">
          <span class="autocomplete-label">{{ item.label || item.name || item.id }}</span>
          <span v-if="item.description" class="autocomplete-desc">{{ item.description }}</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search...' },
  search: { type: Function, required: true },
  minChars: { type: Number, default: 2 },
  debounceMs: { type: Number, default: 200 },
})

const emit = defineEmits(['update:modelValue', 'select'])

const inputRef = ref(null)
const wrapperRef = ref(null)
const items = ref([])
const selectedIndex = ref(-1)
const dropdownVisible = ref(false)
const loading = ref(false)

let debounceTimer = null

function onInput(e) {
  const value = e.target.value
  emit('update:modelValue', value)

  if (value.trim().length < props.minChars) {
    hideDropdown()
    return
  }

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => doSearch(value.trim()), props.debounceMs)
}

async function doSearch(query) {
  loading.value = true
  dropdownVisible.value = true
  try {
    items.value = await props.search(query)
    selectedIndex.value = -1
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function onKeydown(e) {
  if (!dropdownVisible.value || items.value.length === 0) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, items.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      if (selectedIndex.value >= 0) {
        e.preventDefault()
        selectItem(items.value[selectedIndex.value])
      }
      break
    case 'Escape':
      hideDropdown()
      break
  }
}

function onFocus() {
  if (items.value.length > 0 && props.modelValue.length >= props.minChars) {
    dropdownVisible.value = true
  }
}

function onBlur() {
  // Delay to allow click on dropdown items
  setTimeout(hideDropdown, 150)
}

function selectItem(item) {
  emit('update:modelValue', item.id || item.name || '')
  emit('select', item)
  hideDropdown()
}

function hideDropdown() {
  dropdownVisible.value = false
  selectedIndex.value = -1
}

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
})

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped>
.autocomplete-wrapper {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  outline: none;
  transition: border-color var(--transition-fast);
}
.autocomplete-input:focus {
  border-color: var(--accent-primary);
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  margin-top: var(--space-xxs);
  max-height: 240px;
  overflow-y: auto;
  box-shadow: var(--shadow-md);
}

.autocomplete-item {
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  transition: background var(--transition-fast);
}
.autocomplete-item:hover,
.autocomplete-item.selected {
  background: var(--bg-hover);
}

.autocomplete-label {
  color: var(--text-primary);
  font-size: var(--text-sm);
}
.autocomplete-desc {
  color: var(--text-muted);
  font-size: var(--text-xs);
  margin-left: auto;
}

.autocomplete-empty,
.autocomplete-loading {
  padding: var(--space-sm) var(--space-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: center;
}
.autocomplete-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
