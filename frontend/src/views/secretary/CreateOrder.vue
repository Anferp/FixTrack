<template>
  <div class="create-order-layout">
    <NavBar />
    <Sidebar />

    <div class="create-order-content">
      <div class="page-header">
        <h1 class="page-title">Crear Nueva Orden</h1>
        <router-link to="/secretary/dashboard" class="back-link">
          <span class="material-icons">arrow_back</span>
          Volver al Dashboard
        </router-link>
      </div>

      <div class="create-order-container">
        <div class="order-form-container">
          <OrderForm
            ref="orderFormComponent"
            :loading="loading"
            @submit="createOrder"
            @cancel="goBack"
          />
        </div>

        <div class="order-preview-container">
          <h2 class="preview-title">Vista Previa del Ticket</h2>

          <div v-if="createdOrder" class="order-ticket">
            <div class="ticket-header">
              <h3 class="ticket-title">FixTrack - Orden de Servicio</h3>
              <div class="ticket-code">{{ createdOrder.ticket_code }}</div>
            </div>

            <div class="ticket-body">
              <div class="ticket-info">
                <div class="info-row">
                  <strong>Cliente:</strong>
                  <span>{{ createdOrder.client_name }}</span>
                </div>
                <div class="info-row">
                  <strong>Fecha:</strong>
                  <span>{{ formatDate(new Date()) }}</span>
                </div>
                <div class="info-row">
                  <strong>Servicio:</strong>
                  <span>{{ getServiceTypeText(createdOrder.service_type) }}</span>
                </div>
                <div class="info-row">
                  <strong>Estado:</strong>
                  <span class="ticket-status">{{ translateStatus(createdOrder.status) }}</span>
                </div>
              </div>

              <div class="security-info">
                <div class="security-key">
                  <strong>Clave de Seguridad:</strong>
                  <span class="key-value">{{ createdOrder.security_key }}</span>
                </div>
                <p class="security-note">
                  Conserve esta clave para consultar el estado de su orden en línea.
                </p>
              </div>

              <div class="ticket-actions">
                <button class="print-button" @click="printTicket">
                  <span class="material-icons">print</span>
                  Imprimir Ticket
                </button>
                <button class="new-order-button" @click="resetForm">
                  <span class="material-icons">add</span>
                  Nueva Orden
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-preview">
            <span class="material-icons preview-icon">receipt_long</span>
            <p class="preview-text">Complete el formulario para generar un ticket</p>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';
import OrderForm from '../../components/OrderForm.vue';

const router = useRouter();
const loading = ref(false);
const createdOrder = ref(null);
const orderFormComponent = ref(null); // Referencia al componente OrderForm

function goBack() {
  router.push('/secretary/dashboard');
}

async function createOrder(orderData) {
  loading.value = true;

  try {
    // Almacenar el técnico seleccionado si existe
    const selectedTechnicianId = orderData.technician_id;
    
    // Eliminar technician_id del objeto orderData para la creación inicial
    // ya que según la API debe hacerse en una llamada separada
    const { technician_id, ...orderDataWithoutTechnician } = orderData;

    // Crear la orden sin técnico inicialmente
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderDataWithoutTechnician)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      createdOrder.value = data.data.order;
      
      // Si se seleccionó un técnico, asignarlo en una segunda llamada
      if (selectedTechnicianId) {
        await assignTechnician(data.data.order.id, selectedTechnicianId);
      }
    } else {
      throw new Error(data.error || 'Error al crear la orden');
    }
  } catch (error) {
    console.error('Error creating order:', error);
    alert('Error al crear la orden: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// Función para asignar un técnico a una orden existente
async function assignTechnician(orderId, technicianId) {
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ technician_id: technicianId })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      // Actualizar la orden en la vista con los datos de asignación
      if (createdOrder.value) {
        createdOrder.value.assigned_technician_id = data.data.order.assigned_technician_id;
        createdOrder.value.assigned_technician = data.data.order.assigned_technician;
      }
      console.log('Técnico asignado correctamente a la orden');
    } else {
      throw new Error(data.error || 'Error al asignar técnico');
    }
  } catch (error) {
    console.error('Error assigning technician:', error);
    // No mostramos alerta aquí para no interrumpir el flujo de creación
  }
}

function resetForm() {
  createdOrder.value = null; // Oculta la vista previa
  // Llama a la función resetFields del componente OrderForm si existe
  if (orderFormComponent.value) {
    orderFormComponent.value.resetFields();
  }
}

function printTicket() {
  window.print();
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      // Si la orden recién se creó, usar la fecha actual
      const now = new Date();
      return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    console.error('Error parsing date:', e);
    // Devuelve la fecha actual como respaldo
    const now = new Date();
    return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
}

function getServiceTypeText(type) {
  const types = {
    'equipment_repair': 'Reparación de equipo',
    'remote_assistance': 'Asistencia remota'
  };
  return types[type] || type;
}

function translateStatus(status) {
  const statusMap = {
    'pending': 'Pendiente',
    'in_review': 'En revisión',
    'repaired': 'Reparado',
    'waiting_parts': 'Esperando repuestos',
    'closed': 'Cerrado'
  };
  return statusMap[status] || status;
}
</script>

<style scoped>
.create-order-layout {
  min-height: 100vh;
  padding-top: 64px; /* NavBar height */
  padding-left: 250px; /* Sidebar width */
  background-color: #f8f9fa;
}

.create-order-content {
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

.create-order-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-large);
}

.order-form-container {
  grid-column: 1;
}

.order-preview-container {
  grid-column: 2;
  position: sticky;
  top: 80px;
}

.preview-title {
  margin-bottom: var(--spacing-medium);
  color: var(--dark-gray);
  font-size: 18px;
}

.empty-preview {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-xlarge);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.preview-icon {
  font-size: 48px;
  color: var(--medium-gray);
  margin-bottom: var(--spacing-medium);
}

.preview-text {
  color: var(--medium-gray);
}

.order-ticket {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ticket-header {
  background-color: var(--primary-blue);
  color: white;
  padding: var(--spacing-medium);
  text-align: center;
  position: relative;
}

.ticket-title {
  margin: 0;
  font-size: 18px;
}

.ticket-code {
  font-size: 24px;
  font-weight: 700;
  margin-top: var(--spacing-small);
}

.ticket-body {
  padding: var(--spacing-large);
}

.ticket-info {
  margin-bottom: var(--spacing-large);
}

.info-row {
  display: flex;
  margin-bottom: var(--spacing-small);
}

.info-row strong {
  width: 100px;
  flex-shrink: 0;
}

.ticket-status {
  color: var(--pending);
  font-weight: 500;
}

.security-info {
  background-color: var(--light-gray);
  padding: var(--spacing-medium);
  border-radius: 4px;
  margin-bottom: var(--spacing-large);
}

.security-key {
  margin-bottom: var(--spacing-small);
}

.key-value {
  font-weight: 700;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: var(--spacing-small);
  letter-spacing: 1px;
}

.security-note {
  color: var(--medium-gray);
  font-size: 12px;
  margin: 0;
}

.ticket-actions {
  display: flex;
  gap: var(--spacing-medium);
}

.print-button, .new-order-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
}

.print-button {
  background-color: var(--light-gray);
  color: var(--dark-gray);
  border: none;
}

.new-order-button {
  background-color: var(--primary-blue);
  color: white;
  border: none;
}

.print-button .material-icons,
.new-order-button .material-icons {
  margin-right: var(--spacing-small);
}

@media (max-width: 768px) {
  .create-order-layout {
    padding-left: 60px; /* Collapsed sidebar width */
  }

  .create-order-container {
    grid-template-columns: 1fr;
  }

  .order-form-container,
  .order-preview-container {
    grid-column: 1;
  }

  .order-preview-container {
    position: static;
    margin-top: var(--spacing-large);
  }
}

/* Estilos para impresión */
@media print {
  .navbar,
  .sidebar,
  .page-header,
  .order-form-container,
  .preview-title,
  .footer,
  .print-button,
  .new-order-button {
    display: none !important;
  }

  .create-order-layout {
    padding: 0 !important;
    background: white !important;
  }

  .create-order-content {
    padding: 0 !important;
  }

  .create-order-container {
    display: block !important;
  }

  .order-preview-container {
    width: 100% !important;
  }

  .order-ticket {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}
</style>
