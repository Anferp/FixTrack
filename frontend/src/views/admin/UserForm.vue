<template>
  <div class="admin-user-form-page">
    <NavBar />
    <div class="layout-container">
      <Sidebar />
      <main class="main-content">
        <div class="page-header">
          <h1>{{ isEditMode ? 'Editar Usuario' : 'Crear Usuario' }}</h1>
          <button class="back-button" @click="goBack">
            <span class="material-icons">arrow_back</span>
            Volver a la lista
          </button>
        </div>
        
        <div class="form-container">
          <div v-if="loading" class="loading-container">
            <span class="material-icons loading-icon">donut_large</span>
            <p>Cargando información del usuario...</p>
          </div>
          
          <div v-else-if="error" class="error-container">
            <span class="material-icons error-icon">error_outline</span>
            <p>{{ error }}</p>
            <button class="primary-button retry-button" @click="fetchUserData">
              <span class="material-icons">refresh</span>
              Reintentar
            </button>
          </div>
          
          <form v-else @submit.prevent="saveUser" class="user-form">
            <div class="form-group">
              <label for="username">Nombre de Usuario</label>
              <input 
                type="text" 
                id="username" 
                v-model="formData.username" 
                required
                placeholder="Nombre de usuario"
              >
              <div v-if="validationErrors.username" class="error-message">
                {{ validationErrors.username }}
              </div>
            </div>
            
            <div class="form-group">
              <label for="role">Rol</label>
              <select id="role" v-model="formData.role" required>
                <option value="admin">Administrador</option>
                <option value="secretary">Secretaria</option>
                <option value="technician">Técnico</option>
              </select>
              <div v-if="validationErrors.role" class="error-message">
                {{ validationErrors.role }}
              </div>
            </div>
            
            <div v-if="!isEditMode" class="form-group">
              <label for="password">Contraseña Temporal</label>
              <div class="password-input-container">
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  id="password" 
                  v-model="formData.password" 
                  required
                  placeholder="Mínimo 8 caracteres"
                >
                <button 
                  type="button" 
                  class="toggle-password" 
                  @click="showPassword = !showPassword"
                >
                  <span class="material-icons">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              <div v-if="validationErrors.password" class="error-message">
                {{ validationErrors.password }}
              </div>
              <div class="password-hint">
                * El usuario deberá cambiar esta contraseña en su primer acceso
              </div>
            </div>
            
            <div v-if="isEditMode" class="form-group">
              <label>Estado</label>
              <div class="status-toggle-container">
                <span class="status-label">{{ formData.is_active ? 'Activo' : 'Inactivo' }}</span>
                <div 
                  class="status-toggle" 
                  :class="{ 'status-active': formData.is_active }"
                  @click="formData.is_active = !formData.is_active"
                >
                  <div class="status-toggle-slider"></div>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary-button" @click="goBack">Cancelar</button>
              <button type="submit" class="primary-button" :disabled="isSaving">
                <span v-if="isSaving" class="material-icons loading-icon-small">donut_large</span>
                <span v-else>{{ isEditMode ? 'Guardar Cambios' : 'Crear Usuario' }}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
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
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Estado para determinar si estamos en modo edición
const isEditMode = computed(() => {
  return route.params.id !== undefined;
});

// Estado del formulario
const formData = ref({
  username: '',
  role: 'technician',
  password: '',
  is_active: true
});

// Estado para mostrar/ocultar contraseña
const showPassword = ref(false);

// Estado para carga y errores
const loading = ref(false);
const error = ref('');
const validationErrors = ref({});
const isSaving = ref(false);

// Cargar datos del usuario al montar el componente (en modo edición)
onMounted(async () => {
  if (isEditMode.value) {
    await fetchUserData();
  }
});

// Obtener datos del usuario para edición
async function fetchUserData() {
  const userId = route.params.id;
  if (!userId) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const userData = await fetchOriginalUserData();
    
    if (userData) {
      // Asignar datos recibidos al formulario
      formData.value = {
        username: userData.username,
        role: userData.role,
        is_active: userData.is_active
      };
    }
  } catch (err) {
    console.error('Error fetching user data:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Función para obtener los datos originales del usuario para comparaciones
async function fetchOriginalUserData() {
  const userId = route.params.id;
  if (!userId) return null;
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener información del usuario');
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.user;
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (err) {
    console.error('Error fetching original user data:', err);
    error.value = err.message;
    return null;
  }
}

// Validar formulario
function validateForm() {
  const errors = {};
  
  if (!formData.value.username.trim()) {
    errors.username = 'El nombre de usuario es obligatorio';
  } else if (formData.value.username.length < 3) {
    errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
  }
  
  if (!formData.value.role) {
    errors.role = 'Debes seleccionar un rol';
  }
  
  if (!isEditMode.value && formData.value.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres';
  }
  
  validationErrors.value = errors;
  return Object.keys(errors).length === 0;
}

// Guardar usuario
async function saveUser() {
  if (!validateForm()) return;
  
  isSaving.value = true;
  
  try {
    if (isEditMode.value) {
      // Guardar valores originales para compararlos después
      const originalData = await fetchOriginalUserData();
      if (!originalData) throw new Error('No se pudo obtener los datos originales del usuario');
      
      // Actualizar información básica del usuario (username, role)
      const updateResponse = await fetch(`http://localhost:3000/api/admin/users/${route.params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.value.username,
          role: formData.value.role
        })
      });
      
      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.error || 'Error al actualizar usuario');
      }
      
      // Si el estado de activación cambió, actualizarlo por separado
      if (originalData.is_active !== formData.value.is_active) {
        const activateResponse = await fetch(`http://localhost:3000/api/admin/users/${route.params.id}/activate`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_active: formData.value.is_active
          })
        });
        
        if (!activateResponse.ok) {
          const error = await activateResponse.json();
          throw new Error(error.error || 'Error al cambiar el estado de activación');
        }
      }
      
      // Redireccionar a la lista de usuarios con mensaje de éxito
      router.push('/admin/users');
      // Mostrar mensaje de éxito
      alert('Usuario actualizado correctamente');
    } else {
      // Crear nuevo usuario
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.value.username,
          password: formData.value.password,
          role: formData.value.role
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear usuario');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Redireccionar a la lista de usuarios con mensaje de éxito
        router.push('/admin/users');
        // Mostrar mensaje de éxito
        alert('Usuario creado correctamente');
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    }
  } catch (err) {
    console.error('Error saving user:', err);
    
    // Manejar errores comunes
    if (err.message.includes('ya existe')) {
      validationErrors.value.username = 'Este nombre de usuario ya está en uso';
    } else {
      alert(`Error: ${err.message}`);
    }
  } finally {
    isSaving.value = false;
  }
}

// Volver a la lista de usuarios
function goBack() {
  router.push('/admin/users');
}
</script>

<style scoped>
.admin-user-form-page {
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

.back-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
}

.back-button .material-icons {
  margin-right: 4px;
}

.form-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-large);
}

.user-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: var(--spacing-large);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark-gray);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.password-input-container {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--medium-gray);
}

.password-hint {
  font-size: 12px;
  color: var(--medium-gray);
  margin-top: 4px;
  font-style: italic;
}

.status-toggle-container {
  display: flex;
  align-items: center;
}

.status-label {
  margin-right: 16px;
  font-weight: 500;
}

.status-toggle {
  width: 50px;
  height: 24px;
  background-color: #ccc;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;
}

.status-toggle-slider {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: left 0.3s;
}

.status-toggle.status-active {
  background-color: #4CAF50;
}

.status-toggle.status-active .status-toggle-slider {
  left: 28px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-large);
}

.secondary-button {
  background-color: white;
  border: 1px solid var(--medium-gray);
  color: var(--dark-gray);
  border-radius: 4px;
  padding: 10px 16px;
  margin-right: 8px;
  cursor: pointer;
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 120px;
}

.primary-button:hover:not(:disabled) {
  background-color: #1565C0;
}

.primary-button:disabled {
  background-color: #90CAF9;
  cursor: not-allowed;
}

.error-message {
  color: #F44336;
  font-size: 12px;
  margin-top: 4px;
}

.loading-container,
.error-container {
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

.retry-button {
  margin-top: var(--spacing-medium);
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
  
  .form-container {
    padding: var(--spacing-medium);
  }
}
</style>
