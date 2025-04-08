<template>
  <div class="dashboard-layout">
    <NavBar />
    <Sidebar />
    
    <div class="dashboard-content">
      <h1 class="dashboard-title">Todas las Órdenes de Servicio</h1>
      
      <OrderSearchFilter @filter-change="handleFilterChange" />
      
      <div class="orders-container">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando órdenes...</p>
        </div>
        
        <div v-else-if="error" class="error-container">
          <span class="material-icons error-icon">error_outline</span>
          <p class="error-message">{{ error }}</p>
          <button @click="fetchOrders" class="retry-button">
            <span class="material-icons">refresh</span>
            Reintentar
          </button>
        </div>
        
        <div v-else-if="orders.length === 0" class="no-orders">
          <span class="material-icons no-orders-icon">build_circle</span>
          <p>No hay órdenes que coincidan con los filtros</p>
        </div>
        
        <div v-else class="orders-list">
          <OrderCard 
            v-for="order in orders" 
            :key="order.id" 
            :order="order"
          >
            <template #actions>
              <div class="order-actions">
                <!-- Si la orden no tiene técnico asignado, mostrar botón de auto-asignación -->
                <button 
                  v-if="!order.assigned_technician_id"
                  @click="assignToMe(order.id)" 
                  class="assign-button"
                  :disabled="isAssigning === order.id"
                >
                  <span class="material-icons">person_add</span>
                  {{ isAssigning === order.id ? 'Asignando...' : 'Asignar a mi' }}
                </button>
                
                <!-- Si ya está asignada a este técnico, mostrar botón para trabajar en ella -->
                <router-link 
                  v-else-if="order.is_assigned_to_me" 
                  :to="`/technician/orders/${order.id}`" 
                  class="view-order-button"
                >
                  <span class="material-icons">handyman</span>
                  Trabajar en esta orden
                </router-link>
                
                <!-- Si está asignada a otro técnico, mostrar el nombre del técnico y botón para reasignar -->
                <div v-else class="technician-info-with-action">
                  <div class="technician-info">
                    <span class="material-icons">person</span>
                    Asignada a: {{ order.technician ? order.technician.username : 'Desconocido' }}
                  </div>
                  <button 
                    @click="reassignToMe(order.id)" 
                    class="reassign-button"
                    :disabled="isReassigning === order.id"
                  >
                    <span class="material-icons">swap_horiz</span>
                    {{ isReassigning === order.id ? 'Reasignando...' : 'Reasignar a mi' }}
                  </button>
                </div>
              </div>
            </template>
          </OrderCard>
          
          <div class="pagination-controls">
            <button 
              @click="prevPage" 
              class="pagination-button"
              :disabled="page === 1"
            >
              <span class="material-icons">chevron_left</span>
              Anterior
            </button>
            <span class="pagination-info">Página {{ page }} de {{ totalPages || 1 }}</span>
            <button 
              @click="nextPage" 
              class="pagination-button"
              :disabled="page >= totalPages"
            >
              Siguiente
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';
import OrderCard from '../../components/OrderCard.vue';
import OrderSearchFilter from '../../components/OrderSearchFilter.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const orders = ref([]);
const loading = ref(true);
const error = ref('');
const page = ref(1);
const limit = ref(10);
const totalPages = ref(1);
const currentFilters = ref({});
const isAssigning = ref(null);
const isReassigning = ref(null);

onMounted(async () => {
  await fetchOrders();
});

async function fetchOrders() {
  loading.value = true;
  error.value = '';
  
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.value,
      limit: limit.value
    });
    
    // Add filters if they exist
    if (currentFilters.value.status) params.append('status', currentFilters.value.status);
    if (currentFilters.value.service_type) params.append('service_type', currentFilters.value.service_type);
    if (currentFilters.value.searchText) params.append('search', currentFilters.value.searchText);
    if (currentFilters.value.start_date) params.append('start_date', currentFilters.value.start_date);
    if (currentFilters.value.end_date) params.append('end_date', currentFilters.value.end_date);
    
    const response = await fetch(`http://localhost:3000/api/tech/all-orders?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      orders.value = data.data.orders;
      totalPages.value = data.data.pagination.pages;
    } else {
      throw new Error(data.error || 'Error al obtener las órdenes');
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
    error.value = err.message || 'Error al cargar las órdenes. Por favor intente nuevamente.';
  } finally {
    loading.value = false;
  }
}

async function assignToMe(orderId) {
  isAssigning.value = orderId;
  
  try {
    const response = await fetch(`http://localhost:3000/api/tech/orders/${orderId}/self-assign`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al asignar orden');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Redirigir al técnico a la página de la orden
      router.push(`/technician/orders/${orderId}`);
    } else {
      throw new Error(data.error || 'Error al asignar orden');
    }
  } catch (err) {
    console.error('Error assigning order:', err);
    alert(err.message || 'Error al asignar orden. Por favor intente nuevamente.');
  } finally {
    isAssigning.value = null;
  }
}

async function reassignToMe(orderId) {
  isReassigning.value = orderId;
  
  try {
    const response = await fetch(`http://localhost:3000/api/tech/orders/${orderId}/reassign`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al reasignar orden');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Redirigir al técnico a la página de la orden
      router.push(`/technician/orders/${orderId}`);
    } else {
      throw new Error(data.error || 'Error al reasignar orden');
    }
  } catch (err) {
    console.error('Error reassigning order:', err);
    alert(err.message || 'Error al reasignar orden. Por favor intente nuevamente.');
  } finally {
    isReassigning.value = null;
  }
}

function handleFilterChange(filters) {
  currentFilters.value = filters;
  page.value = 1; // Reset to first page when filters change
  fetchOrders();
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchOrders();
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchOrders();
  }
}
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  padding-top: 64px; /* NavBar height */
  padding-left: 250px; /* Sidebar width */
  background-color: #f8f9fa;
}

.dashboard-content {
  padding: var(--spacing-large);
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-title {
  margin-bottom: var(--spacing-large);
  color: var(--dark-gray);
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-orders {
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

.no-orders-icon {
  font-size: 48px;
  color: var(--medium-gray);
  margin-bottom: var(--spacing-medium);
}

.orders-list {
  display: flex;
  flex-direction: column;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-small);
}

.view-order-button, .assign-button {
  display: inline-flex;
  align-items: center;
  background-color: var(--primary-blue);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
  border: none;
  cursor: pointer;
}

.view-order-button:hover, 
.assign-button:hover:not(:disabled) {
  background-color: #1565C0;
}

.view-order-button .material-icons, 
.assign-button .material-icons {
  margin-right: 8px;
}

.assign-button:disabled {
  background-color: var(--medium-gray);
  cursor: wait;
}

.technician-info-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.technician-info {
  display: flex;
  align-items: center;
  color: var(--medium-gray);
  font-size: 14px;
}

.technician-info .material-icons {
  margin-right: 8px;
  font-size: 18px;
}

.reassign-button {
  display: inline-flex;
  align-items: center;
  background-color: #ff9800; /* Orange color for reassignment */
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reassign-button:hover:not(:disabled) {
  background-color: #f57c00;
}

.reassign-button:disabled {
  background-color: var(--medium-gray);
  cursor: wait;
}

.reassign-button .material-icons {
  margin-right: 6px;
  font-size: 16px;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: var(--spacing-large);
  gap: var(--spacing-medium);
}

.pagination-button {
  display: flex;
  align-items: center;
  background: none;
  border: 1px solid var(--primary-blue);
  color: var(--primary-blue);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--light-blue);
}

.pagination-button:disabled {
  border-color: var(--medium-gray);
  color: var(--medium-gray);
  cursor: not-allowed;
}

.pagination-button .material-icons {
  font-size: 18px;
}

.pagination-info {
  color: var(--medium-gray);
}

@media (max-width: 768px) {
  .dashboard-layout {
    padding-left: 60px; /* Collapsed sidebar width */
  }
  
  .dashboard-content {
    padding: var(--spacing-medium);
  }
}
</style> 