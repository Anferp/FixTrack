<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="logo-container">
          <!-- <img src="../assets/logo.svg" alt="FixTrack Logo" class="logo" /> -->
          <h1 class="app-title">FixTrack</h1>
        </div>
        <h2 class="login-title">Iniciar Sesión</h2>
        
        <LoginForm />
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import LoginForm from '../components/LoginForm.vue'
import Footer from '../components/Footer.vue'
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.login-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-large);
  width: 100%;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.15);
  padding: var(--spacing-xlarge);
  margin-bottom: var(--spacing-xlarge);
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--spacing-xlarge);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-medium);
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.1));
}

.app-title {
  color: var(--primary-blue);
  font-size: 2.2rem;
  margin-bottom: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.login-title {
  color: var(--dark-gray);
  font-size: 1.5rem;
  margin-bottom: var(--spacing-large);
  font-weight: 500;
  text-align: center;
}

@media (max-width: 768px) {
  .login-card {
    padding: var(--spacing-large);
  }
  
  .app-title {
    font-size: 1.8rem;
  }
  
  .login-title {
    font-size: 1.3rem;
  }
}
</style>
