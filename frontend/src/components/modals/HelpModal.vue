<template>
  <BaseModal
    :show="isOpen('help')"
    title="Gas Town Guide"
    size="lg"
    @close="close"
  >
    <template #header>
      <h2><span class="material-icons">help_outline</span> Gas Town Guide</h2>
    </template>

    <div class="help-content">
      <div class="help-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="help-tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Concepts -->
      <div v-if="activeTab === 'concepts'" class="help-panel">
        <div class="glossary-grid">
          <div v-for="item in concepts" :key="item.term" class="glossary-item">
            <div class="glossary-term">
              <span class="material-icons">{{ item.icon }}</span>
              {{ item.term }}
            </div>
            <div class="glossary-def">{{ item.def }}</div>
          </div>
        </div>
      </div>

      <!-- Roles -->
      <div v-if="activeTab === 'roles'" class="help-panel">
        <div class="roles-grid">
          <div v-for="role in roles" :key="role.name" class="role-card" :class="role.class">
            <div class="role-header">
              <span class="role-icon">{{ role.icon }}</span>
              <h4>{{ role.name }}</h4>
            </div>
            <p>{{ role.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Workflow -->
      <div v-if="activeTab === 'workflow'" class="help-panel">
        <div class="workflow-steps">
          <template v-for="(step, i) in workflowSteps" :key="i">
            <div class="workflow-step">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-content">
                <h4>{{ step.title }}</h4>
                <p>{{ step.desc }}</p>
              </div>
            </div>
            <div v-if="i < workflowSteps.length - 1" class="workflow-arrow">&rarr;</div>
          </template>
        </div>
        <div class="workflow-tip">
          <span class="material-icons">lightbulb</span>
          <strong>Pro Tip:</strong> Use formulas for repeatable workflows. Cook once, sling many times!
        </div>
      </div>

      <!-- Shortcuts -->
      <div v-if="activeTab === 'shortcuts'" class="help-panel">
        <div class="shortcuts-grid">
          <div class="shortcut-group">
            <h4>Navigation</h4>
            <div class="shortcut"><kbd>1</kbd> Dashboard</div>
            <div class="shortcut"><kbd>2</kbd> Convoys</div>
            <div class="shortcut"><kbd>3</kbd> Agents</div>
            <div class="shortcut"><kbd>4</kbd> Mail</div>
            <div class="shortcut"><kbd>5</kbd> Work</div>
          </div>
          <div class="shortcut-group">
            <h4>Actions</h4>
            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>N</kbd> New convoy</div>
            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>S</kbd> Sling work</div>
            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>R</kbd> Refresh</div>
            <div class="shortcut"><kbd>Alt</kbd>+<kbd>N</kbd> New bead</div>
            <div class="shortcut"><kbd>Alt</kbd>+<kbd>M</kbd> Compose mail</div>
          </div>
          <div class="shortcut-group">
            <h4>Modals</h4>
            <div class="shortcut"><kbd>?</kbd> This help</div>
            <div class="shortcut"><kbd>Esc</kbd> Close modal</div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'

const { isOpen, close } = useModal()

const activeTab = ref('concepts')

const tabs = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'roles', label: 'Roles' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'shortcuts', label: 'Shortcuts' },
]

const concepts = [
  { icon: 'home', term: 'Town', def: 'Your workspace directory (e.g., ~/gt/). Contains all rigs, agents, and configuration.' },
  { icon: 'folder_special', term: 'Rig', def: 'A git project container with its own agents. Each rig has a Witness (monitor) and optional Refinery (merge queue).' },
  { icon: 'local_shipping', term: 'Convoy', def: 'A group of related work items (issues/beads). Convoys track progress across multiple tasks.' },
  { icon: 'send', term: 'Sling', def: 'Assign work to a worker agent. "Sling" a bead/issue to a polecat to start work.' },
  { icon: 'anchor', term: 'Hook', def: 'Where work "hangs" on an agent. On wake, agents run what\'s on their hook. Work survives crashes.' },
  { icon: 'bubble_chart', term: 'Bead', def: 'A work item in the git-backed issue tracker. Beads persist in your repo and track all work state.' },
  { icon: 'science', term: 'Formula / Molecule', def: 'Workflow templates. Cook a formula into a molecule, then sling it. Molecules survive agent restarts.' },
]

const roles = [
  { icon: '\uD83D\uDC54', name: 'Mayor', desc: 'Global coordinator for cross-rig work. Dispatches tasks, handles escalations, manages priorities across all projects.', class: 'role-mayor' },
  { icon: '\u2699\uFE0F', name: 'Deacon', desc: 'Daemon process manager. Handles agent lifecycle, plugin execution, and system-level coordination.', class: 'role-deacon' },
  { icon: '\uD83D\uDC41\uFE0F', name: 'Witness', desc: 'Per-rig monitor. Watches polecats, detects stuck workers, handles lifecycle events. One per project.', class: 'role-witness' },
  { icon: '\uD83D\uDD27', name: 'Refinery', desc: 'Merge queue processor. Reviews PRs, runs integration tests, manages the code review pipeline.', class: 'role-refinery' },
  { icon: '\uD83D\uDC3E', name: 'Polecat', desc: 'Ephemeral worker agent. Spawns, executes work on its hook, then disappears. Multiple per rig.', class: 'role-polecat' },
  { icon: '\uD83D\uDC64', name: 'Overseer (You)', desc: 'Human operator. Sets strategy, reviews output, handles escalations. Uses this GUI to monitor and direct work.', class: '' },
]

const workflowSteps = [
  { title: 'Create a Convoy', desc: 'Group related issues into a convoy for tracking. Give it a name and add issue IDs.' },
  { title: 'Sling Work', desc: 'Assign issues to worker agents (polecats). Select the target rig and quality level.' },
  { title: 'Monitor Progress', desc: 'Watch the convoy dashboard. Workers will update status as they complete tasks.' },
  { title: 'Review & Merge', desc: 'When work completes, Refinery handles PRs. Escalate to Mayor if issues arise.' },
]
</script>

<style scoped>
.help-content {
  min-height: 300px;
}

.help-tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border-default);
  padding-bottom: var(--space-sm);
}

.help-tab {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.help-tab:hover { color: var(--text-primary); }
.help-tab.active {
  color: var(--accent-primary);
  border-bottom: 2px solid var(--accent-primary);
}

/* Concepts */
.glossary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}
.glossary-item {
  padding: var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.glossary-term {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}
.glossary-term .material-icons {
  font-size: 18px;
  color: var(--accent-primary);
}
.glossary-def {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Roles */
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}
.role-card {
  padding: var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.role-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}
.role-icon { font-size: 1.25rem; }
.role-header h4 { font-size: var(--text-base); font-weight: 600; }
.role-card p { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.5; }

.role-mayor { border-left: 3px solid var(--role-mayor); }
.role-deacon { border-left: 3px solid var(--role-deacon); }
.role-witness { border-left: 3px solid var(--role-witness); }
.role-refinery { border-left: 3px solid var(--role-refinery); }
.role-polecat { border-left: 3px solid var(--role-polecat); }

/* Workflow */
.workflow-steps {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
}
.workflow-step {
  display: flex;
  gap: var(--space-sm);
  flex: 1;
  min-width: 140px;
  padding: var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--text-sm);
  flex-shrink: 0;
}
.step-content h4 { font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--space-xs); }
.step-content p { font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.4; }
.workflow-arrow {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  font-size: var(--text-xl);
  padding-top: var(--space-lg);
}
.workflow-tip {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--accent-warning);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.workflow-tip .material-icons { color: var(--accent-warning); }

/* Shortcuts */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-lg);
}
.shortcut-group h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--text-primary);
}
.shortcut {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding: var(--space-xs) 0;
}
kbd {
  display: inline-block;
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  margin-right: 2px;
}
</style>
