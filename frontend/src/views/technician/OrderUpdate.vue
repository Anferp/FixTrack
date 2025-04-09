<template>
  <div class="app-layout">
    <NavBar />
    <Sidebar />
    <main class="main-content">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando información de la orden...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button @click="fetchOrderDetails" class="retry-button">Reintentar</button>
      </div>
      
      <div v-else class="order-container">
        <div class="order-header">
          <div class="order-title-section">
            <h1 class="order-title">Orden #{{ order.ticket_code }}</h1>
            <div class="status-badge-container">
              <StatusBadge :status="displayStatus" />
            </div>
          </div>
          <div class="order-details">
            <div class="detail-item">
              <span class="detail-label">Cliente:</span>
              <span class="detail-value">{{ order.client_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Teléfono:</span>
              <span class="detail-value">{{ order.client_phone || 'No disponible' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ order.client_email || 'No disponible' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tipo de servicio:</span>
              <span class="detail-value">{{ serviceTypeText }}</span>
            </div>
          </div>
        </div>
        
        <div class="problem-description">
          <h3>Descripción del problema</h3>
          <p>{{ order.problem_description }}</p>
        </div>
        
        <div v-if="order.accessories && order.accessories.length > 0" class="accessories">
          <h3>Accesorios entregados</h3>
          <ul class="accessories-list">
            <li v-for="(item, index) in order.accessories" :key="index">{{ item }}</li>
          </ul>
        </div>
        
        <div class="status-update-section">
          <h3>Actualizar estado</h3>
          <div class="status-form">
            <div class="form-group">
              <label for="status-select">Nuevo estado:</label>
              <select id="status-select" v-model="newStatus" class="status-select">
                <option value="in_review">En revisión</option>
                <option value="repaired">Reparado</option>
                <option value="waiting_parts">Esperando repuestos</option>
              </select>
            </div>
            <div class="form-group">
              <label for="status-note">Nota de cambio:</label>
              <textarea 
                id="status-note" 
                v-model="statusNote" 
                class="status-note" 
                placeholder="Indique la razón del cambio de estado..."
                rows="3"
              ></textarea>
            </div>
            <button @click="updateStatus" class="update-button" :disabled="isUpdating">
              {{ isUpdating ? 'Actualizando...' : 'Actualizar estado' }}
            </button>
            <p v-if="updateError" class="update-error">{{ updateError }}</p>
          </div>
        </div>
        
        <FileUploader 
          :order-id="orderId" 
          :uploaded-files="order.attachments || []" 
          @file-uploaded="handleFileUploaded" 
        />
        
        <OrderTimeline :updates="order.updates || []" />
        
        <CommentBox 
          :comments="techComments" 
          :can-add-comments="true"
          @submit-comment="addTechnicalComment" 
        />

        <Footer />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Sidebar from '../../components/Sidebar.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import OrderTimeline from '../../components/OrderTimeline.vue';
import CommentBox from '../../components/CommentBox.vue';
import FileUploader from '../../components/FileUploader.vue';
import Footer from '../../components/Footer.vue';

const route = useRoute();
const orderId = route.params.id;

const order = ref({});
const loading = ref(true);
const error = ref(null);
const newStatus = ref('');
const statusNote = ref('');
const isUpdating = ref(false);
const updateError = ref(null);
const techComments = ref([]);

const serviceTypeText = computed(() => {
  const types = {
    'equipment_repair': 'Reparación de equipo',
    'remote_assistance': 'Asistencia remota'
  };
  return types[order.value.service_type] || order.value.service_type;
});

// Mapear 'completed' a 'closed' para mostrar correctamente el estado
const displayStatus = computed(() => {
  if (order.value && order.value.status === 'completed') {
    return 'closed';
  }
  return order.value ? order.value.status : '';
});

onMounted(() => {
  fetchOrderDetails();
});

async function fetchOrderDetails() {
  loading.value = true;
  error.value = null;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('No se pudo cargar la información de la orden');
    }
    
    const data = await response.json();
    order.value = data.data.order;
    newStatus.value = order.value.status; // Inicializar con el estado actual
    
    // Filtrar comentarios técnicos
    fetchTechnicalComments();
    
  } catch (err) {
    console.error('Error al cargar orden:', err);
    error.value = 'Error al cargar la información de la orden. Por favor, intente nuevamente.';
  } finally {
    loading.value = false;
  }
}

async function fetchTechnicalComments() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/technical-comments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('No se pudieron cargar los comentarios técnicos');
    }
    
    const data = await response.json();
    techComments.value = data.data.comments || [];
    
  } catch (err) {
    console.error('Error al cargar comentarios técnicos:', err);
    // No mostramos este error al usuario, solo lo registramos
  }
}

async function updateStatus() {
  if (newStatus.value === order.value.status) {
    updateError.value = 'Debe seleccionar un estado diferente al actual';
    return;
  }
  
  if (!statusNote.value.trim()) {
    updateError.value = 'Debe ingresar una nota de cambio';
    return;
  }
  
  isUpdating.value = true;
  updateError.value = null;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/tech/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_status: newStatus.value,
        change_note: statusNote.value
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el estado');
    }
    
    const data = await response.json();
    
    // Actualizar el estado de la orden y añadir la actualización a la lista
    order.value.status = data.data.order.new_status;
    if (order.value.updates) {
      order.value.updates.unshift(data.data.update);
    } else {
      order.value.updates = [data.data.update];
    }
    
    // Limpiar el formulario
    statusNote.value = '';
    
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    updateError.value = err.message || 'Error al actualizar el estado. Por favor, intente nuevamente.';
  } finally {
    isUpdating.value = false;
  }
}

async function addTechnicalComment(content) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/tech/orders/${orderId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        comment_type: 'technical'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al añadir comentario');
    }
    
    const data = await response.json();
    
    // Añadir el nuevo comentario a la lista
    techComments.value.unshift(data.data.comment);
    
  } catch (err) {
    console.error('Error al añadir comentario técnico:', err);
    alert('Error al añadir comentario. Por favor, intente nuevamente.');
  }
}

function handleFileUploaded(attachment) {
  // Añadir el archivo subido a la lista de adjuntos
  if (!order.value.attachments) {
    order.value.attachments = [];
  }
  order.value.attachments.push(attachment);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  margin-top: 64px;
  padding: var(--spacing-xlarge);
  background-color: #F8F9FA;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-blue);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-medium);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: var(--spacing-xlarge);
}

.error-message {
  color: #f44336;
  margin-bottom: var(--spacing-medium);
}

.retry-button {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.order-container {
  max-width: 1000px;
  margin: 0 auto;
}

.order-header {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.order-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-medium);
  gap: 10px;
}

.order-title {
  margin: 0;
  font-size: 24px;
  color: var(--dark-gray);
}

.status-badge-container {
  margin-left: 10px;
  display: flex;
  align-items: center;
}

.order-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-medium);
}

.detail-item {
  margin-bottom: var(--spacing-small);
}

.detail-label {
  font-weight: 500;
  color: var(--medium-gray);
  margin-right: var(--spacing-small);
}

.detail-value {
  color: var(--dark-gray);
}

.problem-description, .accessories {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.problem-description h3, .accessories h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-small);
  color: var(--dark-gray);
  font-size: 18px;
}

.accessories-list {
  padding-left: var(--spacing-large);
  margin: 0;
}

.accessories-list li {
  margin-bottom: var(--spacing-small);
}

.status-update-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.status-update-section h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-medium);
  color: var(--dark-gray);
  font-size: 18px;
}

.status-form {
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

.status-select {
  padding: 8px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-size: 14px;
}

.status-note {
  padding: 8px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-family: 'Roboto', sans-serif;
  resize: vertical;
}

.update-button {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  align-self: flex-start;
}

.update-button:hover:not(:disabled) {
  background-color: #1565C0;
}

.update-button:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
}

.update-error {
  color: #f44336;
  font-size: 14px;
  margin-top: var(--spacing-small);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
    padding: var(--spacing-medium);
  }
  
  .order-details {
    grid-template-columns: 1fr;
  }
}
</style>
