<template>
  <BaseModal
    :show="isOpen('mail-compose')"
    title="Compose Mail"
    @close="close"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="mail-to">Recipient</label>
        <select id="mail-to" v-model="form.to" required>
          <option value="" disabled>Select recipient...</option>
          <optgroup label="Common Recipients">
            <option value="mayor/">Mayor</option>
            <option value="human">Human Overseer</option>
          </optgroup>
          <optgroup v-for="group in agentGroups" :key="group.label" :label="group.label">
            <option
              v-for="agent in group.agents"
              :key="agent.id"
              :value="agent.path || agent.id || agent.name"
            >
              {{ agent.name || agent.id }}
            </option>
          </optgroup>
        </select>
      </div>
      <div class="form-group">
        <label for="mail-subject">Subject</label>
        <input
          id="mail-subject"
          v-model="form.subject"
          type="text"
          placeholder="Mail subject..."
          required
          autocomplete="off"
        >
      </div>
      <div class="form-group">
        <label for="mail-message">Message</label>
        <textarea
          id="mail-message"
          v-model="form.message"
          rows="6"
          placeholder="Your message..."
          required
        ></textarea>
      </div>
      <div class="form-group">
        <label for="mail-priority">Priority</label>
        <select id="mail-priority" v-model="form.priority">
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">send</span>
          {{ submitting ? 'Sending...' : 'Send Mail' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '../../composables/useModal'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useAgentStore } from '../../stores/agentStore'

const { isOpen, close, modalData } = useModal()
const api = useApi()
const toast = useToast()
const agentStore = useAgentStore()

const form = reactive({
  to: '',
  subject: '',
  message: '',
  priority: 'normal',
})
const submitting = ref(false)

// Group agents by role for the dropdown
const agentGroups = computed(() => {
  const agents = agentStore.agents
  const roleMap = new Map()
  const roleOrder = ['deacon', 'witness', 'refinery', 'polecat']

  agents.forEach(agent => {
    const role = (agent.role || agent.type || 'worker').toLowerCase()
    if (!roleMap.has(role)) roleMap.set(role, [])
    roleMap.get(role).push(agent)
  })

  const groups = []
  // Add roles in order
  for (const role of roleOrder) {
    const list = roleMap.get(role)
    if (list && list.length > 0) {
      groups.push({ label: capitalize(role) + 's', agents: list })
    }
  }
  // Add remaining roles
  roleMap.forEach((list, role) => {
    if (!roleOrder.includes(role) && list.length > 0) {
      groups.push({ label: capitalize(role) + 's', agents: list })
    }
  })

  return groups
})

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Reset form and pre-fill reply data when modal opens
watch(() => isOpen('mail-compose'), (open) => {
  if (open) {
    form.to = ''
    form.subject = ''
    form.message = ''
    form.priority = 'normal'

    // Pre-fill if replying
    const data = modalData.value
    if (data) {
      if (data.replyTo) form.to = data.replyTo
      if (data.subject) form.subject = `Re: ${data.subject}`
    }

    // Ensure agents are loaded for the dropdown
    if (agentStore.agents.length === 0) {
      agentStore.fetchAgents()
    }
  }
})

async function handleSubmit() {
  if (!form.to || !form.subject.trim() || !form.message.trim()) {
    toast.warning('Please fill in all fields')
    return
  }

  submitting.value = true
  try {
    await api.sendMail(form.to, form.subject.trim(), form.message.trim(), form.priority)
    toast.success('Mail sent')
    close()
  } catch (err) {
    toast.error(`Failed to send mail: ${err.message}`)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: var(--space-md);
}
.form-group label {
  display: block;
  margin-bottom: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
}
.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
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
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
