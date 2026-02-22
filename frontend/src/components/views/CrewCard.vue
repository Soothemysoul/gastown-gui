<template>
  <div class="crew-card">
    <div class="crew-header">
      <div class="crew-icon">
        <span class="material-icons">groups</span>
      </div>
      <div class="crew-info">
        <h3 class="crew-name">{{ crew.name }}</h3>
        <div class="crew-meta">
          <span v-if="crew.rig" class="crew-rig">
            <span class="material-icons">folder</span>
            {{ crew.rig }}
          </span>
          <span v-else class="crew-no-rig">No rig assigned</span>
        </div>
      </div>
      <div class="crew-status" :class="statusClass">
        <span class="material-icons">{{ statusIcon }}</span>
        <span>{{ crew.status || 'unknown' }}</span>
      </div>
    </div>

    <div class="crew-stats">
      <div class="crew-stat">
        <span class="material-icons">smart_toy</span>
        <span class="stat-value">{{ memberCount }}</span>
        <span class="stat-label">Members</span>
      </div>
      <div v-if="crew.active_tasks !== undefined" class="crew-stat">
        <span class="material-icons">pending_actions</span>
        <span class="stat-value">{{ crew.active_tasks }}</span>
        <span class="stat-label">Active Tasks</span>
      </div>
      <div v-if="crew.completed_tasks !== undefined" class="crew-stat">
        <span class="material-icons">task_alt</span>
        <span class="stat-value">{{ crew.completed_tasks }}</span>
        <span class="stat-label">Completed</span>
      </div>
    </div>

    <div v-if="memberCount > 0" class="crew-members">
      <h4>Members</h4>
      <div class="member-list">
        <span v-for="member in crew.members" :key="member" class="member-badge">
          <span class="material-icons">smart_toy</span>
          {{ member }}
        </span>
      </div>
    </div>

    <div class="crew-actions">
      <button class="btn btn-sm btn-icon" title="View Status" @click="$emit('status', crew.name)">
        <span class="material-icons">info</span>
      </button>
      <button class="btn btn-sm btn-icon btn-danger-ghost" title="Remove Crew" @click="$emit('remove', crew.name)">
        <span class="material-icons">delete</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  crew: { type: Object, required: true },
})

defineEmits(['status', 'remove'])

const memberCount = computed(() => (props.crew.members || []).length)
const statusClass = computed(() => props.crew.status === 'active' ? 'status-active' : 'status-inactive')
const statusIcon = computed(() => props.crew.status === 'active' ? 'check_circle' : 'pause_circle')
</script>

<style scoped>
.crew-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.crew-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.crew-icon .material-icons {
  font-size: 28px;
  color: #06b6d4;
}
.crew-info { flex: 1; min-width: 0; }
.crew-name {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}
.crew-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.crew-rig {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.crew-rig .material-icons { font-size: 14px; }

.crew-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: 500;
}
.crew-status .material-icons { font-size: 16px; }
.status-active { color: #22c55e; }
.status-inactive { color: var(--text-muted); }

.crew-stats {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}
.crew-stat {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
}
.crew-stat .material-icons { font-size: 16px; color: var(--text-muted); }
.stat-value { font-weight: 600; color: var(--text-primary); }
.stat-label { color: var(--text-muted); }

.crew-members {
  border-top: 1px solid var(--border-default);
  padding-top: var(--space-sm);
}
.crew-members h4 {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}
.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.member-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px var(--space-xs);
  font-size: var(--text-xs);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}
.member-badge .material-icons { font-size: 14px; color: #22c55e; }

.crew-actions {
  display: flex;
  gap: var(--space-xs);
  border-top: 1px solid var(--border-default);
  padding-top: var(--space-sm);
}
</style>
