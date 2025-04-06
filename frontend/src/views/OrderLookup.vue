<template>
  <div class="order-lookup-container">
    <div class="lookup-card">
      <h1 class="lookup-title">Consulta tu Orden de Servicio</h1>
      <p class="lookup-description">
        Ingresa el código de ticket y la clave de seguridad que te fueron proporcionados.
      </p>

      <form @submit.prevent="lookupOrder" class="lookup-form">
        <div class="form-group">
          <label for="ticket-code">Código de Ticket</label>
          <input 
            type="text" 
            id="ticket-code" 
            v-model="ticketCode" 
            placeholder="Ej: FIX12345678"
            required
            :disabled="loading"
          >
        </div>

        <div class="form-group">
          <label for="security-key">Clave de Seguridad</label>
          <input 
            type="text" 
            id="security-key" 
            v-model="securityKey" 
            placeholder="Ej: A7B9C3D2"
            required
            :disabled="loading"
          >
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="lookup-button"
            :disabled="loading || !ticketCode || !securityKey">
            <span v-if="loading">Consultando...</span>
            <span v-else>Consultar Estado</span>
          </button>
        </div>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <div v-if="order" class="order-result">
      <OrderCard :order="order" />
      <OrderTimeline :updates="updates" />
      <CommentBox :comments="comments" :canAddComments="false" />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OrderCard from '../components/OrderCard.vue';
import OrderTimeline from '../components/OrderTimeline.vue';
import CommentBox from '../components/CommentBox.vue';
import Footer from '../components/Footer.vue';
import { useOrderService } from '../services/orderService';

const orderService = useOrderService();

const ticketCode = ref('');
const securityKey = ref('');
const loading = ref(false);
const error = ref('');
const order = ref(null);
const updates = ref([]);
const comments = ref([]);

async function lookupOrder() {
  if (!ticketCode.value || !securityKey.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    // Obtener información de la orden
    const orderData = await orderService.getPublicOrder(
      ticketCode.value, 
      securityKey.value
    );
    order.value = orderData;

    // Obtener actualizaciones de la orden
    const updatesData = await orderService.getPublicOrderUpdates(
      ticketCode.value,
      securityKey.value
    );
    updates.value = updatesData;

    // Obtener comentarios visibles para el cliente
    const commentsData = await orderService.getPublicOrderComments(
      ticketCode.value,
      securityKey.value
    );
    comments.value = commentsData;
  } catch (err) {
    error.value = 'No se pudo encontrar la orden o la clave de seguridad es incorrecta. Por favor verifica la información e intenta nuevamente.';
    order.value = null;
    updates.value = [];
    comments.value = [];
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.order-lookup-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-medium);
}

.lookup-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-large);
  margin-bottom: var(--spacing-large);
}

.lookup-title {
  color: var(--primary-blue);
  font-size: 24px;
  margin-bottom: var(--spacing-medium);
  text-align: center;
}

.lookup-description {
  text-align: center;
  color: var(--medium-gray);
  margin-bottom: var(--spacing-large);
}

.lookup-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.form-group label {
  font-weight: 500;
  color: var(--dark-gray);
}

.form-group input {
  padding: 12px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  border-color: var(--primary-blue);
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-medium);
}

.lookup-button {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  min-width: 200px;
}

.lookup-button:hover {
  background-color: #1565C0;
}

.lookup-button:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
}

.error-message {
  background-color: #FFEBEE;
  color: #D32F2F;
  padding: var(--spacing-medium);
  border-radius: 4px;
  margin-top: var(--spacing-medium);
  text-align: center;
}

.order-result {
  margin-top: var(--spacing-large);
}

@media (max-width: 600px) {
  .lookup-card {
    padding: var(--spacing-medium);
  }
  
  .lookup-button {
    width: 100%;
  }
}
</style>
