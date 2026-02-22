<template>
  <div class="rig-card">
    <div class="rig-header">
      <div class="rig-icon">
        <span class="material-icons">folder_special</span>
      </div>
      <div class="rig-info">
        <h3 class="rig-name">{{ rig.name }}</h3>
        <div class="rig-meta">
          <a
            v-if="rig.git_url"
            :href="rig.git_url"
            target="_blank"
            class="rig-github-link"
          >
            <span class="material-icons">open_in_new</span>
            {{ extractRepoName(rig.git_url) }}
          </a>
          <span v-else class="rig-local">Local only</span>
        </div>
      </div>
      <div class="rig-status">
        <span class="status-dot" :class="{ active: runningAgents > 0 }"></span>
        <span class="status-text">{{ runningAgents }}/{{ totalAgents }} active</span>
      </div>
    </div>

    <div class="rig-stats">
      <div class="rig-stat">
        <span class="material-icons" :style="{ color: AGENT_TYPES.polecat.color }">{{ AGENT_TYPES.polecat.icon }}</span>
        <span class="stat-value">{{ rig.polecat_count || 0 }}</span>
        <span class="stat-label">Polecats</span>
      </div>
      <div class="rig-stat">
        <span class="material-icons" :style="{ color: AGENT_TYPES.witness.color }">{{ AGENT_TYPES.witness.icon }}</span>
        <span class="stat-value">{{ rig.has_witness ? '1' : '0' }}</span>
        <span class="stat-label">Witness</span>
      </div>
      <div class="rig-stat">
        <span class="material-icons" :style="{ color: AGENT_TYPES.refinery.color }">{{ AGENT_TYPES.refinery.icon }}</span>
        <span class="stat-value">{{ rig.has_refinery ? '1' : '0' }}</span>
        <span class="stat-label">Refinery</span>
      </div>
      <div class="rig-stat">
        <span class="material-icons" :style="{ color: AGENT_TYPES.crew.color }">{{ AGENT_TYPES.crew.icon }}</span>
        <span class="stat-value">{{ rig.crew_count || 0 }}</span>
        <span class="stat-label">Crews</span>
      </div>
    </div>

    <div v-if="agents.length" class="rig-agents">
      <div class="agents-header">
        <span class="material-icons">groups</span>
        Agents
      </div>
      <div class="agents-list">
        <div
          v-for="agent in agents"
          :key="agent.address || agent.name"
          class="rig-agent"
        >
          <span class="agent-icon material-icons" :style="{ color: getAgentConfig(agent.address, agent.role).color }">
            {{ getAgentConfig(agent.address, agent.role).icon }}
          </span>
          <span class="agent-name">{{ agent.name }}</span>
          <span class="agent-role" :style="{ color: getAgentConfig(agent.address, agent.role).color }">
            {{ getAgentConfig(agent.address, agent.role).label }}
          </span>
          <span class="agent-status">
            <span class="material-icons" :style="{ color: agent.running ? STATUS_COLORS.running : STATUS_COLORS.stopped }">
              {{ agent.running ? STATUS_ICONS.running : STATUS_ICONS.stopped }}
            </span>
          </span>
          <span v-if="agent.has_work" class="agent-work-badge" title="Has work hooked">&#9889;</span>
          <div class="agent-controls">
            <template v-if="agent.running">
              <button class="btn btn-icon btn-xs btn-danger-ghost" title="Stop" @click.stop="$emit('stop-agent', rig.name, agent.name)">
                <span class="material-icons">stop</span>
              </button>
              <button class="btn btn-icon btn-xs" title="Restart" @click.stop="$emit('restart-agent', rig.name, agent.name)">
                <span class="material-icons">refresh</span>
              </button>
            </template>
            <template v-else>
              <button class="btn btn-icon btn-xs btn-success-ghost" title="Start" @click.stop="$emit('start-agent', rig.name, agent.name)">
                <span class="material-icons">play_arrow</span>
              </button>
            </template>
            <button class="btn btn-icon btn-xs" title="Peek" @click.stop="$emit('peek', agent.address)">
              <span class="material-icons">visibility</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="rig-actions">
      <a
        v-if="rig.git_url"
        :href="rig.git_url"
        target="_blank"
        class="btn btn-sm btn-secondary"
      >
        <span class="material-icons">open_in_new</span>
        GitHub
      </a>
      <button
        v-if="runningAgents > 0"
        class="btn btn-sm btn-warning-ghost"
        title="Park rig"
        @click="$emit('park', rig.name)"
      >
        <span class="material-icons">local_parking</span>
        Park
      </button>
      <button
        v-else
        class="btn btn-sm btn-success-ghost"
        title="Boot rig"
        @click="$emit('boot', rig.name)"
      >
        <span class="material-icons">rocket_launch</span>
        Boot
      </button>
      <button class="btn btn-sm btn-danger-ghost" title="Remove rig" @click="$emit('remove', rig.name)">
        <span class="material-icons">delete</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AGENT_TYPES, STATUS_ICONS, STATUS_COLORS, getAgentConfig } from '../../constants/agent-types'

const props = defineProps({
  rig: { type: Object, required: true },
})

defineEmits(['park', 'boot', 'remove', 'peek', 'start-agent', 'stop-agent', 'restart-agent'])

const agents = computed(() => props.rig.agents || [])
const runningAgents = computed(() => agents.value.filter(a => a.running).length)
const totalAgents = computed(() => agents.value.length)

function extractRepoName(url) {
  if (!url) return ''
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/)
  return match ? match[1] : url
}
</script>

<style scoped>
.rig-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.rig-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.rig-icon .material-icons {
  font-size: 28px;
  color: var(--accent-primary);
}
.rig-info { flex: 1; min-width: 0; }
.rig-name {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}
.rig-meta { font-size: var(--text-xs); color: var(--text-muted); }
.rig-github-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--accent-primary);
  text-decoration: none;
}
.rig-github-link .material-icons { font-size: 14px; }
.rig-local { color: var(--text-muted); }

.rig-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}
.status-dot.active { background: #22c55e; }

.rig-stats {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}
.rig-stat {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
}
.rig-stat .material-icons { font-size: 16px; }
.stat-value { font-weight: 600; color: var(--text-primary); }
.stat-label { color: var(--text-muted); }

.rig-agents {
  border-top: 1px solid var(--border-default);
  padding-top: var(--space-sm);
}
.agents-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}
.agents-header .material-icons { font-size: 16px; }

.agents-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rig-agent {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}
.rig-agent:hover { background: var(--bg-hover); }
.agent-icon { font-size: 16px; }
.agent-name { font-weight: 500; color: var(--text-primary); }
.agent-role { font-size: var(--text-xs); }
.agent-status .material-icons { font-size: 14px; }
.agent-work-badge { font-size: 12px; }
.agent-controls {
  margin-left: auto;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.rig-agent:hover .agent-controls { opacity: 1; }

.rig-actions {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  border-top: 1px solid var(--border-default);
  padding-top: var(--space-sm);
}
</style>
