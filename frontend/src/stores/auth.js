import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const userRole = ref(localStorage.getItem('userRole') || null)

  async function login(username, password) {
    try {
      // Realizar la solicitud a la API
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error de autenticación')
      }

      const result = await response.json()
      
      // Según la documentación, los datos vienen en result.data
      const data = result.data
      
      // Guardar token y datos de usuario
      token.value = data.token
      user.value = data.user
      userRole.value = data.user.role
      
      // Almacenar en localStorage para persistencia
      localStorage.setItem('token', data.token)
      localStorage.setItem('userRole', data.user.role)
      
      return data.user
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  async function changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      // Verificar que el usuario esté autenticado
      if (!token.value) {
        throw new Error('Usuario no autenticado')
      }

      // Realizar la solicitud a la API según la documentación
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cambiar la contraseña')
      }

      const result = await response.json()
      const data = result.data
      
      // Actualizar datos del usuario si es necesario
      if (data && data.temp_password_flag !== undefined) {
        if (user.value) {
          user.value.temp_password_flag = data.temp_password_flag;
        }
      }
      
      return { message: result.message, data }
    } catch (error) {
      console.error('Error en cambio de contraseña:', error)
      throw error
    }
  }

  function logout() {
    // Limpiar datos de autenticación
    user.value = null
    token.value = null
    userRole.value = null
    
    // Limpiar localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
  }

  function isAuthenticated() {
    return !!token.value
  }

  return {
    user,
    token,
    userRole,
    login,
    logout,
    changePassword,
    isAuthenticated
  }
})
