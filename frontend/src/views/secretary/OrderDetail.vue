<template>
  <div class="order-detail-layout">
    <NavBar />
    <Sidebar />
    
    <div class="order-detail-content">
      <div class="page-header">
        <h1 class="page-title">Detalle de Orden</h1>
        <router-link to="/secretary/dashboard" class="back-link">
          <span class="material-icons">arrow_back</span>
          Volver al Dashboard
        </router-link>
      </div>
      
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando detalles de la orden...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <span class="material-icons error-icon">error_outline</span>
        <p class="error-message">{{ error }}</p>
        <button @click="fetchOrderDetails" class="retry-button">
          <span class="material-icons">refresh</span>
          Reintentar
        </button>
      </div>
      
      <div v-else-if="order" class="order-detail-container">
        <div class="order-info-card">
          <div class="order-header">
            <div class="order-title-section">
              <h2 class="order-code">{{ order.ticket_code }}</h2>
              <StatusBadge :status="displayStatus" />
            </div>
            <div class="order-actions">
              <button 
                v-if="!isOrderClosed" 
                @click="closeOrder" 
                class="close-order-button"
                :disabled="closingOrder"
              >
                <span class="material-icons">check_circle</span>
                {{ closingOrder ? 'Cerrando...' : 'Cerrar Orden' }}
              </button>
            </div>
          </div>
          
          <div class="order-details">
            <div class="detail-section">
              <h3 class="section-title">Información del Cliente</h3>
              <div class="detail-row">
                <span class="detail-label">Nombre:</span>
                <span class="detail-value">{{ order.client_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">{{ order.client_phone || 'No disponible' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ order.client_email || 'No disponible' }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h3 class="section-title">Información del Servicio</h3>
              <div class="detail-row">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">{{ getServiceTypeText(order.service_type) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Problema reportado:</span>
                <span class="detail-value description">{{ order.problem_description }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h3 class="section-title">Accesorios Entregados</h3>
              <div v-if="order.accessories && order.accessories.length > 0" class="accessories-list">
                <div v-for="(accessory, index) in order.accessories" :key="index" class="accessory-item">
                  <span class="material-icons accessory-icon">check_circle</span>
                  <span>{{ accessory }}</span>
                </div>
              </div>
              <div v-else class="no-accessories">
                No se registraron accesorios
              </div>
            </div>
            
            <div class="detail-section">
              <h3 class="section-title">Técnico Asignado</h3>
              <div v-if="order.assigned_technician_id" class="technician-info">
                <div class="detail-row">
                  <span class="detail-label">Nombre:</span>
                  <span class="detail-value">{{ order.assigned_technician }}</span>
                </div>
                <button @click="showAssignTechnician = true" class="reassign-button">
                  <span class="material-icons">swap_horiz</span>
                  Reasignar
                </button>
              </div>
              <div v-else class="no-technician">
                <p>No hay técnico asignado</p>
                <button @click="showAssignTechnician = true" class="assign-button">
                  <span class="material-icons">person_add</span>
                  Asignar Técnico
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <OrderTimeline :updates="orderUpdates" />
        
        <CommentBox 
          :comments="orderComments" 
          :canAddComments="true"
          @submit-comment="addComment"
        />
      </div>
      
      <!-- Modal para asignar técnico -->
      <div v-if="showAssignTechnician" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ order.assigned_technician_id ? 'Reasignar Técnico' : 'Asignar Técnico' }}</h3>
            <button @click="showAssignTechnician = false" class="close-modal-button">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="technician">Seleccionar Técnico</label>
              <select 
                id="technician" 
                v-model="selectedTechnician" 
                class="technician-select"
                :disabled="assigningTechnician"
              >
                <option value="">Seleccione un técnico</option>
                <option 
                  v-for="tech in technicians" 
                  :key="tech.id" 
                  :value="tech.id"
                >
                  {{ tech.username }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              @click="showAssignTechnician = false" 
              class="cancel-button"
              :disabled="assigningTechnician"
            >
              Cancelar
            </button>
            <button 
              @click="assignTechnician" 
              class="confirm-button"
              :disabled="!selectedTechnician || assigningTechnician"
            >
              <span v-if="assigningTechnician">
                <span class="loading-spinner"></span>
                Asignando...
              </span>
              <span v-else>Confirmar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import OrderTimeline from '../../components/OrderTimeline.vue';
import CommentBox from '../../components/CommentBox.vue';

const route = useRoute();
const router = useRouter();
const orderId = route.params.id;

const order = ref(null);
const rawOrderUpdates = ref([]);
const orderUpdates = computed(() => {
  return rawOrderUpdates.value.map(update => {
    // Map 'completed' status to 'closed' for display purposes
    if (update.new_status === 'completed') {
      return { ...update, new_status: 'closed' };
    }
    if (update.old_status === 'completed') {
      return { ...update, old_status: 'closed' };
    }
    return update;
  });
});
const orderComments = ref([]);
const technicians = ref([]);
const loading = ref(true);
const error = ref('');

// Estado para el modal de asignación de técnico
const showAssignTechnician = ref(false);
const selectedTechnician = ref('');
const assigningTechnician = ref(false);

// Estado para cerrar orden
const closingOrder = ref(false);

const isOrderClosed = computed(() => {
  return order.value && (order.value.status === 'completed' || order.value.status === 'closed');
});

// Map 'completed' status to 'closed' for display purposes
const displayStatus = computed(() => {
  if (order.value && order.value.status === 'completed') {
    return 'closed';
  }
  return order.value ? order.value.status : '';
});

onMounted(async () => {
  await fetchOrderDetails();
  await fetchTechnicians();
});

async function fetchOrderDetails() {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      order.value = data.data.order;
      rawOrderUpdates.value = data.data.order.updates || [];
      orderComments.value = data.data.order.comments || [];
    } else {
      throw new Error(data.error || 'Error al obtener detalles de la orden');
    }
  } catch (err) {
    console.error('Error fetching order details:', err);
    error.value = err.message || 'Error al cargar los detalles de la orden. Por favor intente nuevamente.';
  } finally {
    loading.value = false;
  }
}

async function fetchTechnicians() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/users?role=technician', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      technicians.value = data.data.users;
    } else {
      throw new Error(data.error || 'Error al obtener lista de técnicos');
    }
  } catch (err) {
    console.error('Error fetching technicians:', err);
    // No mostrar este error en la interfaz
  }
}

async function assignTechnician() {
  if (!selectedTechnician.value) return;
  
  assigningTechnician.value = true;
  
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ technician_id: selectedTechnician.value })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar la orden con el nuevo técnico asignado
      await fetchOrderDetails();
      showAssignTechnician.value = false;
      selectedTechnician.value = '';
    } else {
      throw new Error(data.error || 'Error al asignar técnico');
    }
  } catch (err) {
    console.error('Error assigning technician:', err);
    alert('Error al asignar técnico: ' + err.message);
  } finally {
    assigningTechnician.value = false;
  }
}

async function closeOrder() {
  if (!confirm('¿Está seguro que desea cerrar esta orden?')) return;
  
  closingOrder.value = true;
  
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/close`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ closing_notes: 'Orden cerrada por secretaria' })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar la orden con el nuevo estado
      await fetchOrderDetails();
    } else {
      throw new Error(data.error || 'Error al cerrar la orden');
    }
  } catch (err) {
    console.error('Error closing order:', err);
    alert('Error al cerrar la orden: ' + err.message);
  } finally {
    closingOrder.value = false;
  }
}

async function addComment(content) {
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        content,
        comment_type: 'client' // Comentario visible para el cliente
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar comentarios
      orderComments.value.push(data.data.comment);
    } else {
      throw new Error(data.error || 'Error al agregar comentario');
    }
  } catch (err) {
    console.error('Error adding comment:', err);
    alert('Error al agregar comentario: ' + err.message);
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getServiceTypeText(type) {
  const types = {
    'equipment_repair': 'Reparación de equipo',
    'remote_assistance': 'Asistencia remota'
  };
  return types[type] || type;
}
</script>

<style scoped>
.order-detail-layout {
  min-height: 100vh;
  padding-top: 64px; /* NavBar height */
  padding-left: 250px; /* Sidebar width */
  background-color: #f8f9fa;
}

.order-detail-content {
  padding: var(--spacing-large);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-large);
}

.page-title {
  color: var(--dark-gray);
  margin: 0;
}

.back-link {
  display: flex;
  align-items: center;
  color: var(--primary-blue);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.back-link .material-icons {
  font-size: 18px;
  margin-right: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xlarge);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-blue);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-medium);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xlarge);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: #f44336;
  margin-bottom: var(--spacing-medium);
}

.error-message {
  color: var(--dark-gray);
  margin-bottom: var(--spacing-medium);
}

.retry-button {
  display: inline-flex;
  align-items: center;
  background-color: var(--primary-blue);
  color: white;
  padding: 10px 16px;
  border-radius: 4px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #1565C0;
}

.retry-button .material-icons {
  margin-right: 8px;
}

.order-detail-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-large);
}

.order-info-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.order-header {
  padding: var(--spacing-medium);
  background-color: var(--light-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-medium);
}

.order-code {
  margin: 0;
  font-size: 20px;
  color: var(--primary-blue);
}

.order-actions {
  display: flex;
  gap: var(--spacing-small);
}

.close-order-button {
  display: flex;
  align-items: center;
  background-color: var(--repaired);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.close-order-button:hover {
  background-color: #3d8b3d;
}

.close-order-button:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
}

.close-order-button .material-icons {
  margin-right: 4px;
  font-size: 18px;
}

.order-details {
  padding: var(--spacing-medium);
}

.detail-section {
  margin-bottom: var(--spacing-large);
  padding-bottom: var(--spacing-medium);
  border-bottom: 1px solid var(--light-gray);
}

.detail-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 16px;
  color: var(--primary-blue);
  margin-bottom: var(--spacing-medium);
}

.detail-row {
  display: flex;
  margin-bottom: var(--spacing-small);
}

.detail-label {
  width: 150px;
  font-weight: 500;
  color: var(--dark-gray);
}

.detail-value {
  color: var(--dark-gray);
}

.detail-value.description {
  white-space: pre-line;
}

.accessories-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.accessory-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-small);
}

.accessory-icon {
  color: var(--repaired);
  font-size: 18px;
}

.no-accessories, .no-technician {
  color: var(--medium-gray);
  font-style: italic;
}

.no-technician {
  display: flex;
  align-items: center;
  gap: var(--spacing-medium);
}

.assign-button, .reassign-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reassign-button {
  background-color: var(--medium-gray);
}

.assign-button:hover {
  background-color: #1565C0;
}

.reassign-button:hover {
  background-color: #616161;
}

.technician-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  overflow: hidden;
}

.modal-header {
  padding: var(--spacing-medium);
  background-color: var(--light-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--dark-gray);
}

.close-modal-button {
  background: none;
  border: none;
  color: var(--medium-gray);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-modal-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.modal-body {
  padding: var(--spacing-large);
}

.form-group {
  margin-bottom: var(--spacing-medium);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark-gray);
}

.technician-select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
  font-family: 'Roboto', sans-serif;
}

.technician-select:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.modal-footer {
  padding: var(--spacing-medium);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-medium);
  background-color: var(--light-gray);
}

.cancel-button {
  background: none;
  border: 1px solid var(--medium-gray);
  color: var(--medium-gray);
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button:hover {
  background-color: var(--light-gray);
}

.confirm-button {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.confirm-button:hover:not(:disabled) {
  background-color: #1565C0;
}

.confirm-button:disabled {
  background-color: var(--light-blue);
  cursor: not-allowed;
}

.confirm-button .loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .order-detail-layout {
    padding-left: 60px; /* Collapsed sidebar width */
  }
  
  .order-detail-content {
    padding: var(--spacing-medium);
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    width: 100%;
    margin-bottom: 4px;
  }
  
  .technician-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-small);
  }
  
  .no-technician {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-small);
  }
}
</style>
