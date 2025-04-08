<template>
  <aside class="sidebar" :class="{ 'sidebar-collapsed': collapsed }">
    <div class="sidebar-toggle" @click="toggleSidebar">
      <span class="material-icons">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
    </div>
    
    <div class="sidebar-content">
      <!-- Debug information - eliminar después -->
      <div class="debug-info" v-if="false">
        Role: {{ userRole || 'No role' }}
      </div>
      
      <nav class="sidebar-nav">
        <!-- Sección para todos los usuarios -->
        <div class="sidebar-section">
          <div class="sidebar-section-title">General</div>
          <div class="sidebar-item" @click="logout">
            <span class="material-icons">logout</span>
            <span class="sidebar-item-text">Cerrar Sesión</span>
          </div>
        </div>
        
        <!-- Secretaria -->
        <div v-if="userRole === 'secretary'" class="sidebar-section">
          <div class="sidebar-section-title">Secretaria</div>
          <router-link 
            to="/secretary/dashboard" 
            class="sidebar-item"
            active-class="active"
          >
            <span class="material-icons">dashboard</span>
            <span class="sidebar-item-text">Dashboard</span>
          </router-link>
          <router-link 
            to="/secretary/orders/new" 
            class="sidebar-item"
            active-class="active"
          >
            <span class="material-icons">add_circle</span>
            <span class="sidebar-item-text">Nueva Orden</span>
          </router-link>
        </div>

        <!-- Técnico -->
        <div v-if="userRole === 'technician'" class="sidebar-section">
          <div class="sidebar-section-title">Técnico</div>
          <router-link 
            to="/technician/dashboard" 
            class="sidebar-item"
            active-class="active"
          >
            <span class="material-icons">dashboard</span>
            <span class="sidebar-item-text">Dashboard</span>
          </router-link>
          <router-link 
            to="/technician/all-orders" 
            class="sidebar-item"
            active-class="active"
          >
            <span class="material-icons">list_alt</span>
            <span class="sidebar-item-text">Todas las Órdenes</span>
          </router-link>
        </div>

        <!-- Administrador -->
        <div v-if="userRole === 'admin'" class="sidebar-section">
          <div class="sidebar-section-title">Administrador</div>
          <router-link 
            to="/admin/dashboard" 
            class="sidebar-item"
            active-class="active"
          >
            <span class="material-icons">dashboard</span>
            <span class="sidebar-item-text">Dashboard</span>
          </router-link>
          <router-link 
            to="/admin/users" 
            class="sidebar-item"
            active-class="active"
          >
            <span class="material-icons">people</span>
            <span class="sidebar-item-text">Usuarios</span>
          </router-link>
          <router-link 
            to="/admin/reports" 
            class="sidebar-item"
            active-class="active"
          >
            <span class="material-icons">analytics</span>
            <span class="sidebar-item-text">Reportes</span>
          </router-link>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const collapsed = ref(false);

// Computa el rol de usuario desde el store
const userRole = computed(() => {
  return authStore.userRole;
});

// Toggle para colapsar/expandir el sidebar
const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
};

// Función para cerrar sesión
const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Verificar el estado de autenticación al montar el componente
onMounted(() => {
  console.log('Current user role:', userRole.value);
  if (!authStore.isAuthenticated()) {
    console.log('User not authenticated, redirecting to login');
    router.push('/login');
  }
});
</script>

<style scoped>
.sidebar {
  background-color: white;
  width: 250px;
  height: calc(100vh - 64px); /* Restar la altura del NavBar */
  position: fixed;
  top: 64px;
  left: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
  z-index: 90;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed {
  width: 60px;
}

.sidebar-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--light-gray);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.sidebar-toggle .material-icons {
  font-size: 20px;
  color: var(--medium-gray);
}

.sidebar-content {
  padding: var(--spacing-large) 0;
  margin-top: var(--spacing-xlarge);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.sidebar-section {
  margin-bottom: var(--spacing-large);
}

.sidebar-section-title {
  padding: 0 var(--spacing-medium);
  margin-bottom: var(--spacing-small);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--medium-gray);
  letter-spacing: 0.5px;
  white-space: nowrap;
  font-weight: 500;
}

.sidebar-collapsed .sidebar-section-title {
  display: none;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-small) var(--spacing-medium);
  color: var(--dark-gray);
  text-decoration: none;
  transition: background-color 0.3s;
  border-left: 3px solid transparent;
  cursor: pointer;
}

.sidebar-item:hover {
  background-color: var(--light-gray);
}

.sidebar-item.active {
  border-left-color: var(--primary-blue);
  background-color: var(--light-gray);
  color: var(--primary-blue);
}

.sidebar-item .material-icons {
  margin-right: var(--spacing-medium);
  font-size: 20px;
}

.sidebar-collapsed .sidebar-item-text {
  display: none;
}

.sidebar-collapsed .sidebar-item {
  justify-content: center;
  padding: var(--spacing-small) 0;
}

.sidebar-collapsed .sidebar-item .material-icons {
  margin-right: 0;
}

.debug-info {
  background-color: #f8d7da;
  color: #721c24;
  padding: 8px;
  margin-bottom: 16px;
  font-size: 12px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .sidebar-item-text, .sidebar-section-title {
    display: none;
  }
  
  .sidebar-item {
    justify-content: center;
    padding: var(--spacing-small) 0;
  }
  
  .sidebar-item .material-icons {
    margin-right: 0;
  }
  
  .sidebar-toggle {
    display: none;
  }
}
</style>
