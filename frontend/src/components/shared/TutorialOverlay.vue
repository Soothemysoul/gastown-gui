<template>
  <Teleport to="body">
    <template v-if="visible">
      <!-- Highlight overlay -->
      <div
        v-if="highlightStyle"
        class="tutorial-highlight"
        :style="highlightStyle"
      />

      <!-- Tutorial panel -->
      <div class="tutorial-modal" :style="panelPosition">
        <div class="tutorial-content">
          <div class="tutorial-header">
            <div class="tutorial-progress">
              <span class="tutorial-step-num">{{ currentStep + 1 }}</span> / <span class="tutorial-total">{{ steps.length }}</span>
            </div>
            <button class="tutorial-close" title="Skip tutorial" @click="close">
              <span class="material-icons">close</span>
            </button>
          </div>

          <h2 class="tutorial-title">{{ activeStep.title }}</h2>

          <div class="tutorial-body">
            <!-- Welcome -->
            <template v-if="activeStep.id === 'welcome'">
              <p>Gas Town is a <strong>multi-agent orchestrator</strong> for Claude Code.</p>
              <p>It helps you manage multiple AI agents working together on your codebase.</p>
              <div class="tutorial-concepts">
                <div class="concept-pill"><span class="material-icons">location_city</span> Town = Your workspace</div>
                <div class="concept-pill"><span class="material-icons">build</span> Rig = A project/repo</div>
                <div class="concept-pill"><span class="material-icons">group</span> Agents = AI workers</div>
              </div>
              <p>Let's walk through how it works!</p>
            </template>

            <!-- Agents -->
            <template v-else-if="activeStep.id === 'agents'">
              <p>Gas Town has different <strong>agent roles</strong>:</p>
              <div class="role-list">
                <div class="role-item" v-for="role in roles" :key="role.name" :class="`role-${role.name.toLowerCase()}`">
                  <span class="material-icons">{{ role.icon }}</span>
                  <div>
                    <strong>{{ role.name }}</strong>
                    <span>{{ role.desc }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- Mayor Command -->
            <template v-else-if="activeStep.id === 'mayor-command'">
              <p>The <strong>Mayor Command Bar</strong> lets you give instructions directly to the Mayor agent.</p>
              <p>Just type what you want built and the Mayor will:</p>
              <ul>
                <li><span class="material-icons">auto_awesome</span> Break down your request into tasks</li>
                <li><span class="material-icons">group_work</span> Create a convoy to track the work</li>
                <li><span class="material-icons">send</span> Sling tasks to available agents</li>
                <li><span class="material-icons">visibility</span> Monitor progress and report back</li>
              </ul>
              <p><strong>Try it:</strong> Type something like "Create a README file" in the command bar!</p>
            </template>

            <!-- Sidebar -->
            <template v-else-if="activeStep.id === 'sidebar'">
              <p>The <strong>sidebar</strong> shows all your agents organized by role.</p>
              <p><strong>Try it:</strong> Click on any agent to see quick actions!</p>
              <ul>
                <li><span class="material-icons">notifications</span> <strong>Nudge</strong> - Ping an agent</li>
                <li><span class="material-icons">mail</span> <strong>Mail</strong> - Send a message</li>
                <li><span class="material-icons">open_in_new</span> <strong>View</strong> - See full details</li>
              </ul>
              <p>The colored dots show status: <span class="status-dot running"></span> running, <span class="status-dot working"></span> working, <span class="status-dot idle"></span> idle</p>
            </template>

            <!-- Beads -->
            <template v-else-if="activeStep.id === 'beads'">
              <p><strong>Beads</strong> are Git-tracked issues that agents work on.</p>
              <p>Each bead has:</p>
              <ul>
                <li>A unique ID (e.g., <code>gt-a3f2dd</code>)</li>
                <li>A title and description</li>
                <li>Status: pending → in_progress → done</li>
                <li>An assignee (the agent working on it)</li>
              </ul>
              <p>Beads are stored as JSONL files in your repo, so they're versioned with your code!</p>
            </template>

            <!-- Sling -->
            <template v-else-if="activeStep.id === 'sling'">
              <p><strong>Sling</strong> is how you assign work to agents.</p>
              <p>Think of it like "throwing" a task to a worker:</p>
              <div class="sling-demo">
                <div class="sling-from">
                  <span class="material-icons">description</span>
                  <span>Bead (issue)</span>
                </div>
                <div class="sling-arrow">
                  <span class="material-icons">arrow_forward</span>
                  <span>sling</span>
                </div>
                <div class="sling-to">
                  <span class="material-icons">smart_toy</span>
                  <span>Agent</span>
                </div>
              </div>
              <p>The agent catches the work on their <strong>hook</strong> and starts working!</p>
            </template>

            <!-- Convoys -->
            <template v-else-if="activeStep.id === 'convoys'">
              <p>A <strong>Convoy</strong> groups related work items together.</p>
              <p>For example, a feature might have multiple beads:</p>
              <ul>
                <li>Design the API</li>
                <li>Implement backend</li>
                <li>Build frontend</li>
                <li>Write tests</li>
              </ul>
              <p>A convoy tracks progress across all these tasks and coordinates agents.</p>
            </template>

            <!-- Mail -->
            <template v-else-if="activeStep.id === 'mail'">
              <p>Agents communicate via <strong>mail</strong>:</p>
              <ul>
                <li><strong>Status updates</strong> - "I finished task X"</li>
                <li><strong>Questions</strong> - "Need clarification on Y"</li>
                <li><strong>Escalations</strong> - "I'm stuck, need help!"</li>
              </ul>
              <p>You (the human overseer) can also send mail to agents.</p>
              <p><strong>Tip:</strong> Click the <strong>Mail</strong> tab in the navigation bar, or press <kbd>3</kbd>.</p>
            </template>

            <!-- Keyboard -->
            <template v-else-if="activeStep.id === 'keyboard'">
              <p>Speed up your workflow with shortcuts:</p>
              <div class="shortcut-grid">
                <div><kbd>1</kbd> Convoys</div>
                <div><kbd>2</kbd> Agents</div>
                <div><kbd>3</kbd> Mail</div>
                <div><kbd>?</kbd> Help</div>
                <div><kbd>Ctrl+N</kbd> New Convoy</div>
                <div><kbd>Ctrl+R</kbd> Refresh</div>
                <div><kbd>Esc</kbd> Close modal</div>
              </div>
            </template>

            <!-- Try It -->
            <template v-else-if="activeStep.id === 'try-it'">
              <p>You're ready to use Gas Town! Here's a quick workflow:</p>
              <ol class="workflow-checklist">
                <li>
                  <span class="material-icons">check_circle</span>
                  Create a bead: <code>bd new "Fix the login bug"</code>
                </li>
                <li>
                  <span class="material-icons">check_circle</span>
                  Click <strong>Sling</strong> to assign it to an agent
                </li>
                <li>
                  <span class="material-icons">check_circle</span>
                  Watch the agent work in the Activity feed
                </li>
                <li>
                  <span class="material-icons">check_circle</span>
                  Review the completed work
                </li>
              </ol>
              <p>Need help? Press <kbd>?</kbd> anytime or check the Help modal.</p>
            </template>
          </div>

          <div class="tutorial-footer">
            <button class="btn btn-secondary tutorial-prev" :disabled="currentStep === 0" @click="prevStep">
              <span class="material-icons">arrow_back</span> Back
            </button>
            <div class="tutorial-dots">
              <button
                v-for="(step, i) in steps"
                :key="step.id"
                class="tutorial-dot"
                :class="{ active: i === currentStep, completed: i < currentStep }"
                @click="goToStep(i)"
              />
            </div>
            <button class="btn btn-primary tutorial-next" @click="nextStep">
              <template v-if="currentStep === steps.length - 1">
                Finish <span class="material-icons">check</span>
              </template>
              <template v-else>
                Next <span class="material-icons">arrow_forward</span>
              </template>
            </button>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useToast } from '../../composables/useToast'

const toast = useToast()
const emit = defineEmits(['complete'])

const visible = ref(false)
const currentStep = ref(0)
const highlightStyle = ref(null)
const panelPosition = ref({})

const roles = [
  { name: 'Mayor', icon: 'account_balance', desc: 'Global coordinator - dispatches work across all projects' },
  { name: 'Deacon', icon: 'health_and_safety', desc: 'Health monitor - watches over all agents' },
  { name: 'Polecat', icon: 'engineering', desc: 'Ephemeral workers - spawned to do specific tasks' },
  { name: 'Witness', icon: 'visibility', desc: 'Per-rig coordinator - manages work within a project' },
  { name: 'Refinery', icon: 'merge_type', desc: 'Merge queue manager - handles code integration' },
]

const steps = [
  { id: 'welcome', title: 'Welcome to Gas Town!', highlight: null },
  { id: 'agents', title: 'Meet Your Agents', highlight: '#agent-tree' },
  { id: 'mayor-command', title: 'Tell the Mayor What to Build', highlight: '#mayor-command-bar' },
  { id: 'sidebar', title: 'The Sidebar', highlight: '.sidebar' },
  { id: 'beads', title: 'Beads = Issues', highlight: null },
  { id: 'sling', title: 'Slinging Work', highlight: '#sling-btn' },
  { id: 'convoys', title: 'Convoys = Batches', highlight: '#convoy-list' },
  { id: 'mail', title: 'Agent Communication', highlight: null },
  { id: 'keyboard', title: 'Keyboard Shortcuts', highlight: null },
  { id: 'try-it', title: 'Try It Yourself!', highlight: null },
]

const activeStep = computed(() => steps[currentStep.value])

function updateHighlight() {
  const step = activeStep.value
  if (step.highlight) {
    const el = document.querySelector(step.highlight)
    if (el) {
      const rect = el.getBoundingClientRect()
      const padding = 8
      highlightStyle.value = {
        position: 'fixed',
        top: `${rect.top - padding}px`,
        left: `${rect.left - padding}px`,
        width: `${rect.width + padding * 2}px`,
        height: `${rect.height + padding * 2}px`,
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }
  highlightStyle.value = null
}

watch(currentStep, () => {
  nextTick(updateHighlight)
})

function goToStep(i) {
  currentStep.value = i
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    localStorage.setItem('gastown-tutorial-complete', 'true')
    visible.value = false
    toast.success('Tutorial complete! Press ? for help anytime.')
    emit('complete')
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function close() {
  visible.value = false
  highlightStyle.value = null
}

function show() {
  currentStep.value = 0
  visible.value = true
  nextTick(updateHighlight)
}

function shouldShow() {
  return !localStorage.getItem('gastown-tutorial-complete')
}

function reset() {
  localStorage.removeItem('gastown-tutorial-complete')
}

// Clean up on unmount
onBeforeUnmount(() => {
  highlightStyle.value = null
})

defineExpose({ show, shouldShow, reset })
</script>

<style scoped>
.tutorial-highlight {
  position: fixed;
  z-index: calc(var(--z-modal) + 5);
  border: 2px solid var(--accent-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), var(--shadow-glow);
  pointer-events: none;
  transition: all var(--transition-base);
}

.tutorial-modal {
  position: fixed;
  z-index: calc(var(--z-modal) + 6);
  bottom: var(--space-xl);
  right: var(--space-xl);
  width: 420px;
  max-width: calc(100vw - var(--space-xl) * 2);
}

.tutorial-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-md) 0;
}

.tutorial-progress {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.tutorial-step-num {
  font-weight: 600;
  color: var(--accent-primary);
}

.tutorial-close {
  display: flex;
  align-items: center;
  padding: var(--space-xs);
  border-radius: var(--radius-md);
  color: var(--text-muted);
}
.tutorial-close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tutorial-title {
  font-size: var(--text-lg);
  font-weight: 600;
  padding: var(--space-sm) var(--space-md);
  color: var(--text-primary);
}

.tutorial-body {
  padding: 0 var(--space-md) var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}

.tutorial-body p {
  margin-bottom: var(--space-sm);
}

.tutorial-body ul, .tutorial-body ol {
  margin: var(--space-sm) 0;
  padding-left: var(--space-lg);
}

.tutorial-body li {
  margin-bottom: var(--space-xs);
}

.tutorial-body li .material-icons {
  font-size: 16px;
  vertical-align: middle;
  margin-right: var(--space-xs);
  color: var(--accent-primary);
}

.tutorial-body code {
  padding: 2px 6px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.tutorial-body kbd {
  padding: 2px 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
}

/* Footer */
.tutorial-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--border-muted);
}

.tutorial-dots {
  display: flex;
  gap: var(--space-xs);
}

.tutorial-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--border-default);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tutorial-dot.active {
  background: var(--accent-primary);
  transform: scale(1.3);
}

.tutorial-dot.completed {
  background: var(--accent-success);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn .material-icons {
  font-size: 16px;
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
  border: none;
}
.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-elevated);
}

/* Concepts */
.tutorial-concepts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin: var(--space-md) 0;
}

.concept-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.concept-pill .material-icons {
  font-size: 16px;
  color: var(--accent-primary);
}

/* Roles */
.role-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: var(--space-sm) 0;
}

.role-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
}

.role-item .material-icons {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.role-item div {
  display: flex;
  flex-direction: column;
}

.role-item strong {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.role-item span {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.role-mayor .material-icons { color: var(--role-mayor); }
.role-deacon .material-icons { color: var(--role-deacon); }
.role-polecat .material-icons { color: var(--role-polecat); }
.role-witness .material-icons { color: var(--role-witness); }
.role-refinery .material-icons { color: var(--role-refinery); }

/* Sling demo */
.sling-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  margin: var(--space-md) 0;
}

.sling-from, .sling-to {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
}

.sling-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--accent-primary);
  font-size: var(--text-xs);
}

/* Shortcut grid */
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
  margin: var(--space-md) 0;
}

.shortcut-grid div {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* Workflow checklist */
.workflow-checklist {
  list-style: none;
  padding: 0;
  margin: var(--space-md) 0;
}

.workflow-checklist li {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}

.workflow-checklist .material-icons {
  color: var(--accent-success);
}

/* Status dots */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  vertical-align: middle;
}

.status-dot.running { background: var(--status-running); }
.status-dot.working { background: var(--status-working); }
.status-dot.idle { background: var(--status-idle); }
</style>
