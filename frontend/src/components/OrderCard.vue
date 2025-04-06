<template>
  <div class="order-card" :class="{ 'expanded': expanded }">
    <div class="order-header" @click="toggleExpand">
      <div class="order-info">
        <h3 class="order-title">{{ order.ticket_code }}</h3>
        <StatusBadge :status="displayStatus" />
      </div>
      <div class="client-info">
        <p class="client-name">{{ order.client_name }}</p>
        <p class="service-type">{{ getServiceTypeText(order.service_type) }}</p>
      </div>
    </div>
    
    <div v-if="expanded" class="order-details">
      <div class="detail-item">
        <strong>Problema:</strong>
        <p>{{ order.problem_description }}</p>
      </div>
      <div class="detail-item">
        <strong>Fecha de creación:</strong>
        <p>{{ formatDate(order.created_at) }}</p>
      </div>
      <div class="detail-item">
        <strong>Última actualización:</strong>
        <p>{{ formatDate(order.updated_at) }}</p>
      </div>
      <div class="detail-item" v-if="order.accessories && order.accessories.length > 0">
        <strong>Accesorios:</strong>
        <p>{{ order.accessories.join(', ') }}</p>
      </div>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import StatusBadge from './StatusBadge.vue';

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
});

const expanded = ref(false);

// Map 'completed' status to 'closed' for display purposes
const displayStatus = computed(() => {
  if (props.order && props.order.status === 'completed') {
    return 'closed';
  }
  return props.order ? props.order.status : '';
});

const toggleExpand = () => {
  expanded.value = !expanded.value;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getServiceTypeText = (type) => {
  const types = {
    'equipment_repair': 'Reparación de equipo',
    'remote_assistance': 'Asistencia remota'
  };
  return types[type] || type;
};
</script>

<style scoped>
.order-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: var(--spacing-medium);
  overflow: hidden;
  transition: all 0.3s ease;
}

.order-header {
  padding: var(--spacing-medium);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--light-gray);
}

.order-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-medium);
}

.order-title {
  margin: 0;
  font-size: 18px;
  color: var(--primary-blue);
}

.client-info {
  text-align: right;
}

.client-name {
  font-weight: 500;
  margin: 0 0 4px 0;
}

.service-type {
  color: var(--medium-gray);
  font-size: 12px;
  margin: 0;
}

.order-details {
  padding: var(--spacing-medium);
  background-color: var(--light-gray);
}

.detail-item {
  margin-bottom: var(--spacing-small);
}

.detail-item strong {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
}

.detail-item p {
  margin: 0;
}

.expanded {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
