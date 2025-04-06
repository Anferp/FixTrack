<template>
  <form class="login-form" @submit.prevent="handleLogin">
    <div class="form-group" :class="{ 'has-error': errors.username }">
      <label for="username">Usuario</label>
      <input 
        type="text" 
        id="username" 
        v-model="username" 
        placeholder="Ingrese su nombre de usuario"
        required
        :disabled="isLoading"
      />
      <span class="error-message" v-if="errors.username">{{ errors.username }}</span>
    </div>
    
    <div class="form-group" :class="{ 'has-error': errors.password }">
      <label for="password">Contraseña</label>
      <div class="password-input-container">
        <input 
          :type="showPassword ? 'text' : 'password'" 
          id="password" 
          v-model="password" 
          placeholder="Ingrese su contraseña"
          required
          :disabled="isLoading"
        />
        <button 
          type="button" 
          class="toggle-password-btn" 
          @click="showPassword = !showPassword"
          :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        >
          <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="password-icon">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
      <span class="error-message" v-if="errors.password">{{ errors.password }}</span>
    </div>
    
    <div class="error-container" v-if="loginError">
      <p class="error-message">{{ loginError }}</p>
    </div>
    
    <button 
      type="submit" 
      class="login-button" 
      :disabled="isLoading"
    >
      <span v-if="isLoading">Cargando...</span>
      <span v-else>Iniciar Sesión</span>
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const loginError = ref('')
const showPassword = ref(false)
const errors = ref({
  username: '',
  password: ''
})

const validateForm = () => {
  errors.value = {
    username: '',
    password: ''
  }
  
  let isValid = true
  
  if (!username.value.trim()) {
    errors.value.username = 'El nombre de usuario es requerido'
    isValid = false
  }
  
  if (!password.value) {
    errors.value.password = 'La contraseña es requerida'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  loginError.value = ''
  isLoading.value = true
  
  try {
    const response = await authStore.login(username.value, password.value)
    
    if (response.temp_password_flag) {
      // Redirigir a pantalla de cambio de contraseña obligatorio
      router.push('/change-password')
    } else {
      // Redirigir según el rol del usuario
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
    }
  } catch (error) {
    loginError.value = error.message || 'Credenciales inválidas. Intente nuevamente.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-form {
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

.login-button {
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

.login-button:hover {
  background-color: #1565C0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.login-button:active {
  transform: translateY(1px);
}

.login-button:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
  box-shadow: none;
}

.error-container {
  margin-bottom: var(--spacing-medium);
  padding: var(--spacing-medium);
  background-color: #FFEBEE;
  border-radius: 4px;
  border-left: 3px solid #F44336;
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
