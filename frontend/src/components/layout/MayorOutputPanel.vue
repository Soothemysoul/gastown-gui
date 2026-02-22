<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="panelRef"
      class="mayor-output-panel"
      :style="panelStyle"
    >
      <div class="mayor-output-header" @mousedown="startDrag">
        <span class="material-icons">terminal</span>
        <span>Mayor Output</span>
        <button class="mayor-output-close" @click="$emit('close')">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div ref="contentRef" class="mayor-output-content">
        <pre>{{ output || 'Loading...' }}</pre>
      </div>
      <div class="mayor-output-input-bar">
        <span class="mayor-prompt">&gt;</span>
        <input
          v-model="inputCommand"
          type="text"
          placeholder="Type command..."
          autocomplete="off"
          @keydown.enter="sendCommand"
        >
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { api } from '../../composables/useApi'
import { usePolling } from '../../composables/usePolling'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const output = ref('')
const inputCommand = ref('')
const panelRef = ref(null)
const contentRef = ref(null)

// Drag state
const panelStyle = ref({})
let dragOffset = { x: 0, y: 0 }
let isDragging = false

async function fetchOutput() {
  try {
    const data = await api.getMayorOutput(80)
    output.value = data.output || data.content || JSON.stringify(data, null, 2)
    await nextTick()
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight
    }
  } catch (err) {
    output.value = `Error loading output: ${err.message}`
  }
}

async function sendCommand() {
  const cmd = inputCommand.value.trim()
  if (!cmd) return
  inputCommand.value = ''
  try {
    await api.nudge('mayor/', cmd)
    await fetchOutput()
  } catch (err) {
    output.value += `\nError: ${err.message}`
  }
}

const polling = usePolling(fetchOutput, 2000)

watch(() => props.visible, (val) => {
  if (val) {
    fetchOutput()
    polling.start()
  } else {
    polling.stop()
  }
})

function startDrag(e) {
  if (e.target.closest('.mayor-output-close')) return
  isDragging = true
  const panel = panelRef.value
  if (!panel) return
  const rect = panel.getBoundingClientRect()
  dragOffset.x = e.clientX - rect.left
  dragOffset.y = e.clientY - rect.top
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging) return
  const x = e.clientX - dragOffset.x
  const y = e.clientY - dragOffset.y
  panelStyle.value = {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'none',
  }
}

function stopDrag() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.mayor-output-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 450px;
  max-width: calc(100vw - 64px);
  max-height: calc(100vh - 100px);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  resize: both;
  overflow: hidden;
}
.mayor-output-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-default);
  color: #a855f7;
  font-weight: 600;
  cursor: move;
  user-select: none;
}
.mayor-output-header .material-icons { font-size: 18px; }
.mayor-output-close {
  margin-left: auto;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
}
.mayor-output-close:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}
.mayor-output-content {
  flex: 1;
  padding: var(--space-md);
  overflow-y: scroll;
  overflow-x: hidden;
}
.mayor-output-content pre {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-secondary);
  margin: 0;
}
.mayor-output-input-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--border-default);
  background: var(--bg-tertiary);
}
.mayor-prompt {
  color: var(--accent-primary);
  font-family: var(--font-mono);
  font-weight: bold;
}
.mayor-output-input-bar input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  outline: none;
}
.mayor-output-input-bar input::placeholder {
  color: var(--text-muted);
}
</style>
