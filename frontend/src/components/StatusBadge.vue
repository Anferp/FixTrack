<template>
  <span class="status-badge" :class="statusClass">
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true
  }
});

const statusClass = computed(() => {
  const classes = {
    'pending': 'status-pending',
    'in_review': 'status-in-review',
    'repaired': 'status-repaired',
    'waiting_parts': 'status-waiting-parts',
    'closed': 'status-closed',
    'completed': 'status-closed'
  };
  return classes[props.status] || 'status-unknown';
});

const statusText = computed(() => {
  const texts = {
    'pending': 'Pendiente',
    'in_review': 'En revisión',
    'repaired': 'Reparado',
    'waiting_parts': 'Esperando repuestos',
    'closed': 'Cerrado',
    'completed': 'Cerrado'
  };
  return texts[props.status] || 'Desconocido';
});
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
}

.status-pending {
  background-color: var(--pending);
}

.status-in-review {
  background-color: var(--in-review);
}

.status-repaired {
  background-color: var(--repaired);
}

.status-waiting-parts {
  background-color: var(--waiting-parts);
}

.status-closed {
  background-color: var(--closed);
}

.status-unknown {
  background-color: var(--medium-gray);
}
</style>
