<template>
  <div class="admin-dashboard">
    <NavBar />
    <Sidebar />
    
    <div class="dashboard-content">
      <h1 class="page-title">Dashboard Administrador</h1>
      
      <div class="stats-cards">
        <StatsCard
          title="Total Órdenes"
          :value="dashboardData.totalOrders"
          icon="receipt_long"
          backgroundColor="white"
          iconColor="var(--primary-blue)"
        />
        <StatsCard
          title="Órdenes Activas"
          :value="dashboardData.activeOrders"
          icon="pending_actions"
          backgroundColor="white"
          iconColor="#FFC107"
        />
        <StatsCard
          title="Órdenes Completadas"
          :value="dashboardData.completedOrders"
          icon="task_alt"
          backgroundColor="white"
          iconColor="#4CAF50"
        />
        <StatsCard
          title="Técnicos Activos"
          :value="dashboardData.activeTechnicians"
          icon="engineering"
          backgroundColor="white"
          iconColor="#FF9800"
        />
      </div>
      
      <div class="dashboard-row">
        <ChartContainer
          title="Distribución de Órdenes por Estado"
          :loading="loadingStatus"
          :error="errorStatus"
          :data="statusDistributionData"
          :height="350"
        >
          <div class="pie-chart-container">
            <div v-for="(item, index) in statusDistributionData" :key="index" class="pie-chart-segment">
              <div class="status-color" :style="{ backgroundColor: getStatusColor(item.status) }"></div>
              <div class="status-info">
                <div class="status-name">{{ translateStatus(item.status) }}</div>
                <div class="status-count">{{ item.count }} órdenes ({{ item.percentage }}%)</div>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>
      
      <div class="dashboard-row">
        <ChartContainer
          title="Rendimiento de Técnicos"
          :loading="loadingTechnicians"
          :error="errorTechnicians"
          :data="technicianPerformanceData"
          :height="400"
        >
          <div class="bar-chart-container">
            <div v-for="(item, index) in technicianPerformanceData" :key="index" class="technician-performance">
              <div class="technician-name">{{ item.username }}</div>
              <div class="performance-bars">
                <div class="performance-category">
                  <span>Asignadas:</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${getPercentage(item.orders_assigned, maxAssigned)}%`, backgroundColor: 'var(--in-review)' }"></div>
                  </div>
                  <span class="bar-value">{{ item.orders_assigned }}</span>
                </div>
                <div class="performance-category">
                  <span>Completadas:</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${getPercentage(item.orders_completed, maxCompleted)}%`, backgroundColor: 'var(--repaired)' }"></div>
                  </div>
                  <span class="bar-value">{{ item.orders_completed }}</span>
                </div>
                <div class="performance-category">
                  <span>Tasa de finalización:</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${item.completion_rate}%`, backgroundColor: getCompletionRateColor(item.completion_rate) }"></div>
                  </div>
                  <span class="bar-value">{{ item.completion_rate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>
      
      <div class="dashboard-row">
        <ChartContainer
          title="Problemas Más Comunes"
          :loading="loadingProblems"
          :error="errorProblems"
          :data="commonProblemsData"
          :height="350"
        >
          <div class="horizontal-bar-chart">
            <div v-for="(item, index) in commonProblemsData" :key="index" class="problem-bar">
              <div class="problem-name">{{ item.keyword }}</div>
              <div class="problem-bar-container">
                <div class="problem-bar-fill" :style="{ width: `${item.percentage}%` }"></div>
                <span class="problem-value">{{ item.count }} ({{ item.percentage }}%)</span>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>
    </div>
    
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';
import StatsCard from '../../components/StatsCard.vue';
import ChartContainer from '../../components/ChartContainer.vue';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

// Estado para almacenar datos del dashboard
const dashboardData = ref({
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  activeTechnicians: 0
});

// Estado para distribución de órdenes por estado
const statusDistributionData = ref([]);
const loadingStatus = ref(true);
const errorStatus = ref('');

// Estado para rendimiento de técnicos
const technicianPerformanceData = ref([]);
const loadingTechnicians = ref(true);
const errorTechnicians = ref('');

// Estado para problemas comunes
const commonProblemsData = ref([]);
const loadingProblems = ref(true);
const errorProblems = ref('');

// Valores máximos para las barras de progreso
const maxAssigned = computed(() => {
  if (!technicianPerformanceData.value.length) return 0;
  return Math.max(...technicianPerformanceData.value.map(tech => tech.orders_assigned));
});

const maxCompleted = computed(() => {
  if (!technicianPerformanceData.value.length) return 0;
  return Math.max(...technicianPerformanceData.value.map(tech => tech.orders_completed));
});

// Función para obtener porcentaje relativo al máximo
function getPercentage(value, max) {
  if (max === 0) return 0;
  return (value / max) * 100;
}

// Función para traducir los estados
function translateStatus(status) {
  const statusMap = {
    'pending': 'Pendiente',
    'in_review': 'En revisión',
    'repaired': 'Reparado',
    'waiting_parts': 'Esperando repuestos',
    'closed': 'Cerrado'
  };
  
  return statusMap[status] || status;
}

// Función para obtener color según el estado
function getStatusColor(status) {
  const colorMap = {
    'pending': 'var(--pending)',
    'in_review': 'var(--in-review)',
    'repaired': 'var(--repaired)',
    'waiting_parts': 'var(--waiting-parts)',
    'closed': 'var(--closed)'
  };
  
  return colorMap[status] || 'var(--medium-gray)';
}

// Función para obtener color según tasa de finalización
function getCompletionRateColor(rate) {
  if (rate >= 80) return '#4CAF50';
  if (rate >= 60) return '#FFC107';
  return '#FF5722';
}

// Función para cargar datos de distribución de estados
async function fetchStatusDistribution() {
  loadingStatus.value = true;
  errorStatus.value = '';
  
  try {
    const response = await fetch('http://localhost:3000/api/reports/status-distribution', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar la distribución de estados');
    }
    
    const data = await response.json();
    
    if (data.success) {
      statusDistributionData.value = data.data.distribution;
      dashboardData.value.totalOrders = data.data.total_orders;
      
      // Calcular órdenes activas y completadas
      const completedOrders = statusDistributionData.value
        .filter(item => ['repaired', 'closed', 'completed'].includes(item.status))
        .reduce((sum, item) => sum + item.count, 0);
      
      dashboardData.value.completedOrders = completedOrders;
      dashboardData.value.activeOrders = dashboardData.value.totalOrders - completedOrders;
    } else {
      throw new Error(data.error || 'Error al procesar los datos');
    }
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    errorStatus.value = error.message;
  } finally {
    loadingStatus.value = false;
  }
}

// Función para cargar datos de rendimiento de técnicos
async function fetchTechnicianPerformance() {
  loadingTechnicians.value = true;
  errorTechnicians.value = '';
  
  try {
    const response = await fetch('http://localhost:3000/api/reports/technician-performance', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar el rendimiento de técnicos');
    }
    
    const data = await response.json();
    
    if (data.success) {
      technicianPerformanceData.value = data.data.technicians;
      dashboardData.value.activeTechnicians = technicianPerformanceData.value.length;
    } else {
      throw new Error(data.error || 'Error al procesar los datos');
    }
  } catch (error) {
    console.error('Error fetching technician performance:', error);
    errorTechnicians.value = error.message;
  } finally {
    loadingTechnicians.value = false;
  }
}

// Función para cargar datos de problemas comunes
async function fetchCommonProblems() {
  loadingProblems.value = true;
  errorProblems.value = '';
  
  try {
    const response = await fetch('http://localhost:3000/api/reports/common-problems', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar los problemas comunes');
    }
    
    const data = await response.json();
    
    if (data.success) {
      commonProblemsData.value = data.data.problems;
    } else {
      throw new Error(data.error || 'Error al procesar los datos');
    }
  } catch (error) {
    console.error('Error fetching common problems:', error);
    errorProblems.value = error.message;
  } finally {
    loadingProblems.value = false;
  }
}

// Cargar todos los datos al montar el componente
onMounted(async () => {
  await Promise.all([
    fetchStatusDistribution(),
    fetchTechnicianPerformance(),
    fetchCommonProblems()
  ]);
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  padding-top: 64px;
  padding-left: 250px;
  background-color: #F8F9FA;
}

.dashboard-content {
  padding: var(--spacing-xlarge);
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: var(--spacing-large);
  font-size: 24px;
  color: var(--dark-gray);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.dashboard-row {
  margin-bottom: var(--spacing-large);
}

/* Estilos para el gráfico circular de distribución de estados */
.pie-chart-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
  padding: var(--spacing-small);
}

.pie-chart-segment {
  display: flex;
  align-items: center;
  padding: var(--spacing-small);
  border-radius: 4px;
}

.pie-chart-segment:hover {
  background-color: var(--light-gray);
}

.status-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  margin-right: var(--spacing-medium);
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-name {
  font-weight: 500;
  color: var(--dark-gray);
}

.status-count {
  font-size: 14px;
  color: var(--medium-gray);
}

/* Estilos para el gráfico de rendimiento de técnicos */
.bar-chart-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-large);
  padding: var(--spacing-small);
}

.technician-performance {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.technician-name {
  font-weight: 500;
  color: var(--dark-gray);
  margin-bottom: var(--spacing-small);
}

.performance-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.performance-category {
  display: flex;
  align-items: center;
  gap: var(--spacing-small);
}

.performance-category span {
  font-size: 14px;
  color: var(--medium-gray);
  width: 130px;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background-color: var(--light-gray);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.bar-value {
  font-size: 14px;
  color: var(--dark-gray);
  font-weight: 500;
  width: 50px;
  text-align: right;
}

/* Estilos para el gráfico de problemas comunes */
.horizontal-bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
  padding: var(--spacing-small);
}

.problem-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-medium);
}

.problem-name {
  width: 150px;
  font-weight: 500;
  color: var(--dark-gray);
}

.problem-bar-container {
  flex: 1;
  height: 24px;
  background-color: var(--light-gray);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.problem-bar-fill {
  height: 100%;
  background-color: var(--primary-blue);
  border-radius: 4px 0 0 4px;
  transition: width 0.5s ease;
}

.problem-value {
  position: absolute;
  right: var(--spacing-small);
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--dark-gray);
  font-weight: 500;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding-left: 60px;
  }
  
  .dashboard-content {
    padding: var(--spacing-medium);
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .problem-name {
    width: 100px;
  }
}
</style>
