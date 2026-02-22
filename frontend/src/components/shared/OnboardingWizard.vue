<template>
  <Teleport to="body">
    <div v-if="visible" class="onboarding-wizard">
      <div class="wizard-backdrop" />
      <div class="wizard-container">
        <!-- Progress bar -->
        <div class="wizard-progress">
          <div
            v-for="(step, i) in steps"
            :key="step.id"
            class="progress-step"
            :class="{ active: i === currentStep, completed: i < currentStep }"
          >
            <div class="progress-dot">
              <span class="material-icons">{{ step.icon }}</span>
            </div>
            <span class="progress-label">{{ step.title }}</span>
          </div>
        </div>

        <!-- Content -->
        <div class="wizard-content">
          <div class="wizard-header">
            <div class="wizard-icon">
              <span class="material-icons">{{ activeStep.icon }}</span>
            </div>
            <div class="wizard-titles">
              <h2 class="wizard-title">{{ activeStep.title }}</h2>
              <p class="wizard-subtitle">{{ activeStep.subtitle }}</p>
            </div>
            <button class="wizard-close" title="Skip setup" @click="skip">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="wizard-body">
            <!-- Step: Welcome -->
            <div v-if="activeStep.id === 'welcome'" class="onboard-welcome">
              <p class="onboard-lead">Gas Town helps you run multiple AI agents working together on your codebase.</p>
              <div class="onboard-flow">
                <div class="flow-step"><span class="flow-icon">📝</span><span class="flow-label">Create Issue</span></div>
                <div class="flow-arrow">→</div>
                <div class="flow-step"><span class="flow-icon">🚀</span><span class="flow-label">Assign Work</span></div>
                <div class="flow-arrow">→</div>
                <div class="flow-step"><span class="flow-icon">🤖</span><span class="flow-label">Agent Works</span></div>
                <div class="flow-arrow">→</div>
                <div class="flow-step"><span class="flow-icon">✅</span><span class="flow-label">Done!</span></div>
              </div>
              <p class="onboard-note">This wizard will guide you through your first workflow.</p>
            </div>

            <!-- Step: Check Setup -->
            <div v-else-if="activeStep.id === 'check-setup'" class="onboard-checks">
              <div v-for="check in checks" :key="check.id" class="check-item" :class="check.status">
                <span class="check-status">
                  <span class="material-icons">{{ checkIcon(check.status) }}</span>
                </span>
                <span class="check-label">{{ check.label }}</span>
                <span class="check-detail">{{ check.detail }}</span>
              </div>
              <div v-if="checksComplete" class="onboard-setup-result">
                <div v-if="allChecksOk" class="setup-success">
                  <span class="material-icons">check_circle</span>
                  <span>All systems ready!</span>
                </div>
                <div v-else class="setup-issues">
                  <span class="material-icons">warning</span>
                  <span>Some setup needed - we'll help you fix it.</span>
                </div>
              </div>
            </div>

            <!-- Step: Add Rig -->
            <div v-else-if="activeStep.id === 'add-rig'" class="onboard-form">
              <p class="onboard-explain">A <strong>rig</strong> is a project container. It connects your GitHub repo to Gas Town so agents can work on it.</p>
              <div class="form-group">
                <label for="onboard-rig-name">Project Name</label>
                <input v-model="rigName" type="text" id="onboard-rig-name" placeholder="e.g., my-app, backend, website" autocomplete="off">
                <span class="form-hint">Short name for your project (lowercase, no spaces)</span>
              </div>
              <div class="form-group">
                <label for="onboard-rig-url">GitHub URL</label>
                <input v-model="rigUrl" type="text" id="onboard-rig-url" placeholder="https://github.com/you/repo.git" autocomplete="off">
                <span class="form-hint">Full URL to your git repository</span>
              </div>
            </div>

            <!-- Step: Create Bead -->
            <div v-else-if="activeStep.id === 'create-bead'" class="onboard-form">
              <p class="onboard-explain">A <strong>bead</strong> is a work item (like a GitHub issue). Let's create your first one!</p>
              <div class="form-group">
                <label for="onboard-bead-title">What needs to be done?</label>
                <input v-model="beadTitle" type="text" id="onboard-bead-title" placeholder="e.g., Fix login bug, Add dark mode, Update README">
              </div>
              <div class="form-group">
                <label for="onboard-bead-desc">Description (optional)</label>
                <textarea v-model="beadDesc" id="onboard-bead-desc" rows="3" placeholder="More details about the task..."></textarea>
              </div>
              <div v-if="createdBeadId" class="created-bead">
                <span class="material-icons">check_circle</span>
                <span>Created: <code>{{ createdBeadId }}</code></span>
              </div>
            </div>

            <!-- Step: Create Convoy -->
            <div v-else-if="activeStep.id === 'create-convoy'" class="onboard-form">
              <p class="onboard-explain">A <strong>convoy</strong> tracks progress across one or more issues. Think of it as your dashboard for a feature or task.</p>
              <div class="form-group">
                <label for="onboard-convoy-name">Convoy Name</label>
                <input v-model="convoyName" type="text" id="onboard-convoy-name" placeholder="e.g., First Task, Bug Fix, New Feature">
              </div>
              <div class="form-group">
                <label>Issue to Track</label>
                <div class="selected-bead">
                  <span class="material-icons">task_alt</span>
                  <code>{{ createdBeadId || 'No bead yet' }}</code>
                </div>
              </div>
              <div v-if="convoyCreated" class="created-convoy">
                <span class="material-icons">check_circle</span>
                <span>Convoy created!</span>
              </div>
            </div>

            <!-- Step: Sling Work -->
            <div v-else-if="activeStep.id === 'sling-work'" class="onboard-form">
              <p class="onboard-explain"><strong>Slinging</strong> assigns work to an agent. The agent will wake up, see the work on its "hook", and start working automatically.</p>
              <div class="form-group">
                <label>Issue to Sling</label>
                <div class="selected-bead">
                  <span class="material-icons">task_alt</span>
                  <code>{{ createdBeadId || 'No bead yet' }}</code>
                </div>
              </div>
              <div class="form-group">
                <label for="onboard-sling-target">Target Project</label>
                <select v-model="slingTarget" id="onboard-sling-target">
                  <option value="">Select a rig...</option>
                  <option v-for="rig in availableRigs" :key="rig" :value="rig">{{ rig }}</option>
                </select>
              </div>
              <div v-if="slingTarget && createdBeadId" class="sling-preview">
                <div class="sling-arrow-container">
                  <div class="sling-from">
                    <span class="material-icons">description</span>
                    <span>{{ createdBeadId }}</span>
                  </div>
                  <div class="sling-arrow">
                    <span class="material-icons">arrow_forward</span>
                  </div>
                  <div class="sling-to">
                    <span class="material-icons">smart_toy</span>
                    <span>{{ slingTarget }}</span>
                  </div>
                </div>
              </div>
              <div v-if="slingSuccess" class="sling-success">
                <span class="material-icons">rocket_launch</span>
                <span>Work assigned! Agent will start working.</span>
              </div>
            </div>

            <!-- Step: Complete -->
            <div v-else-if="activeStep.id === 'complete'" class="onboard-complete">
              <div class="complete-icon">🎉</div>
              <p class="complete-message">Congratulations! You've just:</p>
              <ul class="complete-list">
                <li><span class="material-icons">check</span> Created your first bead (issue)</li>
                <li><span class="material-icons">check</span> Set up a convoy to track it</li>
                <li><span class="material-icons">check</span> Assigned it to an agent</li>
              </ul>
              <div class="next-steps">
                <h4>What happens next?</h4>
                <p>The agent will work on your task. You can monitor progress in the <strong>Convoys</strong> dashboard.</p>
                <div class="tips">
                  <div class="tip">
                    <span class="material-icons">visibility</span>
                    <span>Watch the <strong>Activity</strong> feed for real-time updates</span>
                  </div>
                  <div class="tip">
                    <span class="material-icons">keyboard</span>
                    <span>Press <kbd>?</kbd> anytime for keyboard shortcuts</span>
                  </div>
                  <div class="tip">
                    <span class="material-icons">help</span>
                    <span>Click <strong>Help</strong> for the full guide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="wizard-error">
            <span class="material-icons">error</span>
            <span class="error-message">{{ errorMsg }}</span>
          </div>

          <!-- Footer -->
          <div class="wizard-footer">
            <button class="btn btn-secondary wizard-back" :disabled="currentStep === 0" @click="prevStep">
              <span class="material-icons">arrow_back</span> Back
            </button>
            <div class="wizard-step-indicator">
              Step {{ currentStep + 1 }} of {{ steps.length }}
            </div>
            <button class="btn btn-primary wizard-next" :disabled="actionRunning" @click="nextStep">
              <template v-if="actionRunning">
                <span class="material-icons spinning">sync</span> Working...
              </template>
              <template v-else-if="currentStep === steps.length - 1">
                Finish <span class="material-icons">check</span>
              </template>
              <template v-else>
                Next <span class="material-icons">arrow_forward</span>
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'

const toast = useToast()

const emit = defineEmits(['complete', 'skip'])

const visible = ref(false)
const currentStep = ref(0)
const errorMsg = ref('')
const actionRunning = ref(false)

// Form state
const rigName = ref('')
const rigUrl = ref('')
const beadTitle = ref('')
const beadDesc = ref('')
const convoyName = ref('')
const slingTarget = ref('')
const createdBeadId = ref('')
const convoyCreated = ref(false)
const slingSuccess = ref(false)
const availableRigs = ref([])

// Setup checks
const checks = ref([
  { id: 'gt', label: 'Gas Town CLI (gt)', status: 'checking', detail: '' },
  { id: 'bd', label: 'Beads CLI (bd)', status: 'checking', detail: '' },
  { id: 'workspace', label: 'Workspace initialized', status: 'checking', detail: '' },
  { id: 'rigs', label: 'Projects (rigs) configured', status: 'checking', detail: '' },
])
const checksComplete = ref(false)
const allChecksOk = computed(() => checks.value.every(c => c.status === 'ok'))

const steps = [
  { id: 'welcome', title: 'Welcome to Gas Town', subtitle: 'Multi-Agent Orchestrator for Claude Code', icon: 'waving_hand' },
  { id: 'check-setup', title: 'Checking Your Setup', subtitle: 'Making sure everything is installed', icon: 'build_circle' },
  { id: 'add-rig', title: 'Connect a Project', subtitle: 'Add your GitHub repository as a "rig"', icon: 'link' },
  { id: 'create-bead', title: 'Create Your First Issue', subtitle: 'Beads are git-tracked issues that agents work on', icon: 'add_task' },
  { id: 'create-convoy', title: 'Track Your Work', subtitle: 'Convoys group related issues for tracking', icon: 'local_shipping' },
  { id: 'sling-work', title: 'Assign to an Agent', subtitle: '"Sling" the work to a polecat (worker agent)', icon: 'send' },
  { id: 'complete', title: "You're All Set!", subtitle: 'Your first workflow is running', icon: 'celebration' },
]

const activeStep = computed(() => steps[currentStep.value])

function checkIcon(status) {
  const icons = { checking: 'hourglass_empty', ok: 'check_circle', warning: 'warning', error: 'error' }
  return icons[status] || 'hourglass_empty'
}

async function runSetupChecks() {
  checksComplete.value = false
  try {
    const status = await api.getSetupStatus()

    const update = (id, s, detail) => {
      const check = checks.value.find(c => c.id === id)
      if (check) { check.status = s; check.detail = detail }
    }

    await delay(200)
    update('gt', status.gt_installed ? 'ok' : 'error', status.gt_installed ? (status.gt_version || 'Installed') : 'Not found')

    await delay(200)
    update('bd', status.bd_installed ? 'ok' : 'error', status.bd_installed ? (status.bd_version || 'Installed') : 'Not found')

    await delay(200)
    update('workspace', status.workspace_initialized ? 'ok' : 'warning', status.workspace_initialized ? (status.workspace_path || '~/gt') : 'Run: gt install ~/gt')

    await delay(200)
    update('rigs', status.rigs?.length > 0 ? 'ok' : 'warning', status.rigs?.length > 0 ? `${status.rigs.length} project(s)` : 'No projects yet')

    // If rigs exist, skip the add-rig step later
    if (status.rigs?.length > 0) {
      availableRigs.value = status.rigs.map(r => r.name || r)
    }

    checksComplete.value = true
  } catch (err) {
    checks.value.forEach(c => { c.status = 'error'; c.detail = 'Check failed' })
    checksComplete.value = true
  }
}

async function loadRigs() {
  try {
    const status = await api.getSetupStatus()
    const rigs = status.rigs || []
    availableRigs.value = rigs.map(r => r.name || r)
  } catch {
    // ignore
  }
}

// Watch step changes for side effects
watch(currentStep, async (step) => {
  errorMsg.value = ''
  if (steps[step].id === 'check-setup') {
    await runSetupChecks()
  } else if (steps[step].id === 'sling-work') {
    await loadRigs()
  }
})

function validate() {
  const step = activeStep.value
  if (step.id === 'add-rig') {
    if (!rigName.value.trim()) return 'Please enter a project name'
    if (!rigUrl.value.trim()) return 'Please enter a GitHub URL'
    if (!/^[a-z0-9-]+$/.test(rigName.value.trim())) return 'Name must be lowercase letters, numbers, and hyphens only'
    if (!rigUrl.value.includes('github.com')) return 'Please enter a valid GitHub URL'
  } else if (step.id === 'create-bead') {
    if (!beadTitle.value.trim()) return 'Please enter a title for your issue'
  } else if (step.id === 'create-convoy') {
    if (!convoyName.value.trim()) return 'Please enter a convoy name'
  } else if (step.id === 'sling-work') {
    if (!slingTarget.value) return 'Please select a target project'
  }
  return null
}

async function runAction() {
  const step = activeStep.value
  if (step.id === 'add-rig') {
    const result = await api.addRig(rigName.value.trim(), rigUrl.value.trim())
    if (!result.success) throw new Error(result.error || 'Failed to add rig')
    availableRigs.value.push(rigName.value.trim())
  } else if (step.id === 'create-bead') {
    const result = await api.createBead(beadTitle.value.trim(), { description: beadDesc.value.trim() })
    if (!result.success) throw new Error(result.error || 'Failed to create bead')
    if (result.bead_id) createdBeadId.value = result.bead_id
  } else if (step.id === 'create-convoy') {
    const result = await api.createConvoy(convoyName.value.trim(), createdBeadId.value ? [createdBeadId.value] : [])
    if (!result.success) throw new Error(result.error || 'Failed to create convoy')
    convoyCreated.value = true
  } else if (step.id === 'sling-work') {
    if (!createdBeadId.value) throw new Error('No bead to sling')
    const result = await api.sling(createdBeadId.value, slingTarget.value)
    if (!result.success) throw new Error(result.error || 'Failed to sling work')
    slingSuccess.value = true
  }
}

const hasAction = computed(() => ['add-rig', 'create-bead', 'create-convoy', 'sling-work'].includes(activeStep.value.id))

async function nextStep() {
  errorMsg.value = ''

  // Validate
  const err = validate()
  if (err) {
    errorMsg.value = err
    return
  }

  // Run action
  if (hasAction.value) {
    actionRunning.value = true
    try {
      await runAction()
    } catch (e) {
      errorMsg.value = e.message
      actionRunning.value = false
      return
    }
    actionRunning.value = false
  }

  // Advance or finish
  if (currentStep.value < steps.length - 1) {
    let next = currentStep.value + 1
    // Skip add-rig if rigs already exist
    if (steps[next].id === 'add-rig' && availableRigs.value.length > 0) {
      next++
    }
    currentStep.value = next
  } else {
    completeOnboarding()
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    let prev = currentStep.value - 1
    // Skip add-rig going backwards too
    if (steps[prev].id === 'add-rig' && availableRigs.value.length > 0) {
      prev--
    }
    currentStep.value = Math.max(0, prev)
  }
}

function completeOnboarding() {
  localStorage.setItem('gastown-onboarding-complete', 'true')
  visible.value = false
  toast.success('Setup complete! Welcome to Gas Town.')
  emit('complete')
}

function skip() {
  if (confirm('Skip the setup wizard? You can access it later from the Help menu.')) {
    localStorage.setItem('gastown-onboarding-skipped', 'true')
    visible.value = false
    emit('skip')
  }
}

async function shouldShow() {
  try {
    const completed = localStorage.getItem('gastown-onboarding-complete')
    if (completed) return false
    const status = await api.getSetupStatus()
    return !status.rigs || status.rigs.length === 0
  } catch {
    return false
  }
}

function show() {
  currentStep.value = 0
  visible.value = true
}

function reset() {
  localStorage.removeItem('gastown-onboarding-complete')
  localStorage.removeItem('gastown-onboarding-skipped')
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

defineExpose({ shouldShow, show, reset })
</script>

<style scoped>
.onboarding-wizard {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-modal) + 10);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wizard-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.wizard-container {
  position: relative;
  display: flex;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 900px;
  width: 90vw;
  max-height: 85vh;
  overflow: hidden;
}

/* Progress sidebar */
.wizard-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-lg);
  background: var(--bg-primary);
  border-right: 1px solid var(--border-default);
  min-width: 200px;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.progress-step.active {
  color: var(--accent-primary);
  background: rgba(88, 166, 255, 0.1);
}

.progress-step.completed {
  color: var(--accent-success);
}

.progress-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  border: 2px solid currentColor;
  flex-shrink: 0;
}

.progress-dot .material-icons {
  font-size: 16px;
}

.progress-label {
  font-size: var(--text-sm);
  white-space: nowrap;
}

/* Content area */
.wizard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wizard-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-muted);
}

.wizard-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent-primary);
  flex-shrink: 0;
}

.wizard-icon .material-icons {
  font-size: 28px;
}

.wizard-titles {
  flex: 1;
}

.wizard-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.wizard-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-xxs);
}

.wizard-close {
  display: flex;
  align-items: center;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  color: var(--text-muted);
}
.wizard-close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.wizard-body {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

/* Footer */
.wizard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-muted);
}

.wizard-step-indicator {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
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
  font-size: 18px;
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

/* Error */
.wizard-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  color: var(--accent-danger);
  font-size: var(--text-sm);
}

/* Welcome step */
.onboard-welcome { text-align: center; }

.onboard-lead {
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.onboard-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin: var(--space-lg) 0;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.flow-icon {
  font-size: 2rem;
}

.flow-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.flow-arrow {
  font-size: var(--text-xl);
  color: var(--text-muted);
}

.onboard-note {
  color: var(--text-secondary);
  margin-top: var(--space-md);
}

/* Check step */
.onboard-checks {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.check-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
}

.check-item.checking .check-status { color: var(--text-muted); }
.check-item.ok .check-status { color: var(--accent-success); }
.check-item.warning .check-status { color: var(--accent-warning); }
.check-item.error .check-status { color: var(--accent-danger); }

.check-label {
  flex: 1;
  font-size: var(--text-sm);
}

.check-detail {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.onboard-setup-result {
  margin-top: var(--space-md);
}

.setup-success, .setup-issues {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.setup-success {
  background: rgba(63, 185, 80, 0.1);
  color: var(--accent-success);
}

.setup-issues {
  background: rgba(210, 153, 34, 0.1);
  color: var(--accent-warning);
}

/* Form steps */
.onboard-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.onboard-explain {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.selected-bead {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.selected-bead .material-icons {
  color: var(--accent-primary);
  font-size: 18px;
}

.created-bead, .created-convoy, .sling-success {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(63, 185, 80, 0.1);
  border-radius: var(--radius-md);
  color: var(--accent-success);
  font-size: var(--text-sm);
}

/* Sling preview */
.sling-preview {
  margin-top: var(--space-sm);
}

.sling-arrow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.sling-from, .sling-to {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
}

.sling-arrow {
  color: var(--accent-primary);
}

/* Complete step */
.onboard-complete {
  text-align: center;
}

.complete-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.complete-message {
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.complete-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.complete-list li {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--accent-success);
  font-size: var(--text-sm);
}

.next-steps {
  text-align: left;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.next-steps h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.next-steps p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.tips {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.tip {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.tip .material-icons {
  font-size: 18px;
  color: var(--accent-primary);
}

kbd {
  padding: 2px 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
}

/* Spinning animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spinning {
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .wizard-container {
    flex-direction: column;
  }
  .wizard-progress {
    flex-direction: row;
    overflow-x: auto;
    min-width: unset;
    border-right: none;
    border-bottom: 1px solid var(--border-default);
  }
  .progress-label {
    display: none;
  }
}
</style>
