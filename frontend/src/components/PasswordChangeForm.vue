<template>
  <form class="password-change-form" @submit.prevent="handleChangePassword">
    <div class="form-group" :class="{ 'has-error': errors.currentPassword }">
      <label for="currentPassword">Contraseña Actual</label>
      <div class="password-input-container">
        <input 
          :type="showCurrentPassword ? 'text' : 'password'" 
          id="currentPassword" 
          v-model="currentPassword" 
          placeholder="Ingrese su contraseña actual"
          required
          :disabled="isLoading"
        />
        <button 
          type="button" 
          class="toggle-password-btn" 
          @click="showCurrentPassword = !showCurrentPassword"
          :aria-label="showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        >
          <svg v-if="showCurrentPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
      <span class="error-message" v-if="errors.currentPassword">{{ errors.currentPassword }}</span>
    </div>
    
    <div class="form-group" :class="{ 'has-error': errors.newPassword }">
      <label for="newPassword">Nueva Contraseña</label>
      <div class="password-input-container">
        <input 
          :type="showNewPassword ? 'text' : 'password'" 
          id="newPassword" 
          v-model="newPassword" 
          placeholder="Ingrese su nueva contraseña"
          required
          :disabled="isLoading"
        />
        <button 
          type="button" 
          class="toggle-password-btn" 
          @click="showNewPassword = !showNewPassword"
          :aria-label="showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        >
          <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
      <span class="error-message" v-if="errors.newPassword">{{ errors.newPassword }}</span>
    </div>
    
    <div class="form-group" :class="{ 'has-error': errors.confirmPassword }">
      <label for="confirmPassword">Confirmar Contraseña</label>
      <div class="password-input-container">
        <input 
          :type="showConfirmPassword ? 'text' : 'password'" 
          id="confirmPassword" 
          v-model="confirmPassword" 
          placeholder="Confirme su nueva contraseña"
          required
          :disabled="isLoading"
        />
        <button 
          type="button" 
          class="toggle-password-btn" 
          @click="showConfirmPassword = !showConfirmPassword"
          :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        >
          <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
      <span class="error-message" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>
    </div>
    
    <div class="error-container" v-if="changeError">
      <p class="error-message">{{ changeError }}</p>
    </div>
    
    <div class="success-container" v-if="successMessage">
      <p class="success-message">{{ successMessage }}</p>
    </div>
    
    <button 
      type="submit" 
      class="submit-button" 
      :disabled="isLoading"
    >
      <span v-if="isLoading">Procesando...</span>
      <span v-else>Cambiar Contraseña</span>
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const changeError = ref('')
const successMessage = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateForm = () => {
  errors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  
  let isValid = true
  
  if (!currentPassword.value) {
    errors.value.currentPassword = 'La contraseña actual es requerida'
    isValid = false
  }
  
  if (!newPassword.value) {
    errors.value.newPassword = 'La nueva contraseña es requerida'
    isValid = false
  } else if (newPassword.value.length < 8) {
    errors.value.newPassword = 'La contraseña debe tener al menos 8 caracteres'
    isValid = false
  } else if (newPassword.value === currentPassword.value) {
    errors.value.newPassword = 'La nueva contraseña debe ser diferente a la actual'
    isValid = false
  }
  
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Debe confirmar la nueva contraseña'
    isValid = false
  } else if (newPassword.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Las contraseñas no coinciden'
    isValid = false
  }
  
  return isValid
}

const handleChangePassword = async () => {
  if (!validateForm()) return
  
  changeError.value = ''
  successMessage.value = ''
  isLoading.value = true
  
  try {
    // Pasar confirmPassword como tercer argumento según la API
    const result = await authStore.changePassword(
      currentPassword.value, 
      newPassword.value,
      confirmPassword.value
    )
    
    successMessage.value = result.message || 'Contraseña cambiada exitosamente'
    
    // Esperar 2 segundos y luego redirigir según el rol del usuario
    setTimeout(() => {
      const userRole = authStore.userRole
      
      if (userRole === 'admin') {
        router.push('/admin/dashboard')
      } else if (userRole === 'secretary') {
        router.push('/secretary/dashboard')
      } else if (userRole === 'technician') {
        router.push('/technician/dashboard')
      } else {
        router.push('/login')
      }
    }, 2000)
  } catch (error) {
    changeError.value = error.message || 'Error al cambiar la contraseña. Intente nuevamente.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.password-change-form {
  width: 100%;
}

.form-group {
  margin-bottom: var(--spacing-large);
}

.form-group label {
  display: block;
  font-size: 14px;
  color: var(--medium-gray);
  margin-bottom: var(--spacing-small);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  height: 42px;
  padding: 0 var(--spacing-medium);
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: #fcfcfc;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px var(--light-blue);
  background-color: white;
}

.has-error input {
  border-color: #F44336;
  background-color: #FFEBEE;
}

.error-message {
  display: block;
  font-size: 12px;
  color: #F44336;
  margin-top: var(--spacing-small);
}

.error-container {
  margin-bottom: var(--spacing-medium);
  padding: var(--spacing-medium);
  background-color: #FFEBEE;
  border-radius: 4px;
  border-left: 3px solid #F44336;
}

.success-container {
  margin-bottom: var(--spacing-medium);
  padding: var(--spacing-medium);
  background-color: #E8F5E9;
  border-radius: 4px;
  border-left: 3px solid #4CAF50;
}

.success-message {
  font-size: 14px;
  color: #4CAF50;
}

.submit-button {
  width: 100%;
  height: 42px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  margin-top: var(--spacing-medium);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.submit-button:hover {
  background-color: #1565C0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.submit-button:active {
  transform: translateY(1px);
}

.submit-button:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
  box-shadow: none;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-container input {
  flex-grow: 1;
  padding-right: 40px;
}

.toggle-password-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--medium-gray);
  outline: none;
}

.toggle-password-btn:hover {
  color: var(--primary-blue);
}

.toggle-password-btn:focus {
  outline: none;
  box-shadow: none;
}

.password-icon {
  display: block;
}
</style>
