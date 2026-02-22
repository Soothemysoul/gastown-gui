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

    <!-- Detail modals -->
    <ConvoyDetailModal />
    <AgentDetailModal />
    <NudgeModal />
    <MailDetailModal />
    <BeadDetailModal />

    <ToastContainer />

    <!-- Onboarding & Tutorial overlays -->
    <OnboardingWizard ref="onboardingWizard" @complete="onOnboardingComplete" />
    <TutorialOverlay ref="tutorialOverlay" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
import ConvoyDetailModal from './components/modals/ConvoyDetailModal.vue'
import AgentDetailModal from './components/modals/AgentDetailModal.vue'
import NudgeModal from './components/modals/NudgeModal.vue'
import MailDetailModal from './components/modals/MailDetailModal.vue'
import BeadDetailModal from './components/modals/BeadDetailModal.vue'
import OnboardingWizard from './components/shared/OnboardingWizard.vue'
import TutorialOverlay from './components/shared/TutorialOverlay.vue'

const statusStore = useStatusStore()
const eventStore = useEventStore()
const mailStore = useMailStore()

const onboardingWizard = ref(null)
const tutorialOverlay = ref(null)

// WebSocket singleton — connects on mount via ref-counting
useWebSocket()

// Keyboard shortcuts
useKeyboardShortcuts()

// Global refresh handler (triggered by Ctrl+R shortcut)
function handleRefresh() {
  statusStore.fetchStatus(true)
  mailStore.fetchMail()
}

function onOnboardingComplete() {
  // After onboarding, offer the tutorial
  if (tutorialOverlay.value?.shouldShow()) {
    tutorialOverlay.value.show()
  }
  // Refresh data after onboarding actions
  statusStore.fetchStatus(true)
}

onMounted(async () => {
  window.addEventListener('gastown:refresh', handleRefresh)

  // Load initial data
  await statusStore.fetchStatus()
  mailStore.fetchMail()
  eventStore.loadMayorHistory()

  // Check if onboarding should auto-start
  if (onboardingWizard.value) {
    const shouldOnboard = await onboardingWizard.value.shouldShow()
    if (shouldOnboard) {
      onboardingWizard.value.show()
    } else if (tutorialOverlay.value?.shouldShow()) {
      // If onboarding done but tutorial not yet shown, show tutorial
      tutorialOverlay.value.show()
    }
  }
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
