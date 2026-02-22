<template>
  <BaseModal
    v-model="visible"
    :title="'Output: ' + agentName"
    icon="terminal"
    size="xl"
    @close="onClose"
  >
    <!-- Status & controls -->
    <div class="peek-toolbar">
      <div class="peek-status">
        <span v-if="statusLoading" class="material-icons spinning">sync</span>
        <template v-else>
          <span class="peek-status-badge" :class="running ? 'status-running' : 'status-stopped'">
            <span class="material-icons">{{ running ? 'play_circle' : 'stop_circle' }}</span>
            {{ running ? 'Running' : 'Stopped' }}
          </span>
          <span v-if="session" class="peek-session-info">({{ session }})</span>
        </template>
      </div>
      <div class="peek-controls">
        <label class="auto-refresh-toggle">
          <input type="checkbox" v-model="autoRefreshEnabled" />
          Auto-refresh
        </label>
        <button class="btn btn-icon" @click="refresh" title="Refresh" :disabled="refreshing">
          <span class="material-icons" :class="{ spinning: refreshing }">refresh</span>
        </button>
        <button class="btn btn-icon" @click="showTranscript" title="View Transcript">
          <span class="material-icons">article</span>
        </button>
      </div>
    </div>

    <!-- Output display -->
    <div class="peek-output" ref="outputRef">
      <pre class="output-content">{{ output || '(No output available)' }}</pre>
    </div>

    <!-- Transcript panel (shown when active) -->
    <div v-if="transcriptVisible" class="transcript-panel">
      <div class="transcript-header">
        <h3>
          <span class="material-icons">article</span>
          Transcript: {{ agentName }}
        </h3>
        <button class="btn btn-icon" @click="transcriptVisible = false">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="transcript-body">
        <div v-if="transcriptLoading" class="transcript-loading">
          <span class="material-icons spinning">sync</span> Loading transcript...
        </div>
        <template v-else-if="transcriptData">
          <div v-if="transcriptData.transcripts?.length" class="transcript-section">
            <h4><span class="material-icons">history</span> Claude Session Transcripts</h4>
            <div v-for="t in transcriptData.transcripts" :key="t.filename" class="transcript-file">
              <div class="transcript-file-header">
                <span class="material-icons">description</span>
                <span class="transcript-filename">{{ t.filename }}</span>
                <span v-if="t.modified" class="transcript-date">{{ formatDate(t.modified) }}</span>
              </div>
              <pre class="transcript-content">{{ t.content || '(Empty)' }}</pre>
            </div>
          </div>
          <div v-if="transcriptData.output" class="transcript-section">
            <h4><span class="material-icons">terminal</span> Recent Tmux Output</h4>
            <pre class="transcript-content tmux-output">{{ transcriptData.output }}</pre>
          </div>
          <div v-if="!transcriptData.transcripts?.length && !transcriptData.output" class="transcript-empty">
            <span class="material-icons">info</span>
            <p>No transcript data found for this agent.</p>
          </div>
        </template>
        <div v-else class="transcript-empty">
          <span class="material-icons">error</span>
          <p>{{ transcriptError || 'Failed to load transcript' }}</p>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { usePolling } from '../../composables/usePolling'
import { useUiStore } from '../../stores/uiStore'

const api = useApi()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'peek',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const outputRef = ref(null)
const output = ref('')
const running = ref(false)
const session = ref(null)
const statusLoading = ref(false)
const refreshing = ref(false)
const autoRefreshEnabled = ref(false)

// Transcript state
const transcriptVisible = ref(false)
const transcriptData = ref(null)
const transcriptLoading = ref(false)
const transcriptError = ref(null)

const agentId = computed(() => uiStore.modalData?.agentId || '')
const agentName = computed(() => {
  const parts = agentId.value.split('/')
  return parts[1] || parts[0] || 'Agent'
})
const rig = computed(() => agentId.value.split('/')[0] || '')

// Auto-refresh polling at 2s
const { start: startPolling, stop: stopPolling } = usePolling(() => refresh(), 2000)

watch(autoRefreshEnabled, (enabled) => {
  if (enabled) startPolling()
  else stopPolling()
})

async function refresh() {
  if (!rig.value || !agentName.value) return
  refreshing.value = true
  try {
    const response = await api.getPeekOutput(rig.value, agentName.value)
    running.value = !!response.running
    session.value = response.session || null
    output.value = response.output || ''
    // Scroll to bottom
    await nextTick()
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  } catch (err) {
    output.value = `Failed to fetch output: ${err.message}`
    running.value = false
  } finally {
    refreshing.value = false
  }
}

async function showTranscript() {
  transcriptVisible.value = true
  transcriptLoading.value = true
  transcriptError.value = null
  try {
    transcriptData.value = await api.getAgentTranscript(rig.value, agentName.value)
  } catch (err) {
    transcriptData.value = null
    transcriptError.value = err.message
  } finally {
    transcriptLoading.value = false
  }
}

function formatDate(d) {
  return new Date(d).toLocaleString()
}

function onClose() {
  stopPolling()
  autoRefreshEnabled.value = false
  output.value = ''
  transcriptVisible.value = false
  transcriptData.value = null
}

// Initial load
watch(visible, (v) => {
  if (v) {
    statusLoading.value = true
    refresh().then(() => { statusLoading.value = false })
  } else {
    onClose()
  }
})
</script>

<style scoped>
.peek-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-muted);
}
.peek-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.peek-status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--text-sm);
  font-weight: 500;
  padding: var(--space-xxs) var(--space-sm);
  border-radius: var(--radius-full);
}
.peek-status-badge.status-running {
  color: var(--status-running);
  background: rgba(63, 185, 80, 0.1);
}
.peek-status-badge.status-stopped {
  color: var(--status-idle);
  background: rgba(110, 118, 129, 0.1);
}
.peek-session-info {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.peek-controls {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.auto-refresh-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  cursor: pointer;
}
.auto-refresh-toggle input { cursor: pointer; }

.peek-output {
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  max-height: 400px;
  overflow-y: auto;
}
.output-content {
  padding: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-primary);
  margin: 0;
}

/* Transcript panel */
.transcript-panel {
  margin-top: var(--space-md);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.transcript-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-muted);
}
.transcript-header h3 {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 600;
}
.transcript-body {
  max-height: 300px;
  overflow-y: auto;
}
.transcript-section {
  padding: var(--space-md);
}
.transcript-section h4 {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--text-secondary);
}
.transcript-file {
  margin-bottom: var(--space-md);
}
.transcript-file-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.transcript-filename {
  font-family: var(--font-mono);
}
.transcript-date {
  margin-left: auto;
}
.transcript-content {
  background: var(--bg-primary);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}
.transcript-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  color: var(--text-muted);
}
.transcript-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  color: var(--text-muted);
  text-align: center;
}

/* Shared */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  border: none;
  background: none;
  transition: all var(--transition-fast);
}
.btn-icon:hover { background: var(--bg-hover); color: var(--text-primary); }
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
