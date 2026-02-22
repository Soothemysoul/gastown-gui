<template>
  <BaseModal
    v-model="visible"
    title="Add New Rig"
    icon="add_circle"
    size="lg"
    @close="resetForm"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Rig Name</label>
        <input
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="my_project"
          @input="sanitizeName"
        />
        <span class="form-hint">Underscores only (hyphens/dots/spaces auto-replaced)</span>
      </div>

      <div class="form-group">
        <label>Repository URL or Local Path</label>
        <input v-model="form.url" type="text" class="form-input" placeholder="https://github.com/user/repo or /path/to/repo" />
      </div>

      <!-- Repo picker tabs -->
      <div class="repo-picker">
        <div class="repo-tabs">
          <button
            type="button"
            class="repo-tab"
            :class="{ active: activeProvider === 'github' }"
            @click="activeProvider = 'github'"
          >
            <span class="material-icons">code</span> GitHub
          </button>
          <button
            type="button"
            class="repo-tab"
            :class="{ active: activeProvider === 'gitlab' }"
            @click="activeProvider = 'gitlab'"
          >
            <span class="material-icons">code</span> GitLab
          </button>
        </div>

        <!-- GitHub picker -->
        <div v-show="activeProvider === 'github'" class="repo-picker-panel">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            :disabled="ghLoading"
            @click="loadGitHubRepos"
          >
            <span v-if="ghLoading" class="material-icons spinning">sync</span>
            <span v-else class="material-icons">refresh</span>
            {{ ghRepos ? 'Refresh List' : 'Load My Repositories' }}
          </button>

          <div v-if="ghRepos" class="repo-list-section">
            <input
              v-model="ghSearch"
              type="text"
              class="form-input repo-search"
              placeholder="Filter repositories..."
            />
            <div class="repo-list">
              <div v-if="filteredGhRepos.length === 0" class="repo-empty">No repositories found</div>
              <div
                v-for="repo in filteredGhRepos"
                :key="repo.url"
                class="repo-item"
                :class="{ private: repo.isPrivate }"
                @click="selectRepo(repo)"
              >
                <span class="material-icons repo-icon">{{ repo.isPrivate ? 'lock' : 'public' }}</span>
                <div class="repo-info">
                  <div class="repo-name">{{ repo.nameWithOwner }}</div>
                  <div class="repo-desc">{{ repo.description || 'No description' }}</div>
                </div>
                <div v-if="repo.primaryLanguage" class="repo-meta">
                  <span class="repo-lang">
                    <span class="lang-dot" :style="{ background: getLanguageColor(repo.primaryLanguage.name) }"></span>
                    {{ repo.primaryLanguage.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GitLab picker -->
        <div v-show="activeProvider === 'gitlab'" class="repo-picker-panel">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            :disabled="glLoading"
            @click="loadGitLabRepos"
          >
            <span v-if="glLoading" class="material-icons spinning">sync</span>
            <span v-else class="material-icons">refresh</span>
            {{ glRepos ? 'Refresh List' : 'Load My Repositories' }}
          </button>

          <div v-if="glRepos" class="repo-list-section">
            <input
              v-model="glSearch"
              type="text"
              class="form-input repo-search"
              placeholder="Filter repositories..."
            />
            <div class="repo-list">
              <div v-if="filteredGlRepos.length === 0" class="repo-empty">No repositories found</div>
              <div
                v-for="repo in filteredGlRepos"
                :key="repo.url"
                class="repo-item"
                :class="{ private: repo.isPrivate }"
                @click="selectRepo(repo)"
              >
                <span class="material-icons repo-icon">{{ repo.isPrivate ? 'lock' : 'public' }}</span>
                <div class="repo-info">
                  <div class="repo-name">{{ repo.nameWithOwner }}</div>
                  <div class="repo-desc">{{ repo.description || 'No description' }}</div>
                </div>
                <div v-if="repo.primaryLanguage" class="repo-meta">
                  <span class="repo-lang">
                    <span class="lang-dot" :style="{ background: getLanguageColor(repo.primaryLanguage.name) }"></span>
                    {{ repo.primaryLanguage.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="visible = false">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting || !form.name || !form.url">
          <span v-if="submitting" class="material-icons spinning">sync</span>
          <span v-else class="material-icons">add</span>
          {{ submitting ? 'Adding...' : 'Add Rig' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useApi } from '../../composables/useApi'
import { useToast } from '../../composables/useToast'
import { useUiStore } from '../../stores/uiStore'

const api = useApi()
const toast = useToast()
const uiStore = useUiStore()

const visible = computed({
  get: () => uiStore.activeModal === 'new-rig',
  set: (v) => { if (!v) uiStore.closeModal() },
})

const form = reactive({ name: '', url: '' })
const submitting = ref(false)
const activeProvider = ref('github')

// GitHub state
const ghRepos = ref(null)
const ghLoading = ref(false)
const ghSearch = ref('')

// GitLab state
const glRepos = ref(null)
const glLoading = ref(false)
const glSearch = ref('')

const filteredGhRepos = computed(() => {
  if (!ghRepos.value) return []
  const q = ghSearch.value.toLowerCase()
  if (!q) return ghRepos.value
  return ghRepos.value.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.nameWithOwner.toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q)
  )
})

const filteredGlRepos = computed(() => {
  if (!glRepos.value) return []
  const q = glSearch.value.toLowerCase()
  if (!q) return glRepos.value
  return glRepos.value.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.nameWithOwner.toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q)
  )
})

function sanitizeName() {
  form.name = form.name.replace(/[-.\s]+/g, '_')
}

async function loadGitHubRepos() {
  ghLoading.value = true
  try {
    ghRepos.value = await api.getGitHubRepos({ limit: 100 })
  } catch (err) {
    toast.error(`Failed to load repos: ${err.message}`)
  } finally {
    ghLoading.value = false
  }
}

async function loadGitLabRepos() {
  glLoading.value = true
  try {
    // GitLab repos use the same endpoint pattern
    glRepos.value = await api.get('/api/gitlab/repos?limit=100')
  } catch (err) {
    toast.error(`Failed to load GitLab repos: ${err.message}`)
  } finally {
    glLoading.value = false
  }
}

function selectRepo(repo) {
  form.name = repo.name.replace(/[-.\s]+/g, '_')
  form.url = repo.url
  toast.success(`Selected: ${repo.name}`)
}

function getLanguageColor(lang) {
  const colors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', Java: '#b07219',
  }
  return colors[lang] || '#8b949e'
}

async function handleSubmit() {
  if (!form.name || !form.url) {
    toast.warning('Please enter both name and path')
    return
  }

  submitting.value = true
  try {
    const result = await api.addRig(form.name, form.url)
    if (result.success) {
      toast.success(`Rig "${form.name}" added successfully`)
      visible.value = false
    } else {
      toast.error(`Failed to add rig: ${result.error}`)
    }
  } catch (err) {
    toast.error(`Failed to add rig: ${err.message}`)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.name = ''
  form.url = ''
  ghSearch.value = ''
  glSearch.value = ''
  activeProvider.value = 'github'
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
.form-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
}
.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.form-hint {
  display: block;
  margin-top: var(--space-xxs);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

/* Repo picker */
.repo-picker {
  margin-top: var(--space-md);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.repo-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-default);
}
.repo-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
}
.repo-tab.active {
  color: var(--accent-primary);
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--accent-primary);
}
.repo-picker-panel {
  padding: var(--space-md);
}
.repo-list-section {
  margin-top: var(--space-sm);
}
.repo-search {
  margin-bottom: var(--space-sm);
}
.repo-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
}
.repo-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--border-muted);
}
.repo-item:last-child { border-bottom: none; }
.repo-item:hover { background: var(--bg-hover); }
.repo-icon {
  font-size: var(--text-lg);
  color: var(--text-muted);
  flex-shrink: 0;
}
.repo-info {
  flex: 1;
  min-width: 0;
}
.repo-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--accent-primary);
}
.repo-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.repo-meta {
  flex-shrink: 0;
}
.repo-lang {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
.lang-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.repo-empty {
  padding: var(--space-lg);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
}
.btn-sm { padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); }
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover { background: var(--bg-hover); }

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
