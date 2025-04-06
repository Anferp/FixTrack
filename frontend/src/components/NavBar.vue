<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <!-- <img src="../assets/logo.png" alt="FixTrack Logo" class="navbar-logo"> -->
        <h1 class="navbar-title">FixTrack</h1>
      </div>
      <div class="navbar-menu">
        <div class="navbar-user">
          <span class="user-name">{{ userStore.user?.username || 'Usuario' }}</span>
          <div class="user-role-badge">{{ translateRole(userStore.userRole) }}</div>
        </div>
        <div class="navbar-actions">
          <button @click="logout" class="logout-button">
            <span class="material-icons">logout</span>
            <span class="logout-text">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const userStore = useAuthStore();

function translateRole(role) {
  const roles = {
    'admin': 'Administrador',
    'secretary': 'Secretaria',
    'technician': 'Técnico'
  };
  return roles[role] || role;
}

async function logout() {
  await userStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.navbar {
  background-color: var(--primary-blue);
  height: 64px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 var(--spacing-large);
  max-width: 1440px;
  margin: 0 auto;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.navbar-logo {
  height: 36px;
  margin-right: var(--spacing-small);
}

.navbar-title {
  color: white;
  font-size: 24px;
  margin: 0;
}

.navbar-menu {
  display: flex;
  align-items: center;
}

.navbar-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: var(--spacing-large);
}

.user-name {
  color: white;
  font-weight: 500;
}

.user-role-badge {
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  margin-top: 4px;
}

.navbar-actions {
  display: flex;
}

.logout-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.logout-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.material-icons {
  font-size: 20px;
  margin-right: 4px;
}

.logout-text {
  display: inline;
}

@media (max-width: 600px) {
  .logout-text {
    display: none;
  }
  
  .navbar-user {
    margin-right: var(--spacing-small);
  }
  
  .navbar-container {
    padding: 0 var(--spacing-medium);
  }
}
</style>
