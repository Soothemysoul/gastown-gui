<template>
  <div id="gas-town-app">
    <AppHeader />
    <main class="main">
      <AppSidebar />
      <section class="content">
        <router-view />
      </section>
      <ActivityFeed />
    </main>
    <StatusBar />

    <!-- Modal teleport target -->
    <div id="modal-target"></div>

    <!-- Simple modals -->
    <NewConvoyModal />
    <NewBeadModal />
    <MailComposeModal />
    <HelpModal />
    <EscalationModal />

    <!-- Complex modals -->
    <SlingModal />
    <NewRigModal />
    <PeekModal />
    <NewFormulaModal />
    <NewCrewModal />

    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStatusStore } from './stores/statusStore'
import { useWebSocket } from './composables/useWebSocket'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useEventStore } from './stores/eventStore'
import { useMailStore } from './stores/mailStore'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import ActivityFeed from './components/layout/ActivityFeed.vue'
import StatusBar from './components/layout/StatusBar.vue'
import ToastContainer from './components/shared/ToastContainer.vue'
import NewConvoyModal from './components/modals/NewConvoyModal.vue'
import NewBeadModal from './components/modals/NewBeadModal.vue'
import MailComposeModal from './components/modals/MailComposeModal.vue'
import HelpModal from './components/modals/HelpModal.vue'
import EscalationModal from './components/modals/EscalationModal.vue'
import SlingModal from './components/modals/SlingModal.vue'
import NewRigModal from './components/modals/NewRigModal.vue'
import PeekModal from './components/modals/PeekModal.vue'
import NewFormulaModal from './components/modals/NewFormulaModal.vue'
import NewCrewModal from './components/modals/NewCrewModal.vue'

const statusStore = useStatusStore()
const eventStore = useEventStore()
const mailStore = useMailStore()

// WebSocket singleton — connects on mount via ref-counting
useWebSocket()

// Keyboard shortcuts
useKeyboardShortcuts()

// Global refresh handler (triggered by Ctrl+R shortcut)
function handleRefresh() {
  statusStore.fetchStatus(true)
  mailStore.fetchMail()
}

onMounted(async () => {
  window.addEventListener('gastown:refresh', handleRefresh)

  // Load initial data
  await statusStore.fetchStatus()
  mailStore.fetchMail()
  eventStore.loadMayorHistory()
})
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

button {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

#gas-town-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}
</style>
