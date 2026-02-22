<template>
  <div class="feed-item" :style="{ '--event-color': config.color }">
    <div class="feed-icon">
      <span class="material-icons" :style="{ color: config.color }">{{ config.icon }}</span>
    </div>
    <div class="feed-content">
      <div class="feed-header">
        <span class="feed-type">{{ config.label }}</span>
        <span class="feed-time">{{ formattedTime }}</span>
      </div>
      <div class="feed-message" v-html="formattedMessage"></div>
      <div v-if="event.convoy_id" class="feed-meta">
        <span class="feed-tag">
          <span class="material-icons">local_shipping</span>
          {{ event.convoy_id.slice(0, 8) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatActivityFeedTime } from '../../utils/formatting'
import { getAgentConfig, formatAgentName } from '../../constants/agent-types'
import { escapeHtml, truncate } from '../../utils/html'

const EVENT_CONFIG = {
  convoy_created: { icon: 'local_shipping', color: '#22c55e', label: 'Convoy Created' },
  convoy_updated: { icon: 'update', color: '#3b82f6', label: 'Convoy Updated' },
  convoy_complete: { icon: 'check_circle', color: '#22c55e', label: 'Convoy Complete' },
  work_slung: { icon: 'send', color: '#a855f7', label: 'Work Slung' },
  work_complete: { icon: 'task_alt', color: '#22c55e', label: 'Work Complete' },
  work_failed: { icon: 'error', color: '#ef4444', label: 'Work Failed' },
  agent_spawned: { icon: 'person_add', color: '#22c55e', label: 'Agent Spawned' },
  agent_despawned: { icon: 'person_remove', color: '#6b7280', label: 'Agent Despawned' },
  agent_nudged: { icon: 'notifications_active', color: '#f59e0b', label: 'Agent Nudged' },
  bead_created: { icon: 'add_circle', color: '#f59e0b', label: 'Issue Created' },
  bead_updated: { icon: 'edit', color: '#3b82f6', label: 'Issue Updated' },
  mail: { icon: 'mail', color: '#ec4899', label: 'Mail Sent' },
  mail_received: { icon: 'mail', color: '#ec4899', label: 'Mail Received' },
  mayor_message: { icon: 'assistant', color: '#a855f7', label: 'Mayor Message' },
  mayor_started: { icon: 'play_circle', color: '#22c55e', label: 'Mayor Started' },
  system: { icon: 'info', color: '#6b7280', label: 'System' },
  error: { icon: 'error_outline', color: '#ef4444', label: 'Error' },
}

const props = defineProps({
  event: { type: Object, required: true },
})

const config = computed(() => EVENT_CONFIG[props.event.type] || EVENT_CONFIG.system)
const formattedTime = computed(() => formatActivityFeedTime(props.event.timestamp))

function agentBadge(path, role = null) {
  if (!path) return '<span class="feed-agent">unknown</span>'
  const cfg = getAgentConfig(path, role)
  const name = formatAgentName(path)
  return `<span class="feed-agent" style="color: ${cfg.color}"><span class="material-icons" style="font-size: 12px">${cfg.icon}</span> ${escapeHtml(name)}</span>`
}

const formattedMessage = computed(() => {
  const ev = props.event
  const msg = ev.message || ev.summary || ev.description || ''

  switch (ev.type) {
    case 'work_slung':
      return `Slung <strong>${escapeHtml(ev.bead || 'work')}</strong> to ${agentBadge(ev.target)}`
    case 'agent_spawned':
      return `${agentBadge(ev.agent_id || ev.agent_name, ev.role)} joined`
    case 'bead_created':
      return `Created bead <strong>${escapeHtml(ev.bead_id || 'unknown')}</strong>`
    case 'convoy_created':
      return `Convoy <strong>${escapeHtml(ev.convoy_name || ev.convoy_id || 'unknown')}</strong> created`
    case 'mail':
    case 'mail_received':
      return `${agentBadge(ev.actor || ev.from)} &rarr; ${agentBadge(ev.payload?.to || ev.to)}: ${escapeHtml(truncate(ev.payload?.subject || ev.subject || msg, 40))}`
    case 'mayor_message':
      return `You &rarr; ${agentBadge(ev.target || 'mayor')}: "${escapeHtml(truncate(ev.message || msg, 50))}"`
    case 'mayor_started':
      return `Mayor service started${ev.autoStarted ? ' (auto-started for message)' : ''}`
    default:
      if (ev.actor) return `${agentBadge(ev.actor)}: ${escapeHtml(msg)}`
      return escapeHtml(msg)
  }
})
</script>

<style scoped>
.feed-item {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  border-left: 2px solid var(--event-color, var(--border-default));
  transition: background var(--transition-fast);
}
.feed-item:hover { background: var(--bg-hover); }
.feed-icon .material-icons { font-size: 18px; }
.feed-content { flex: 1; min-width: 0; }
.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.feed-type {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
}
.feed-time {
  font-size: 10px;
  color: var(--text-muted);
}
.feed-message {
  font-size: var(--text-xs);
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
}
.feed-message :deep(strong) { font-weight: 600; }
.feed-message :deep(.feed-agent) {
  font-weight: 500;
  white-space: nowrap;
}
.feed-meta {
  margin-top: var(--space-xs);
}
.feed-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}
.feed-tag .material-icons { font-size: 12px; }
</style>
