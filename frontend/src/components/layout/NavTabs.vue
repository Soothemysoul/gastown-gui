<template>
  <div class="nav-tabs">
    <router-link
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.to"
      class="nav-tab"
      :class="{ active: isActive(tab) }"
      :title="tab.tooltip"
    >
      <span class="material-icons">{{ tab.icon }}</span>
      {{ tab.label }}
      <span v-if="tab.badge && tab.badge > 0" class="badge">{{ tab.badge }}</span>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMailStore } from '../../stores/mailStore'

const route = useRoute()
const mailStore = useMailStore()

const tabs = computed(() => [
  { name: 'dashboard', to: '/', icon: 'dashboard', label: 'Overview', tooltip: 'System overview - health, metrics, and quick actions.' },
  { name: 'convoys', to: '/convoys', icon: 'local_shipping', label: 'Convoys', tooltip: 'Groups of related work items. Track progress across multiple tasks.' },
  { name: 'work', to: '/work', icon: 'task_alt', label: 'Work', tooltip: 'Individual tasks (beads) and their completion status.' },
  { name: 'agents', to: '/agents', icon: 'groups', label: 'Agents', tooltip: 'Worker agents: Mayor, Witness, Refinery, and Polecats.' },
  { name: 'rigs', to: '/rigs', icon: 'folder_special', label: 'Rigs', tooltip: 'Git projects with their agents and GitHub integration.' },
  { name: 'crews', to: '/crews', icon: 'groups', label: 'Crews', tooltip: 'Teams of polecats for coordinated work.' },
  { name: 'prs', to: '/prs', icon: 'merge_type', label: 'PRs', tooltip: 'GitHub Pull Requests across all connected repositories.' },
  { name: 'formulas', to: '/formulas', icon: 'science', label: 'Formulas', tooltip: 'Workflow templates for repeatable tasks.' },
  { name: 'issues', to: '/issues', icon: 'bug_report', label: 'Issues', tooltip: 'GitHub Issues across connected repositories.' },
  { name: 'mail', to: '/mail', icon: 'mail', label: 'Mail', tooltip: 'Messages between agents and the human overseer.', badge: mailStore.unreadCount },
  { name: 'health', to: '/health', icon: 'health_and_safety', label: 'Health', tooltip: 'System health check - verify Gas Town configuration.' },
])

function isActive(tab) {
  if (tab.to === '/') return route.path === '/'
  return route.path.startsWith(tab.to)
}
</script>

<style scoped>
.nav-tabs {
  display: flex;
  gap: var(--space-xs);
}
.nav-tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
}
.nav-tab:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.nav-tab.active {
  color: var(--accent-primary);
  background: var(--bg-tertiary);
}
.nav-tab .material-icons {
  font-size: 20px;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-xs);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-inverse);
  background: var(--accent-danger);
  border-radius: var(--radius-full);
}
</style>
