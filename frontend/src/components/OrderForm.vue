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
              <label for="client_input">Cliente</label>
              <div class="search-input-container">
                <input
                  type="text"
                  id="client_input"
                  v-model="clientSearchTerm"
                  placeholder="Buscar por nombre, teléfono o email"
                  :disabled="loading"
                  @input="handleSearchInput"
                  @keyup.enter="triggerSearch"
                  class="client-search-input"
                />
                <span 
                  v-if="clientSearchTerm" 
                  class="clear-icon material-icons" 
                  @click="clearSearch" 
                  role="button" 
                  title="Limpiar búsqueda"
                >
                  clear
                </span>
                <span 
                  class="search-icon material-icons" 
                  @click="triggerSearch" 
                  role="button" 
                  title="Buscar cliente"
                >
                  search
                </span>
                
                <div v-show="showClientList && clients.length > 0" class="client-dropdown">
                  <div class="dropdown-header">
                    {{ clients.length }} cliente(s) encontrado(s) - Haga clic para seleccionar
                  </div>
                  <div 
                    v-for="client in clients" 
                    :key="client.id" 
                    class="client-item" 
                    @click="selectClient(client)"
                  >
                    <div class="client-name">{{ client.name }}</div>
                    <div class="client-details">
                      <span v-if="client.phone">Tel: {{ client.phone }}</span>
                      <span v-if="client.email">Email: {{ client.email }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="loadingClients" class="loading-select">
                <span class="loading-spinner-small"></span>
                <span>Buscando clientes...</span>
              </div>
              
              <div v-if="clientError" class="error-container">
                <p class="error-message">
                  {{ clientError }}
                </p>
                <button 
                  type="button" 
                  class="refresh-button" 
                  @click="fetchClients()"
                  :disabled="loadingClients"
                >
                  <span class="material-icons">refresh</span>
                  Refrescar lista
                </button>
              </div>
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
            <label for="client_phone">Teléfono del Cliente *</label>
            <input
              type="tel"
              id="client_phone"
              v-model="orderData.client_phone"
              @input="formatPhoneNumber"
              required
              placeholder="Número telefónico"
              :disabled="loading || (!isNewClient && orderData.client_id)"
            />
            <span v-if="phoneError" class="error-message">{{ phoneError }}</span>
          </div>

          <div class="form-group">
            <label for="client_email">Correo Electrónico del Cliente</label>
            <input
              type="email"
              id="client_email"
              v-model="orderData.client_email"
              @input="validateEmail"
              placeholder="correo@ejemplo.com"
              :disabled="loading || (!isNewClient && orderData.client_id)"
            />
            <span v-if="emailError" class="error-message">{{ emailError }}</span>
          </div>
          
          <!-- Alerta de cliente duplicado -->
          <div v-if="duplicateClientInfo && isNewClient" class="duplicate-client-alert">
            <div class="alert-header">
              <i class="material-icons alert-icon">info</i>
              <span class="alert-title">Cliente ya registrado</span>
            </div>
            <div class="alert-content">
              <p>Se encontró un cliente con la misma información:</p>
              <div class="client-info">
                <div><strong>Nombre:</strong> {{ duplicateClientInfo.name }}</div>
                <div v-if="duplicateClientInfo.phone"><strong>Teléfono:</strong> {{ duplicateClientInfo.phone }}</div>
                <div v-if="duplicateClientInfo.email"><strong>Email:</strong> {{ duplicateClientInfo.email }}</div>
              </div>
              <p class="alert-message">Para evitar registros duplicados, puede usar el cliente existente o actualizar sus datos.</p>
            </div>
            <div class="alert-actions">
              <button 
                type="button" 
                class="use-client-btn" 
                @click="useExistingClient(duplicateClientInfo.id)"
              >
                <i class="material-icons btn-icon">check_circle</i>
                Usar este cliente
              </button>
              <button 
                type="button" 
                class="update-client-btn" 
                @click="updateExistingClient(duplicateClientInfo.id)"
              >
                <i class="material-icons btn-icon">edit</i>
                Actualizar datos
              </button>
            </div>
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
  client_phone: '',
  client_email: '',
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
const phoneError = ref('');
const emailError = ref('');
const duplicateClientInfo = ref(null);
const checkingDuplicate = ref(false);
const showClientList = ref(false);

const formValid = computed(() => {
  return orderData.client_name.trim() !== '' &&
         orderData.client_phone.trim() !== '' &&
         !phoneError.value &&
         (orderData.client_email === '' || !emailError.value) &&
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
    orderPayload.client_phone = orderData.client_phone;
    orderPayload.client_email = orderData.client_email;
    orderPayload.create_client = true;
  } else if (orderData.client_id) {
    // Si es un cliente existente, incluir su ID y nombre
    orderPayload.client_id = orderData.client_id;
    orderPayload.client_name = orderData.client_name;
    orderPayload.client_phone = orderData.client_phone;
    orderPayload.client_email = orderData.client_email;
  } else {
    // Si no se seleccionó cliente pero se ingresó nombre, crear orden sin cliente registrado
    orderPayload.client_name = orderData.client_name;
    orderPayload.client_phone = orderData.client_phone;
    orderPayload.client_email = orderData.client_email;
  }

  emit('submit', orderPayload);
}

// Observar cambios en la búsqueda de clientes con debounce
let searchTimeout = null;
function handleSearchInput() {
  showClientList.value = true;
  
  // Cancelar búsqueda anterior si existe
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Crear un nuevo timeout para la búsqueda
  searchTimeout = setTimeout(() => {
    if (clientSearchTerm.value && clientSearchTerm.value.length >= 2) {
      fetchClients(clientSearchTerm.value);
    } else if (clientSearchTerm.value === '') {
      fetchClients('');
    }
  }, 300); // Esperar 300ms después de que el usuario deje de escribir
}

function clearSearch() {
  clientSearchTerm.value = '';
  fetchClients('');
  showClientList.value = false;
}

// Al hacer clic fuera del dropdown, ocultarlo
function setupClickOutside() {
  document.addEventListener('click', (e) => {
    const container = document.querySelector('.search-input-container');
    const dropdown = document.querySelector('.client-dropdown');
    const searchInput = document.getElementById('client_input');
    
    if (container && !container.contains(e.target) && dropdown && searchInput) {
      showClientList.value = false;
    }
  });
}

onMounted(async () => {
  try {
    console.log('===============================================');
    console.log('Iniciando carga de datos del formulario...');
    
    // Configurar detector de clics fuera del dropdown
    setupClickOutside();
    
    // Cargar técnicos
    console.log('Cargando técnicos...');
    await fetchTechnicians();
    
    // Cargar todos los clientes al inicio sin filtro pero no mostrarlos
    console.log('Cargando todos los clientes...');
    clientSearchTerm.value = ''; // Asegurar que está vacío
    showClientList.value = false; // Asegurarnos que no se muestra la lista
    await fetchClients('');
    
    console.log('Datos iniciales cargados correctamente');
    console.log('Token de autenticación:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
    console.log('===============================================');
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
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
      // Limpiar el texto de búsqueda para que sea más efectivo
      params.append('search', search.trim());
    }
    params.append('limit', '100'); // Aumentar el límite para asegurar que se encuentren todos los clientes
    
    console.log(`Buscando clientes con parámetros: ${params.toString()}`);
    
    const requestUrl = `http://localhost:3000/api/clients?${params.toString()}`;
    console.log(`Realizando petición a: ${requestUrl}`);
    
    const response = await fetch(requestUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Respuesta completa de API:', data);
    
    if (data.success) {
      clients.value = data.data.clients;
      console.log(`Clientes encontrados (${clients.value.length}):`, clients.value);
      
      if (clients.value.length === 0) {
        if (search) {
          clientError.value = `No se encontraron clientes con: "${search}"`;
        } else {
          clientError.value = 'No hay clientes registrados en el sistema';
        }
        showClientList.value = false;
      } else if (search) {
        // Solo mostrar la lista si estamos buscando activamente
        // y no en la carga inicial
        showClientList.value = true;
        clientError.value = '';
      }
    } else {
      throw new Error(data.error || 'Error al obtener lista de clientes');
    }
  } catch (err) {
    console.error('Error fetching clients:', err);
    clientError.value = 'No se pudo cargar la lista de clientes';
    showClientList.value = false;
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
      orderData.client_phone = '';
      orderData.client_email = '';
    }
  }
});

// Función para resetear los campos del formulario
function resetFields() {
  // Restablecer todos los campos a sus valores iniciales
  Object.assign(orderData, { ...initialOrderData });
  isNewClient.value = false;
  clientSearchTerm.value = '';
  
  // Restablecer errores
  clientError.value = '';
  technicianError.value = '';
  phoneError.value = '';
  emailError.value = '';
  duplicateClientInfo.value = null;
}

// Exponer la función resetFields al componente padre
defineExpose({
  resetFields
});

function formatPhoneNumber() {
  // Eliminar todos los caracteres no numéricos
  let phoneNumber = orderData.client_phone.replace(/\D/g, '');
  
  // Limitar a 10 dígitos (ajustar según el formato local)
  if (phoneNumber.length > 10) {
    phoneNumber = phoneNumber.substring(0, 10);
  }
  
  // Aplicar formato: XXX-XXX-XXXX
  if (phoneNumber.length > 0) {
    if (phoneNumber.length <= 3) {
      phoneNumber = phoneNumber;
    } else if (phoneNumber.length <= 6) {
      phoneNumber = phoneNumber.substring(0, 3) + '-' + phoneNumber.substring(3);
    } else {
      phoneNumber = phoneNumber.substring(0, 3) + '-' + phoneNumber.substring(3, 6) + '-' + phoneNumber.substring(6);
    }
  }
  
  // Actualizar el valor en el modelo de datos
  orderData.client_phone = phoneNumber;
  
  // Validar el número de teléfono
  if (orderData.client_phone && orderData.client_phone.replace(/\D/g, '').length < 10) {
    phoneError.value = 'El número debe tener 10 dígitos';
  } else {
    phoneError.value = '';
    
    // Verificar duplicados
    if (isNewClient.value && orderData.client_phone && orderData.client_phone.replace(/\D/g, '').length === 10) {
      checkDuplicateContact('phone');
    }
  }
}

function validateEmail() {
  // Expresión regular para validar correos electrónicos
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (orderData.client_email && !emailRegex.test(orderData.client_email)) {
    emailError.value = 'Formato de correo electrónico inválido';
    duplicateClientInfo.value = null;
  } else {
    emailError.value = '';
    
    // Verificar duplicados solo si el email es válido y estamos creando un nuevo cliente
    if (isNewClient.value && orderData.client_email && emailRegex.test(orderData.client_email)) {
      checkDuplicateContact('email');
    }
  }
}

// Modificar la función para verificar duplicados
async function checkDuplicateContact(type) {
  if (!isNewClient.value) return;
  
  try {
    checkingDuplicate.value = true;
    let params = new URLSearchParams();
    
    if (type === 'phone' && orderData.client_phone) {
      // No normalizar el teléfono - enviar con formato
      params.append('phone', orderData.client_phone);
    }
    
    if (type === 'email' && orderData.client_email) {
      params.append('email', orderData.client_email);
    }
    
    const response = await fetch(`http://localhost:3000/api/clients/check-duplicate?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al verificar información de cliente');
    }
    
    const data = await response.json();
    
    if (data.success && data.data.exists) {
      duplicateClientInfo.value = data.data.client;
      
      if (type === 'phone') {
        phoneError.value = `Este teléfono ya está registrado para ${data.data.client.name}`;
      } else if (type === 'email') {
        emailError.value = `Este correo ya está registrado para ${data.data.client.name}`;
      }
    } else {
      if (type === 'phone' && duplicateClientInfo.value && duplicateClientInfo.value.phone === orderData.client_phone) {
        duplicateClientInfo.value = null;
      } else if (type === 'email' && duplicateClientInfo.value && duplicateClientInfo.value.email === orderData.client_email) {
        duplicateClientInfo.value = null;
      }
    }
  } catch (error) {
    console.error('Error checking duplicate client:', error);
  } finally {
    checkingDuplicate.value = false;
  }
}

function useExistingClient(clientId) {
  isNewClient.value = false;
  orderData.client_id = clientId;
  orderData.client_name = duplicateClientInfo.value.name;
  orderData.client_phone = duplicateClientInfo.value.phone || '';
  orderData.client_email = duplicateClientInfo.value.email || '';
  duplicateClientInfo.value = null;
  phoneError.value = '';
  emailError.value = '';
}

function updateExistingClient(clientId) {
  // Mantener una referencia al cliente existente para actualizar después
  const clientToUpdate = {
    id: clientId,
    name: orderData.client_name,
    phone: orderData.client_phone,
    email: orderData.client_email
  };
  
  // Mostrar un mensaje de confirmación
  if (confirm(`¿Desea actualizar los datos del cliente existente?\n\nNombre: ${duplicateClientInfo.value.name} → ${orderData.client_name}\nTeléfono: ${duplicateClientInfo.value.phone || ''} → ${orderData.client_phone}\nEmail: ${duplicateClientInfo.value.email || ''} → ${orderData.client_email}`)) {
    // Realizar la actualización
    updateClient(clientToUpdate)
      .then(updatedClient => {
        // Actualizar datos en la orden con los valores devueltos por la API
        isNewClient.value = false;
        orderData.client_id = updatedClient.id;
        // Asegurar que los datos de la orden coincidan con los del cliente actualizado
        orderData.client_name = updatedClient.name;
        orderData.client_phone = updatedClient.phone || '';
        orderData.client_email = updatedClient.email || '';
        
        // Limpiar mensajes de error y datos duplicados
        duplicateClientInfo.value = null;
        phoneError.value = '';
        emailError.value = '';
        
        // Actualizar la lista de clientes para reflejar los cambios
        if (clients.value && clients.value.length > 0) {
          const index = clients.value.findIndex(client => client.id === updatedClient.id);
          if (index !== -1) {
            clients.value[index] = updatedClient;
          }
        }
        
        alert('Cliente actualizado correctamente');
      })
      .catch(error => {
        console.error('Error al actualizar cliente:', error);
        alert('Error al actualizar el cliente. Inténtelo de nuevo.');
      });
  }
}

async function updateClient(clientData) {
  try {
    const response = await fetch(`http://localhost:3000/api/clients/${clientData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al actualizar el cliente');
    }
    
    return data.data.client;
  } catch (error) {
    console.error('Error en updateClient:', error);
    throw error;
  }
}

function triggerSearch() {
  console.log('Ejecutando búsqueda con término:', clientSearchTerm.value);
  
  if (clientSearchTerm.value && clientSearchTerm.value.trim() !== '') {
    // Si hay un término de búsqueda, buscar por ese término
    const searchTerm = clientSearchTerm.value.trim();
    console.log(`Buscando clientes con término: "${searchTerm}"`);
    fetchClients(searchTerm);
    showClientList.value = true;
  } else {
    // Si el campo está vacío, cargar todos los clientes
    console.log('Término de búsqueda vacío, cargando todos los clientes');
    fetchClients('');
    showClientList.value = true;
  }
}

function selectClient(client) {
  orderData.client_id = client.id;
  orderData.client_name = client.name;
  orderData.client_phone = client.phone || '';
  orderData.client_email = client.email || '';
  isNewClient.value = false;
  showClientList.value = false;
}

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
  margin-bottom: 5px;
  width: 100%;
  display: inline-block;
}

.client-search-input {
  width: 100%;
  display: block;
  padding-right: 80px; /* Espacio para los íconos */
  background-color: #f9f9f9;
  transition: background-color 0.3s, border-color 0.3s;
}

.client-search-input:focus {
  background-color: #fff;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--medium-gray);
  cursor: pointer;
  transition: color 0.3s;
  padding: 5px;
  border-radius: 50%;
  background-color: #f0f0f0;
}

.clear-icon {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
  padding: 5px;
  border-radius: 50%;
}

.clear-icon:hover {
  color: #f44336;
}

.search-icon:hover {
  color: var(--primary-blue);
  background-color: #e0e0e0;
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

/* Estilos para la alerta de cliente duplicado */
.duplicate-client-alert {
  background-color: #fff9e6;
  border-radius: 8px;
  border: 1px solid #ffd699;
  margin: 20px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.alert-header {
  background-color: #ffecb3;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ffd699;
}

.alert-icon {
  color: #f57c00;
  margin-right: 8px;
  font-size: 22px;
}

.alert-title {
  font-weight: 600;
  color: #e65100;
  font-size: 16px;
}

.alert-content {
  padding: 15px;
}

.client-info {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 10px 15px;
  margin: 10px 0;
  border-left: 3px solid #ffb74d;
}

.alert-message {
  color: #d97706;
  font-weight: 500;
  margin-top: 10px;
  padding: 8px;
  background-color: rgba(255, 215, 0, 0.15);
  border-radius: 4px;
  text-align: center;
  border-left: 3px solid #ffc107;
}

.alert-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 15px;
}

.use-client-btn, .update-client-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.use-client-btn {
  background-color: #4CAF50;
  color: white;
}

.use-client-btn:hover {
  background-color: #3d8b40;
}

.update-client-btn {
  background-color: #2196F3;
  color: white;
}

.update-client-btn:hover {
  background-color: #0d8aee;
}

.btn-icon {
  margin-right: 6px;
  font-size: 18px;
}

.error-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-button {
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  padding: 0;
  font: inherit;
  outline: inherit;
  text-decoration: underline;
}

.client-dropdown {
  position: absolute;
  width: 100%; /* Mismo ancho que el input */
  background-color: white;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 5px;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  top: 100%;
  left: 0;
}

.dropdown-header {
  padding: 8px 15px;
  background-color: #f0f8ff;
  font-size: 13px;
  color: var(--primary-blue);
  font-weight: 500;
  border-bottom: 1px solid var(--light-blue);
  text-align: center;
}

.client-item {
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.client-item:last-child {
  border-bottom: none;
}

.client-item:hover {
  background-color: #f5f9ff;
}

.client-name {
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--dark-gray);
}

.client-details {
  color: var(--medium-gray);
  font-size: 12px;
  display: flex;
  gap: 10px;
}

.client-details span {
  display: inline-block;
}
</style>
