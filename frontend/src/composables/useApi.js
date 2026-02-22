/**
 * useApi composable — HTTP client for /api/* endpoints
 *
 * Ported from js/api.js REST methods.
 * All methods return Promises that resolve to parsed JSON.
 */

const API_BASE = window.location.origin

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    const error = new Error(errorData.error || 'Request failed')
    if (errorData.errorType) {
      error.errorType = errorData.errorType
      error.errorData = errorData
    }
    throw error
  }

  return response.json()
}

function get(endpoint) {
  return request(endpoint)
}

function post(endpoint, body) {
  return request(endpoint, { method: 'POST', body })
}

const api = {
  request,
  get,
  post,

  // === Status ===
  getStatus(force = false) {
    return get(force ? '/api/status?refresh=true' : '/api/status')
  },
  getHealth() {
    return get('/api/health')
  },

  // === Convoys ===
  getConvoys(params = {}) {
    const query = new URLSearchParams(params).toString()
    return get(`/api/convoys${query ? '?' + query : ''}`)
  },
  getConvoy(id) {
    return get(`/api/convoy/${id}`)
  },
  createConvoy(name, issues = [], notify = null) {
    return post('/api/convoy', { name, issues, notify })
  },

  // === Work / Sling ===
  sling(bead, target, options = {}) {
    return post('/api/sling', {
      bead,
      target,
      molecule: options.molecule,
      quality: options.quality,
      args: options.args,
    })
  },
  getHook() {
    return get('/api/hook')
  },

  // === Mail ===
  getMail() {
    return get('/api/mail')
  },
  getAllMail() {
    return get('/api/mail/all')
  },
  getMailMessage(id) {
    return get(`/api/mail/${encodeURIComponent(id)}`)
  },
  sendMail(to, subject, message, priority = 'normal') {
    return post('/api/mail', { to, subject, message, priority })
  },
  markMailRead(id) {
    return post(`/api/mail/${encodeURIComponent(id)}/read`)
  },
  markMailUnread(id) {
    return post(`/api/mail/${encodeURIComponent(id)}/unread`)
  },

  // === Agents ===
  getAgents() {
    return get('/api/agents')
  },
  nudge(target, message, autoStart = true) {
    return post('/api/nudge', { target, message, autoStart })
  },
  getMayorMessages(limit = 50) {
    return get(`/api/mayor/messages?limit=${limit}`)
  },
  getMayorOutput(lines = 100) {
    return get(`/api/mayor/output?lines=${lines}`)
  },

  // === Beads ===
  createBead(title, options = {}) {
    return post('/api/beads', {
      title,
      description: options.description,
      priority: options.priority,
      labels: options.labels,
    })
  },
  getBead(beadId) {
    return get(`/api/bead/${encodeURIComponent(beadId)}`)
  },
  getBeadLinks(beadId) {
    return get(`/api/bead/${encodeURIComponent(beadId)}/links`)
  },
  getBeads(status) {
    return get(`/api/beads${status && status !== 'all' ? `?status=${status}` : ''}`)
  },
  searchBeads(query) {
    return get(`/api/beads/search?q=${encodeURIComponent(query)}`)
  },

  // === Work Actions ===
  markWorkDone(beadId, summary) {
    return post(`/api/work/${encodeURIComponent(beadId)}/done`, { summary })
  },
  parkWork(beadId, reason) {
    return post(`/api/work/${encodeURIComponent(beadId)}/park`, { reason })
  },
  releaseWork(beadId) {
    return post(`/api/work/${encodeURIComponent(beadId)}/release`)
  },
  reassignWork(beadId, target) {
    return post(`/api/work/${encodeURIComponent(beadId)}/reassign`, { target })
  },

  // === Formulas ===
  getFormulas() {
    return get('/api/formulas')
  },
  getFormula(name) {
    return get(`/api/formula/${encodeURIComponent(name)}`)
  },
  createFormula(name, description, template) {
    return post('/api/formulas', { name, description, template })
  },
  useFormula(name, target, args) {
    return post(`/api/formula/${encodeURIComponent(name)}/use`, { target, args })
  },
  updateFormula(name, description, template) {
    return request(`/api/formula/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, template }),
    })
  },
  deleteFormula(name) {
    return request(`/api/formula/${encodeURIComponent(name)}`, { method: 'DELETE' })
  },
  searchFormulas(query) {
    return get(`/api/formulas/search?q=${encodeURIComponent(query)}`)
  },

  // === Targets ===
  getTargets() {
    return get('/api/targets')
  },

  // === Escalation ===
  escalate(convoyId, reason, priority = 'normal') {
    return post('/api/escalate', { convoy_id: convoyId, reason, priority })
  },

  // === Setup & Onboarding ===
  getSetupStatus() {
    return get('/api/setup/status')
  },

  // === Rigs ===
  getRigs() {
    return get('/api/rigs')
  },
  addRig(name, url) {
    return post('/api/rigs', { name, url })
  },
  removeRig(name) {
    return request(`/api/rigs/${encodeURIComponent(name)}`, { method: 'DELETE' })
  },
  parkRig(name) {
    return post(`/api/rigs/${encodeURIComponent(name)}/park`, {})
  },
  unparkRig(name) {
    return post(`/api/rigs/${encodeURIComponent(name)}/unpark`, {})
  },
  bootRig(name) {
    return post(`/api/rigs/${encodeURIComponent(name)}/boot`, {})
  },

  // === Crew Management ===
  getCrews() {
    return get('/api/crews')
  },
  getCrewStatus(name) {
    return get(`/api/crew/${encodeURIComponent(name)}/status`)
  },
  addCrew(name, rig) {
    return post('/api/crews', { name, rig })
  },
  removeCrew(name) {
    return request(`/api/crew/${encodeURIComponent(name)}`, { method: 'DELETE' })
  },

  // === Doctor ===
  runDoctor(options = {}) {
    const params = options.refresh ? '?refresh=true' : ''
    return get(`/api/doctor${params}`)
  },
  runDoctorFix() {
    return post('/api/doctor/fix')
  },

  // === Polecat Output ===
  getPeekOutput(rig, name) {
    return get(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/output`)
  },
  getAgentTranscript(rig, name) {
    return get(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/transcript`)
  },

  // === Agent Controls ===
  startAgent(rig, name) {
    return post(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/start`)
  },
  stopAgent(rig, name) {
    return post(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/stop`)
  },
  restartAgent(rig, name) {
    return post(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/restart`)
  },

  // === Service Controls ===
  startService(name, rig) {
    return post(`/api/service/${encodeURIComponent(name)}/up`, rig ? { rig } : undefined)
  },
  stopService(name, rig) {
    return post(`/api/service/${encodeURIComponent(name)}/down`, rig ? { rig } : undefined)
  },
  restartService(name, rig) {
    return post(`/api/service/${encodeURIComponent(name)}/restart`, rig ? { rig } : undefined)
  },
  getServiceStatus(name) {
    return get(`/api/service/${encodeURIComponent(name)}/status`)
  },

  // === GitHub Integration ===
  getGitHubPRs(state = 'open') {
    return get(`/api/github/prs?state=${encodeURIComponent(state)}`)
  },
  getGitHubPR(repo, number) {
    return get(`/api/github/pr/${encodeURIComponent(repo)}/${number}`)
  },
  getGitHubIssues(state = 'open') {
    return get(`/api/github/issues?state=${encodeURIComponent(state)}`)
  },
  getGitHubIssue(repo, number) {
    return get(`/api/github/issue/${encodeURIComponent(repo)}/${number}`)
  },
  getGitHubRepos(options = {}) {
    const params = new URLSearchParams()
    if (options.limit) params.set('limit', options.limit)
    if (options.visibility) params.set('visibility', options.visibility)
    if (options.refresh) params.set('refresh', 'true')
    const query = params.toString()
    return get(`/api/github/repos${query ? '?' + query : ''}`)
  },
}

export function useApi() {
  return api
}

export { api }
