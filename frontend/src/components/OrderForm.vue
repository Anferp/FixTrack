<template>
  <div class="order-form">
    <form @submit.prevent="submitOrder">
      <div class="form-section">
        <h3 class="section-title">Datos del Cliente</h3>
        
        <div class="client-selection">
          <div class="client-type-selector">
            <div class="radio-option">
              <input 
                type="radio" 
                id="existing-client" 
                name="client-type" 
                :value="false" 
                v-model="isNewClient" 
                :disabled="loading" 
              />
              <label for="existing-client">Seleccionar cliente existente</label>
            </div>
            <div class="radio-option">
              <input 
                type="radio" 
                id="new-client" 
                name="client-type" 
                :value="true" 
                v-model="isNewClient" 
                :disabled="loading" 
              />
              <label for="new-client">Crear nuevo cliente</label>
            </div>
          </div>
          
          <div v-if="!isNewClient" class="client-search" v-show="!isNewClient">
            <div class="form-group">
              <label for="client_search">Buscar cliente</label>
              <div class="search-input-container">
                <input
                  type="text"
                  id="client_search"
                  v-model="clientSearchTerm"
                  placeholder="Buscar por nombre, contacto, etc."
                  :disabled="loading"
                />
                <span class="search-icon material-icons">search</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="client_select">Cliente</label>
              <div v-if="loadingClients" class="loading-select">
                <span class="loading-spinner-small"></span>
                <span>Cargando clientes...</span>
              </div>
              <select
                v-else
                id="client_select"
                v-model="orderData.client_id"
                :disabled="loading"
              >
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.name }} - {{ client.contact || client.email || client.phone || 'Sin contacto' }}
                </option>
              </select>
              <p v-if="clientError" class="error-message">
                {{ clientError }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Datos del cliente (ya sea nuevo o existente seleccionado) -->
        <div class="client-data" :class="{ 'new-client': isNewClient }">
          <div class="form-group">
            <label for="client_name">Nombre del Cliente *</label>
            <input
              type="text"
              id="client_name"
              v-model="orderData.client_name"
              required
              :disabled="loading || (!isNewClient && orderData.client_id)"
            />
          </div>

          <div class="form-group">
            <label for="client_contact">Contacto del Cliente *</label>
            <input
              type="text"
              id="client_contact"
              v-model="orderData.client_contact"
              required
              placeholder="Teléfono o email"
              :disabled="loading || (!isNewClient && orderData.client_id)"
            />
          </div>
          
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">Detalles del Servicio</h3>
        <div class="form-group">
          <label for="service_type">Tipo de Servicio *</label>
          <select
            id="service_type"
            v-model="orderData.service_type"
            required
            :disabled="loading"
          >
            <option value="">Seleccionar tipo de servicio</option>
            <option value="equipment_repair">Reparación de Equipo</option>
            <option value="remote_assistance">Asistencia Remota</option>
          </select>
        </div>

        <div class="form-group">
          <label for="problem_description">Descripción del Problema *</label>
          <textarea
            id="problem_description"
            v-model="orderData.problem_description"
            rows="4"
            required
            placeholder="Describa el problema reportado por el cliente..."
            :disabled="loading"
          ></textarea>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">Accesorios Entregados</h3>
        <p class="section-description">Indique los accesorios que el cliente ha entregado junto con el equipo</p>

        <div class="accessories-container">
          <div class="accessories-list">
            <div v-for="(accessory, index) in orderData.accessories" :key="index" class="accessory-item">
              <input
                type="text"
                v-model="orderData.accessories[index]"
                placeholder="Nombre del accesorio"
                :disabled="loading"
              />
              <button
                type="button"
                class="remove-accessory-button"
                @click="removeAccessory(index)"
                :disabled="loading"
              >
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            class="add-accessory-button"
            @click="addAccessory"
            :disabled="loading"
          >
            <span class="material-icons">add</span>
            Agregar Accesorio
          </button>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">Asignación de Técnico</h3>
        <p class="section-description">Asigne un técnico para esta orden o déjelo sin asignar para hacerlo más tarde</p>

        <div class="form-group">
          <label for="technician">Técnico Asignado</label>
          <div v-if="loadingTechnicians" class="loading-select">
            <span class="loading-spinner-small"></span>
            <span>Cargando técnicos...</span>
          </div>
          <select
            v-else
            id="technician"
            v-model="orderData.technician_id"
            :disabled="loading"
          >
            <option value="">Sin asignar</option>
            <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
              {{ tech.username }}
            </option>
          </select>
          <p v-if="technicianError" class="error-message">
            {{ technicianError }}
          </p>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="cancel-button"
          @click="$emit('cancel')"
          :disabled="loading"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="submit-button"
          :disabled="!formValid || loading"
        >
          <span v-if="loading">
            <span class="loading-spinner"></span>
            Creando...
          </span>
          <span v-else>Crear Orden</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, reactive, defineExpose, onMounted, watch } from 'vue'; // Añadir onMounted, watch
import { useClientService } from '../services/clientService';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

const clientService = useClientService();

const initialOrderData = {
  client_id: null,
  client_name: '',
  client_contact: '',
  service_type: '',
  problem_description: '',
  accessories: [''],
  technician_id: '',
  create_client: false
};

const orderData = reactive({ ...initialOrderData });
const technicians = ref([]);
const clients = ref([]);
const loadingTechnicians = ref(false);
const loadingClients = ref(false);
const technicianError = ref('');
const clientError = ref('');
const clientSearchTerm = ref('');
const isNewClient = ref(false);

const formValid = computed(() => {
  return orderData.client_name.trim() !== '' &&
         orderData.client_contact.trim() !== '' &&
         orderData.service_type !== '' &&
         orderData.problem_description.trim() !== '';
});

function addAccessory() {
  orderData.accessories.push('');
}

function removeAccessory(index) {
  orderData.accessories.splice(index, 1);
  if (orderData.accessories.length === 0) {
    addAccessory(); // Mantener al menos un campo de accesorio
  }
}

function submitOrder() {
  if (!formValid.value) return;

  // Filtrar accesorios vacíos
  const cleanedAccessories = orderData.accessories.filter(acc => acc.trim() !== '');

  // Crear objeto de datos para la API
  const orderPayload = {
    service_type: orderData.service_type,
    problem_description: orderData.problem_description,
    accessories: cleanedAccessories
  };

  // Añadir el técnico asignado si se seleccionó uno
  if (orderData.technician_id) {
    orderPayload.technician_id = orderData.technician_id;
  }

  // Añadir datos del cliente
  if (isNewClient.value) {
    // Si es un cliente nuevo, incluir datos y flag para crearlo
    orderPayload.client_name = orderData.client_name;
    orderPayload.client_contact = orderData.client_contact;
    orderPayload.client_email = orderData.client_email;
    orderPayload.client_phone = orderData.client_phone;
    orderPayload.create_client = true;
  } else if (orderData.client_id) {
    // Si es un cliente existente, incluir su ID y nombre
    orderPayload.client_id = orderData.client_id;
    orderPayload.client_name = orderData.client_name;
    orderPayload.client_contact = orderData.client_contact;
  } else {
    // Si no se seleccionó cliente pero se ingresó nombre, crear orden sin cliente registrado
    orderPayload.client_name = orderData.client_name;
    orderPayload.client_contact = orderData.client_contact;
  }

  emit('submit', orderPayload);
}

// Cargar la lista de técnicos y clientes cuando se monta el componente
onMounted(async () => {
  await fetchTechnicians();
  await fetchClients();
});

// Observar cambios en la búsqueda de clientes
watch(clientSearchTerm, async (newValue) => {
  if (newValue && newValue.length >= 3) {
    await fetchClients(newValue);
  }
});

// Observar cambios en la selección de cliente
watch(() => orderData.client_id, (newValue) => {
  if (newValue) {
    // Buscar el cliente seleccionado
    const selectedClient = clients.value.find(client => client.id === parseInt(newValue));
    if (selectedClient) {
      // Rellenar datos del cliente
      orderData.client_name = selectedClient.name;
      orderData.client_contact = selectedClient.contact || '';
      isNewClient.value = false;
    }
  }
});

async function fetchTechnicians() {
  loadingTechnicians.value = true;
  technicianError.value = '';
  
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
    technicianError.value = 'No se pudo cargar la lista de técnicos';
  } finally {
    loadingTechnicians.value = false;
  }
}

async function fetchClients(search = '') {
  loadingClients.value = true;
  clientError.value = '';
  
  try {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    params.append('limit', '50');
    
    const response = await fetch(`http://localhost:3000/api/clients?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      clients.value = data.data.clients;
    } else {
      throw new Error(data.error || 'Error al obtener lista de clientes');
    }
  } catch (err) {
    console.error('Error fetching clients:', err);
    clientError.value = 'No se pudo cargar la lista de clientes';
  } finally {
    loadingClients.value = false;
  }
}

// Watch for changes in isNewClient to update form accordingly
watch(() => isNewClient.value, (newValue) => {
  if (newValue) {
    // Si es un nuevo cliente, limpiar la selección y datos previos
    orderData.client_id = null;
    // Mantener los datos ingresados para el nuevo cliente
  } else {
    // Si no es un nuevo cliente, limpiar datos del formulario si no hay cliente seleccionado
    if (!orderData.client_id) {
      orderData.client_name = '';
      orderData.client_contact = '';
    }
  }
});

// Función para resetear los campos del formulario
function resetFields() {
  Object.assign(orderData, initialOrderData);
  // Asegurarse de que accessories tenga al menos un campo vacío
  if (!orderData.accessories || orderData.accessories.length === 0) {
    orderData.accessories = [''];
  }
}

// Exponer la función resetFields al componente padre
defineExpose({
  resetFields
});

</script>

<style scoped>
.order-form {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-large);
}

/* Nuevos estilos para la selección de clientes */
.client-selection {
  margin-bottom: var(--spacing-medium);
  padding-bottom: var(--spacing-small);
  border-bottom: 1px dashed var(--light-blue);
}

.client-type-selector {
  display: flex;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
}

.radio-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  margin-right: 8px;
  cursor: pointer;
}

.radio-option label {
  color: var(--dark-gray);
  font-weight: 500;
  cursor: pointer;
}

.search-input-container {
  position: relative;
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--medium-gray);
}

.client-data.new-client {
  background-color: var(--light-gray);
  padding: var(--spacing-medium);
  border-radius: 4px;
  margin-bottom: var(--spacing-medium);
}

.form-row {
  display: flex;
  gap: var(--spacing-medium);
}

.half-width {
  width: 50%;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-blue);
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

.loading-select {
  display: flex;
  align-items: center;
  padding: 8px;
  color: var(--medium-gray);
}

.form-section {
  margin-bottom: var(--spacing-large);
  padding-bottom: var(--spacing-medium);
  border-bottom: 1px solid var(--light-gray);
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 18px;
  color: var(--primary-blue);
  margin-bottom: var(--spacing-medium);
}

.section-description {
  color: var(--medium-gray);
  font-size: 14px;
  margin-bottom: var(--spacing-medium);
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

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
  font-family: 'Roboto', sans-serif;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.accessories-container {
  margin-top: var(--spacing-medium);
}

.accessories-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
  margin-bottom: var(--spacing-medium);
}

.accessory-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-small);
}

.add-accessory-button {
  display: flex;
  align-items: center;
  background: none;
  border: 1px dashed var(--light-blue);
  color: var(--primary-blue);
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: background-color 0.3s;
}

.add-accessory-button .material-icons {
  margin-right: var(--spacing-small);
}

.add-accessory-button:hover {
  background-color: var(--light-gray);
}

.remove-accessory-button {
  background: none;
  border: none;
  color: var(--medium-gray);
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s, background-color 0.3s;
}

.remove-accessory-button:hover {
  color: #f44336;
  background-color: var(--light-gray);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-medium);
  margin-top: var(--spacing-large);
}

.cancel-button {
  background: none;
  border: 1px solid var(--medium-gray);
  color: var(--medium-gray);
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button:hover {
  background-color: var(--light-gray);
}

.submit-button {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
}

.submit-button:hover:not(:disabled) {
  background-color: #1565C0;
}

.submit-button:disabled {
  background-color: var(--light-blue);
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

.loading-spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-blue);
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

.loading-select {
  padding: 8px;
  color: var(--medium-gray);
  display: flex;
  align-items: center;
}

.error-message {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
