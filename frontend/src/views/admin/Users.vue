<template>
  <div class="admin-users-page">
    <NavBar />
    <div class="layout-container">
      <Sidebar />
      <main class="main-content">
        <div class="page-header">
          <h1>Gestión de Usuarios</h1>
          <button class="primary-button" @click="goToCreateUser">
            <span class="material-icons">person_add</span>
            Nuevo Usuario
          </button>
        </div>
        
        <UserSearchFilter @filter-change="handleFilterChange" />
        
        <div class="users-table-container">
          <div v-if="loading" class="loading-container">
            <span class="material-icons loading-icon">donut_large</span>
            <p>Cargando usuarios...</p>
          </div>
          
          <div v-else-if="error" class="error-container">
            <span class="material-icons error-icon">error_outline</span>
            <p>{{ error }}</p>
          </div>
          
          <div v-else-if="users.length === 0" class="empty-state">
            <span class="material-icons empty-icon">people</span>
            <p>No se encontraron usuarios</p>
          </div>
          
          <table v-else class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Contraseña Temporal</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>
                  <span :class="['role-badge', `role-${user.role}`]">
                    {{ translateRole(user.role) }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', user.is_active ? 'active' : 'inactive']">
                    {{ user.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <span :class="['temp-badge', user.temp_password_flag ? 'yes' : 'no']">
                    {{ user.temp_password_flag ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td class="actions-cell">
                  <button 
                    class="action-button edit-button" 
                    @click="editUser(user.id)"
                    title="Editar Usuario"
                  >
                    <span class="material-icons">edit</span>
                  </button>
                  <button 
                    class="action-button reset-button" 
                    @click="resetPassword(user.id)"
                    title="Resetear Contraseña"
                  >
                    <span class="material-icons">lock_reset</span>
                  </button>
                  <button 
                    :class="['action-button', user.is_active ? 'deactivate-button' : 'activate-button']" 
                    @click="toggleUserActive(user)"
                    :title="user.is_active ? 'Desactivar Usuario' : 'Activar Usuario'"
                  >
                    <span class="material-icons">{{ user.is_active ? 'person_off' : 'person' }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="!loading && !error && users.length > 0" class="pagination">
            <button 
              class="pagination-button" 
              :disabled="currentPage === 1" 
              @click="changePage(currentPage - 1)"
            >
              <span class="material-icons">arrow_back</span>
            </button>
            <span class="page-info">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            <button 
              class="pagination-button" 
              :disabled="currentPage === totalPages" 
              @click="changePage(currentPage + 1)"
            >
              <span class="material-icons">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
    <Footer />
    
    <!-- Modal para resetear contraseña -->
    <div v-if="showPasswordModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Resetear Contraseña</h2>
          <button class="close-button" @click="showPasswordModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p>Ingresa una nueva contraseña temporal para el usuario.</p>
          <div class="form-group">
            <label for="newPassword">Nueva Contraseña</label>
            <input 
              type="password" 
              id="newPassword" 
              v-model="newPassword" 
              placeholder="Mínimo 8 caracteres"
            >
            <div v-if="passwordError" class="error-message">
              {{ passwordError }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showPasswordModal = false">Cancelar</button>
          <button class="primary-button" @click="confirmResetPassword" :disabled="isResetting">
            <span v-if="isResetting" class="material-icons loading-icon-small">donut_large</span>
            <span v-else>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal para confirmar activación/desactivación -->
    <div v-if="showActivationModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedUser?.is_active ? 'Desactivar' : 'Activar' }} Usuario</h2>
          <button class="close-button" @click="showActivationModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p v-if="selectedUser?.is_active">
            ¿Estás seguro de que deseas desactivar al usuario <strong>{{ selectedUser?.username }}</strong>?
            El usuario no podrá acceder al sistema mientras esté desactivado.
          </p>
          <p v-else>
            ¿Estás seguro de que deseas activar al usuario <strong>{{ selectedUser?.username }}</strong>?
            El usuario podrá volver a acceder al sistema.
          </p>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showActivationModal = false">Cancelar</button>
          <button 
            :class="['primary-button', selectedUser?.is_active ? 'deactivate-button' : 'activate-button']" 
            @click="confirmToggleActive" 
            :disabled="isUpdating"
          >
            <span v-if="isUpdating" class="material-icons loading-icon-small">donut_large</span>
            <span v-else>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';
import UserSearchFilter from '../../components/UserSearchFilter.vue';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Estado para la lista de usuarios
const users = ref([]);
const loading = ref(true);
const error = ref('');

// Estado para la paginación
const currentPage = ref(1);
const limit = ref(10);
const totalUsers = ref(0);
const totalPages = ref(1);

// Estado para filtros
const filters = ref({
  role: '',
  active: '',
  search: ''
});

// Estado para modales
const showPasswordModal = ref(false);
const showActivationModal = ref(false);
const selectedUserId = ref(null);
const selectedUser = ref(null);
const newPassword = ref('');
const passwordError = ref('');
const isResetting = ref(false);
const isUpdating = ref(false);

// Cargar usuarios al montar el componente
onMounted(async () => {
  await fetchUsers();
});

// Función para obtener usuarios del API
async function fetchUsers() {
  loading.value = true;
  error.value = '';
  
  try {
    // Construir URL con parámetros de filtro y paginación
    let url = `http://localhost:3000/api/admin/users?page=${currentPage.value}&limit=${limit.value}`;
    
    if (filters.value.role) {
      url += `&role=${filters.value.role}`;
    }
    
    if (filters.value.active !== '') {
      url += `&active=${filters.value.active}`;
    }
    
    if (filters.value.search) {
      url += `&search=${encodeURIComponent(filters.value.search)}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    
    const data = await response.json();
    
    if (data.success) {
      users.value = data.data.users;
      totalUsers.value = data.data.pagination.total;
      totalPages.value = data.data.pagination.pages;
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    error.value = err.message;
    users.value = [];
  } finally {
    loading.value = false;
  }
}

// Manejar cambio de filtros
function handleFilterChange(newFilters) {
  filters.value = {...newFilters};
  currentPage.value = 1; // Resetear a primera página al cambiar filtros
  fetchUsers();
}

// Cambiar de página
function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchUsers();
}

// Traducir roles a español
function translateRole(role) {
  const roles = {
    'admin': 'Administrador',
    'secretary': 'Secretaria',
    'technician': 'Técnico'
  };
  return roles[role] || role;
}

// Formatear fecha
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// Navegar a crear usuario
function goToCreateUser() {
  router.push('/admin/users/new');
}

// Navegar a editar usuario
function editUser(userId) {
  router.push(`/admin/users/${userId}/edit`);
}

// Mostrar modal para resetear contraseña
function resetPassword(userId) {
  selectedUserId.value = userId;
  newPassword.value = '';
  passwordError.value = '';
  showPasswordModal.value = true;
}

// Confirmar reseteo de contraseña
async function confirmResetPassword() {
  if (newPassword.value.length < 8) {
    passwordError.value = 'La contraseña debe tener al menos 8 caracteres';
    return;
  }
  
  isResetting.value = true;
  passwordError.value = '';
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/users/${selectedUserId.value}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_password: newPassword.value
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al resetear contraseña');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar usuario en la lista
      const index = users.value.findIndex(user => user.id === selectedUserId.value);
      if (index !== -1) {
        users.value[index].temp_password_flag = true;
        users.value[index].updated_at = data.data.user.updated_at;
      }
      
      // Cerrar modal
      showPasswordModal.value = false;
      
      // Mostrar mensaje de éxito
      alert('Contraseña reseteada correctamente');
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (err) {
    console.error('Error resetting password:', err);
    passwordError.value = err.message;
  } finally {
    isResetting.value = false;
  }
}

// Mostrar modal para activar/desactivar usuario
function toggleUserActive(user) {
  // Verificar que no es el usuario actual
  if (user.id === authStore.user?.id) {
    alert('No puedes desactivar tu propia cuenta');
    return;
  }
  
  selectedUser.value = user;
  showActivationModal.value = true;
}

// Confirmar activación/desactivación de usuario
async function confirmToggleActive() {
  if (!selectedUser.value) return;
  
  isUpdating.value = true;
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/users/${selectedUser.value.id}/activate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_active: !selectedUser.value.is_active
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar estado del usuario');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar usuario en la lista
      const index = users.value.findIndex(user => user.id === selectedUser.value.id);
      if (index !== -1) {
        users.value[index].is_active = !selectedUser.value.is_active;
        users.value[index].updated_at = data.data.user.updated_at;
      }
      
      // Cerrar modal
      showActivationModal.value = false;
      
      // Mostrar mensaje de éxito
      alert(`Usuario ${!selectedUser.value.is_active ? 'desactivado' : 'activado'} correctamente`);
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (err) {
    console.error('Error updating user status:', err);
    alert(err.message);
  } finally {
    isUpdating.value = false;
  }
}
</script>

<style scoped>
.admin-users-page {
  min-height: 100vh;
  width: 100%;
}

.layout-container {
  display: flex;
  margin-top: 64px; /* NavBar height */
}

.main-content {
  flex: 1;
  margin-left: 250px; /* Sidebar width */
  padding: var(--spacing-large);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-large);
}

.page-header h1 {
  font-size: 24px;
  color: var(--dark-gray);
  margin: 0;
}

.primary-button {
  display: flex;
  align-items: center;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.primary-button:hover {
  background-color: #1565C0;
}

.primary-button .material-icons {
  font-size: 18px;
  margin-right: 8px;
}

.users-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: var(--spacing-large);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th, 
.users-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.users-table th {
  background-color: #f8f8f8;
  font-weight: 600;
  color: var(--dark-gray);
}

.users-table tr:hover {
  background-color: #f9f9f9;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background-color: #E91E63;
  color: white;
}

.role-secretary {
  background-color: #9C27B0;
  color: white;
}

.role-technician {
  background-color: #3F51B5;
  color: white;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background-color: #4CAF50;
  color: white;
}

.status-badge.inactive {
  background-color: #F44336;
  color: white;
}

.temp-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.temp-badge.yes {
  background-color: #FF9800;
  color: white;
}

.temp-badge.no {
  background-color: #9E9E9E;
  color: white;
}

.actions-cell {
  white-space: nowrap;
}

.action-button {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-right: 4px;
}

.action-button .material-icons {
  font-size: 18px;
}

.edit-button {
  color: var(--primary-blue);
}

.edit-button:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.reset-button {
  color: #FF9800;
}

.reset-button:hover {
  background-color: rgba(255, 152, 0, 0.1);
}

.deactivate-button {
  color: #F44336;
}

.deactivate-button:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.activate-button {
  color: #4CAF50;
}

.activate-button:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-medium);
  border-top: 1px solid #f0f0f0;
}

.pagination-button {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
  color: var(--primary-blue);
}

.pagination-button:hover:not(:disabled) {
  background-color: rgba(25, 118, 210, 0.1);
}

.pagination-button:disabled {
  color: var(--medium-gray);
  cursor: not-allowed;
}

.page-info {
  margin: 0 var(--spacing-medium);
  color: var(--dark-gray);
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xlarge) 0;
  color: var(--medium-gray);
  text-align: center;
}

.loading-icon {
  font-size: 48px;
  color: var(--primary-blue);
  animation: spin 1.5s linear infinite;
  margin-bottom: var(--spacing-small);
}

.error-icon {
  font-size: 48px;
  color: #F44336;
  margin-bottom: var(--spacing-small);
}

.empty-icon {
  font-size: 48px;
  color: var(--medium-gray);
  margin-bottom: var(--spacing-small);
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--dark-gray);
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--medium-gray);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-top: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark-gray);
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-size: 14px;
}

.error-message {
  color: #F44336;
  font-size: 12px;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.secondary-button {
  background-color: white;
  border: 1px solid var(--medium-gray);
  color: var(--dark-gray);
  border-radius: 4px;
  padding: 8px 16px;
  margin-right: 8px;
  cursor: pointer;
}

.loading-icon-small {
  font-size: 16px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .main-content {
    margin-left: 60px; /* Collapsed Sidebar width */
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-header h1 {
    margin-bottom: var(--spacing-small);
  }
  
  .users-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
