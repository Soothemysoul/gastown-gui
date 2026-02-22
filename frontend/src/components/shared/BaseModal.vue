<template>
  <Teleport to="#modal-target">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="onOverlayClick">
        <div class="modal" :class="[sizeClass]" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>
              <span v-if="icon" class="material-icons modal-title-icon">{{ icon }}</span>
              {{ title }}
            </h2>
            <button class="modal-close" @click="close" aria-label="Close">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  icon: { type: String, default: null },
  size: { type: String, default: 'default', validator: v => ['default', 'lg', 'xl'].includes(v) },
  persistent: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close'])

const sizeClass = computed(() => {
  if (props.size === 'lg') return 'modal-lg'
  if (props.size === 'xl') return 'modal-xl'
  return ''
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onOverlayClick() {
  if (!props.persistent) {
    close()
  }
}

// Escape key
watch(() => props.modelValue, (visible) => {
  if (visible) {
    const handler = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    // Store cleanup ref
    const unwatch = watch(() => props.modelValue, (v) => {
      if (!v) {
        document.removeEventListener('keydown', handler)
        unwatch()
      }
    })
  }
})
</script>

<style scoped>
.modal-title-icon {
  margin-right: var(--space-sm);
  vertical-align: middle;
  font-size: var(--text-xl);
}

.modal-xl {
  max-width: 900px;
  width: 95%;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-fast);
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform var(--transition-fast);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(-8px);
}
</style>
