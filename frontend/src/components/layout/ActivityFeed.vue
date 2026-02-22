<template>
  <aside class="activity-feed">
    <div class="feed-header">
      <h2>Activity</h2>
      <button class="icon-btn-sm" title="Clear feed" @click="eventStore.clearEvents()">
        <span class="material-icons">clear_all</span>
      </button>
    </div>
    <div class="feed-list">
      <template v-if="eventStore.events.length > 0">
        <TransitionGroup name="feed-item">
          <ActivityEvent
            v-for="event in eventStore.events"
            :key="event.id || event.timestamp"
            :event="event"
          />
        </TransitionGroup>
      </template>
      <div v-else class="feed-empty">
        <span class="material-icons">notifications_none</span>
        <p>No activity yet</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useEventStore } from '../../stores/eventStore'
import ActivityEvent from './ActivityEvent.vue'

const eventStore = useEventStore()
</script>

<style scoped>
.activity-feed {
  width: var(--feed-width);
  min-width: var(--feed-width);
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-muted);
  flex-shrink: 0;
}
.feed-header h2 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.icon-btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--text-muted);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.icon-btn-sm:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.feed-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.feed-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xxl);
  color: var(--text-muted);
}
.feed-empty .material-icons {
  font-size: 36px;
  opacity: 0.4;
}
.feed-empty p {
  font-size: var(--text-sm);
}

/* Transition animations */
.feed-item-enter-active { animation: slide-in 0.3s ease; }
.feed-item-leave-active { animation: slide-out 0.2s ease; }
@keyframes slide-in {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slide-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@media (max-width: 1200px) {
  .activity-feed {
    width: 280px;
    min-width: 280px;
  }
}
@media (max-width: 1024px) {
  .activity-feed { display: none; }
}
</style>
