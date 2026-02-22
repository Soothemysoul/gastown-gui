<template>
  <div class="view mail-view">
    <div class="view-header">
      <h1>Mail</h1>
      <div class="view-header-actions">
        <FilterGroup
          v-model:modelValue="filterValue"
          :options="filterOptions"
        />
        <button class="btn btn-primary btn-sm" @click="uiStore.openModal('mail-compose')">
          <span class="material-icons">edit</span>
          Compose
        </button>
        <button class="btn btn-icon btn-sm" title="Refresh" @click="refresh">
          <span class="material-icons" :class="{ spin: mailStore.loading }">refresh</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="mailStore.loading && !mailStore.mail.length" message="Loading mail..." />
    <ErrorState v-else-if="mailStore.error && !mailStore.mail.length" :message="mailStore.error" @retry="refresh" />
    <EmptyState
      v-else-if="!sortedMail.length"
      :icon="mailStore.filter === 'all' ? 'forum' : 'mail'"
      :message="mailStore.filter === 'all' ? 'No system mail yet' : 'Your inbox is empty'"
    />
    <div v-else class="mail-list">
      <MailItem
        v-for="item in sortedMail"
        :key="item.id"
        :mail="item"
        @detail="handleDetail"
        @toggle-read="handleToggleRead"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useMailStore } from '../../stores/mailStore'
import { useUiStore } from '../../stores/uiStore'
import { usePolling } from '../../composables/usePolling'
import { useToast } from '../../composables/useToast'
import FilterGroup from '../shared/FilterGroup.vue'
import LoadingState from '../shared/LoadingState.vue'
import ErrorState from '../shared/ErrorState.vue'
import EmptyState from '../shared/EmptyState.vue'
import MailItem from './MailItem.vue'

const mailStore = useMailStore()
const uiStore = useUiStore()
const toast = useToast()

const filterOptions = [
  { value: 'mine', label: 'My Mail' },
  { value: 'all', label: 'All Mail' },
]

const filterValue = computed({
  get: () => mailStore.filter,
  set: (val) => {
    mailStore.setFilter(val)
    mailStore.fetchMail()
  },
})

const sortedMail = computed(() => {
  return [...mailStore.mail].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  })
})

async function refresh() {
  await mailStore.fetchMail()
}

function handleDetail(mail) {
  mailStore.markMailRead(mail.id)
  uiStore.openModal('mail-detail', { mailId: mail.id, mail })
}

async function handleToggleRead(mailId, markAsRead) {
  try {
    if (markAsRead) {
      await mailStore.markMailRead(mailId)
    } else {
      await mailStore.markMailUnread(mailId)
    }
    toast.success(`Mail marked as ${markAsRead ? 'read' : 'unread'}`)
  } catch (err) {
    toast.error(`Error: ${err.message}`)
  }
}

const polling = usePolling(refresh, 10000)

onMounted(async () => {
  await mailStore.fetchMail()
  polling.start()
})
</script>

<style scoped>
.mail-view {
  padding: var(--space-lg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
}
.view-header h1 {
  font-size: var(--text-lg);
  font-weight: 700;
}
.view-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.mail-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
