<template>
  <div class="order-card" :class="{ 'expanded': expanded }">
    <div class="order-header" @click="toggleExpand">
      <div class="order-main-info">
        <div class="order-info">
          <h3 class="order-title">{{ order.ticket_code }}</h3>
          <StatusBadge :status="displayStatus" />
        </div>
        <div class="order-date">
          <span class="material-icons date-icon">event</span>
          <span>{{ formatShortDate(order.created_at) }}</span>
        </div>
      </div>
      
      <div class="client-info">
        <div class="client-name-container">
          <span class="material-icons client-icon">person</span>
          <p class="client-name">{{ order.client_name }}</p>
        </div>
        <div class="contact-container">
          <div class="phone-container" v-if="order.client_phone">
            <span class="material-icons phone-icon">phone</span>
            <span class="phone-number">{{ order.client_phone }}</span>
          </div>
          <p class="service-type">{{ getServiceTypeText(order.service_type) }}</p>
        </div>
      </div>
    </div>
    
    <div v-if="expanded" class="order-details">
      <div class="detail-item">
        <strong>Problema:</strong>
        <p>{{ order.problem_description }}</p>
      </div>
      <div class="detail-row">
        <div class="detail-item">
          <strong>Fecha de creación:</strong>
          <p>{{ formatDate(order.created_at) }}</p>
        </div>
        <div class="detail-item">
          <strong>Última actualización:</strong>
          <p>{{ formatDate(order.updated_at) }}</p>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-item">
          <strong>Teléfono:</strong>
          <p>{{ order.client_phone || 'No disponible' }}</p>
        </div>
        <div class="detail-item">
          <strong>Email:</strong>
          <p>{{ order.client_email || 'No disponible' }}</p>
        </div>
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

const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: var(--spacing-medium);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.order-header {
  padding: var(--spacing-medium);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid var(--light-gray);
}

.order-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-medium);
}

.order-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-blue);
}

.order-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--medium-gray);
}

.date-icon, .client-icon, .phone-icon {
  font-size: 16px;
  color: var(--medium-gray);
}

.client-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.client-name-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.client-name {
  font-weight: 500;
  margin: 0;
  font-size: 15px;
}

.contact-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.phone-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.phone-number {
  font-size: 14px;
  color: var(--dark-gray);
}

.service-type {
  background-color: var(--light-gray);
  padding: 4px 10px;
  border-radius: 16px;
  color: var(--dark-gray);
  font-size: 12px;
  margin: 0;
  display: inline-block;
}

.order-details {
  padding: var(--spacing-medium);
  background-color: var(--light-gray);
}

.detail-row {
  display: flex;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-small);
}

.detail-row .detail-item {
  flex: 1;
}

.detail-item {
  margin-bottom: var(--spacing-small);
  background-color: white;
  padding: 12px;
  border-radius: 8px;
}

.detail-item strong {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--medium-gray);
}

.detail-item p {
  margin: 0;
  color: var(--dark-gray);
}

.expanded {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}
</style>
