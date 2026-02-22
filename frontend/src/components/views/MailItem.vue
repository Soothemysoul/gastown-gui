<template>
  <div
    class="mail-item"
    :class="{ unread: !mail.read }"
    @click="$emit('detail', mail)"
  >
    <div class="mail-status">
      <span class="material-icons" :style="{ color: fromConfig.color }">{{ fromConfig.icon }}</span>
    </div>

    <div class="mail-content">
      <div class="mail-header">
        <span class="mail-from">
          <span class="agent-badge" :style="{ '--agent-color': fromConfig.color }">
            <span class="material-icons">{{ fromConfig.icon }}</span>
            {{ formatAgentName(mail.from) }}
          </span>
          <template v-if="mail.to">
            <span class="mail-arrow">&rarr;</span>
            <span class="agent-badge" :style="{ '--agent-color': toConfig.color }">
              <span class="material-icons">{{ toConfig.icon }}</span>
              {{ formatAgentName(mail.to) }}
            </span>
          </template>
        </span>
        <span class="mail-time">{{ formatTime(mail.timestamp) }}</span>
      </div>
      <div class="mail-subject" :class="{ unread: !mail.read }">{{ mail.subject || '(No Subject)' }}</div>
      <div class="mail-preview">{{ truncateText(mail.message || mail.body || '', 80) }}</div>
      <div v-if="mail.tags?.length" class="mail-tags">
        <span v-for="tag in mail.tags" :key="tag" class="mail-tag">{{ tag }}</span>
      </div>
    </div>

    <div class="mail-actions" @click.stop>
      <button
        class="btn btn-icon btn-sm"
        :title="mail.read ? 'Mark as unread' : 'Mark as read'"
        @click="$emit('toggle-read', mail.id, !mail.read)"
      >
        <span class="material-icons">{{ mail.read ? 'mark_email_unread' : 'mark_email_read' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AGENT_TYPES, getAgentType, formatAgentName } from '../../constants/agent-types'
import { TIME_MS } from '../../utils/formatting'

const props = defineProps({
  mail: { type: Object, required: true },
})

defineEmits(['detail', 'toggle-read'])

const fromConfig = computed(() => {
  const type = getAgentType(props.mail.from)
  return AGENT_TYPES[type] || AGENT_TYPES.system
})

const toConfig = computed(() => {
  const type = getAgentType(props.mail.to)
  return AGENT_TYPES[type] || AGENT_TYPES.system
})

function truncateText(str, len) {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < TIME_MS.WEEK) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.mail-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}
.mail-item:hover { border-color: var(--accent-primary); }
.mail-item.unread {
  border-left: 3px solid var(--accent-primary);
}

.mail-status .material-icons { font-size: 20px; }

.mail-content { flex: 1; min-width: 0; }
.mail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}
.mail-from {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
}
.agent-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--agent-color, var(--text-secondary));
}
.agent-badge .material-icons { font-size: 14px; }
.mail-arrow { color: var(--text-muted); font-size: var(--text-xs); }
.mail-time { font-size: var(--text-xs); color: var(--text-muted); white-space: nowrap; }

.mail-subject {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin-top: 2px;
}
.mail-subject.unread { font-weight: 600; }

.mail-preview {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mail-tags {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}
.mail-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-muted);
}

.mail-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.mail-item:hover .mail-actions { opacity: 1; }
</style>
