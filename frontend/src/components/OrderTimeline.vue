<template>
  <div class="order-timeline">
    <h3 class="timeline-title">Historial de la Orden</h3>
    <div class="timeline-container">
      <div v-if="updates.length === 0" class="no-updates">
        No hay actualizaciones disponibles.
      </div>
      <div v-else class="timeline-items">
        <div v-for="(update, index) in updates" :key="index" class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-date">{{ formatDate(update.created_at) }}</div>
            <div class="status-change">
              <span class="old-status">
                <StatusBadge v-if="update.old_status" :status="update.old_status" />
                <span v-else class="initial-status">Estado inicial</span>
              </span>
              <span class="status-arrow">→</span>
              <StatusBadge :status="update.new_status" />
            </div>
            <p v-if="update.change_note" class="change-note">{{ update.change_note }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue';

const props = defineProps({
  updates: {
    type: Array,
    required: true
  }
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.order-timeline {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.timeline-title {
  margin-top: 0;
  margin-bottom: var(--spacing-medium);
  color: var(--dark-gray);
  font-size: 18px;
}

.timeline-container {
  position: relative;
  padding-left: 30px;
}

.timeline-items {
  position: relative;
}

.timeline-items::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -15px;
  width: 2px;
  background-color: var(--light-blue);
}

.timeline-item {
  position: relative;
  padding-bottom: var(--spacing-large);
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  position: absolute;
  top: 0;
  left: -21px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--primary-blue);
  border: 2px solid white;
  z-index: 1;
}

.timeline-content {
  background-color: var(--light-gray);
  padding: var(--spacing-medium);
  border-radius: 8px;
}

.timeline-date {
  font-size: 12px;
  color: var(--medium-gray);
  margin-bottom: var(--spacing-small);
}

.status-change {
  display: flex;
  align-items: center;
  gap: var(--spacing-small);
  margin-bottom: var(--spacing-small);
}

.status-arrow {
  color: var(--medium-gray);
  font-weight: bold;
}

.initial-status {
  font-size: 12px;
  color: var(--medium-gray);
  display: inline-block;
  padding: 4px 8px;
  background-color: var(--light-gray);
  border-radius: 16px;
}

.change-note {
  margin: var(--spacing-small) 0 0 0;
  font-style: italic;
}

.no-updates {
  padding: var(--spacing-medium);
  text-align: center;
  color: var(--medium-gray);
  background-color: var(--light-gray);
  border-radius: 8px;
}
</style>
