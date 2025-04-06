<template>
  <div class="reports-page">
    <NavBar />
    <div class="main-content">
      <Sidebar />
      <div class="page-container">
        <h1 class="page-title">Reportes y Análisis</h1>
        
        <div class="reports-section">
          <OrderSearchFilter @filter-change="handleFilterChange" />
          
          <div class="export-actions">
            <button 
              @click="exportReport('excel')" 
              class="export-button excel-button"
              :disabled="isExporting"
            >
              <span class="material-icons">description</span>
              Exportar Excel
            </button>
            <button 
              @click="exportReport('pdf')" 
              class="export-button pdf-button"
              :disabled="isExporting"
            >
              <span class="material-icons">picture_as_pdf</span>
              Exportar PDF
            </button>
          </div>
          
          <div class="charts-grid">
            <ChartContainer 
              title="Distribución de Estados" 
              :loading="statusDistributionLoading" 
              :error="statusDistributionError"
              :data="statusDistributionData"
              :height="300"
            >
              <div class="status-chart">
                <div v-for="(item, index) in statusDistributionData" :key="index" class="status-item">
                  <div class="status-bar-container">
                    <div 
                      class="status-bar" 
                      :style="{ 
                        width: `${item.percentage}%`,
                        backgroundColor: getStatusColor(item.status)
                      }"
                    ></div>
                  </div>
                  <div class="status-info">
                    <span class="status-name">{{ translateStatus(item.status) }}</span>
                    <span class="status-count">{{ item.count }}</span>
                    <span class="status-percentage">{{ item.percentage.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </ChartContainer>
            
            <ChartContainer 
              title="Rendimiento de Técnicos" 
              :loading="technicianPerformanceLoading" 
              :error="technicianPerformanceError"
              :data="technicianPerformanceData"
              :height="350"
            >
              <div class="technician-chart">
                <table class="technician-table">
                  <thead>
                    <tr>
                      <th>Técnico</th>
                      <th>Órdenes Asignadas</th>
                      <th>Completadas</th>
                      <th>Tasa de Completitud</th>
                      <th>Tiempo Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tech in technicianPerformanceData" :key="tech.id">
                      <td>{{ tech.username }}</td>
                      <td>{{ tech.orders_assigned }}</td>
                      <td>{{ tech.orders_completed }}</td>
                      <td>
                        <div class="completion-rate">
                          <div class="rate-bar" :style="{ width: `${tech.completion_rate}%` }"></div>
                          <span>{{ tech.completion_rate.toFixed(1) }}%</span>
                        </div>
                      </td>
                      <td>{{ tech.average_resolution_time.toFixed(1) }} días</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ChartContainer>
            
            <ChartContainer 
              title="Problemas Comunes" 
              :loading="commonProblemsLoading" 
              :error="commonProblemsError"
              :data="commonProblemsData"
              :height="300"
            >
              <div class="problems-chart">
                <div v-for="(problem, index) in commonProblemsData" :key="index" class="problem-item">
                  <div class="problem-bar-container">
                    <div 
                      class="problem-bar" 
                      :style="{ width: `${problem.percentage}%` }"
                    ></div>
                  </div>
                  <div class="problem-info">
                    <span class="problem-keyword">{{ problem.keyword }}</span>
                    <span class="problem-count">{{ problem.count }}</span>
                    <span class="problem-percentage">{{ problem.percentage.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';
import ChartContainer from '../../components/ChartContainer.vue';
import OrderSearchFilter from '../../components/OrderSearchFilter.vue';
import { useAuthStore } from '../../stores/auth';

// Estado para los datos de los reportes
const statusDistributionData = ref([]);
const statusDistributionLoading = ref(true);
const statusDistributionError = ref('');

const technicianPerformanceData = ref([]);
const technicianPerformanceLoading = ref(true);
const technicianPerformanceError = ref('');

const commonProblemsData = ref([]);
const commonProblemsLoading = ref(true);
const commonProblemsError = ref('');

const authStore = useAuthStore();
const isExporting = ref(false);
const currentFilters = ref({});

// Función para cargar la distribución de estados
async function loadStatusDistribution(filters = {}) {
  statusDistributionLoading.value = true;
  statusDistributionError.value = '';
  
  try {
    // Construir la URL con los filtros
    let url = 'http://localhost:3000/api/reports/status-distribution';
    const queryParams = new URLSearchParams();
    
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.service_type) queryParams.append('service_type', filters.service_type); // Add service_type
    if (filters.searchText) queryParams.append('search', filters.searchText); // Add search
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('No se pudieron cargar los datos de distribución de estados');
    }
    
    const data = await response.json();
    statusDistributionData.value = data.data.distribution;
  } catch (error) {
    console.error('Error cargando distribución de estados:', error);
    statusDistributionError.value = error.message || 'Error al cargar los datos';
  } finally {
    statusDistributionLoading.value = false;
  }
}

// Función para cargar el rendimiento de técnicos
async function loadTechnicianPerformance(filters = {}) {
  technicianPerformanceLoading.value = true;
  technicianPerformanceError.value = '';
  
  try {
    // Construir la URL con los filtros
    let url = 'http://localhost:3000/api/reports/technician-performance';
    const queryParams = new URLSearchParams();
    
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.service_type) queryParams.append('service_type', filters.service_type); // Add service_type
    if (filters.searchText) queryParams.append('search', filters.searchText); // Add search
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('No se pudieron cargar los datos de rendimiento de técnicos');
    }
    
    const data = await response.json();
    technicianPerformanceData.value = data.data.technicians;
  } catch (error) {
    console.error('Error cargando rendimiento de técnicos:', error);
    technicianPerformanceError.value = error.message || 'Error al cargar los datos';
  } finally {
    technicianPerformanceLoading.value = false;
  }
}

// Función para cargar los problemas comunes
async function loadCommonProblems(filters = {}) {
  commonProblemsLoading.value = true;
  commonProblemsError.value = '';
  
  try {
    // Construir la URL con los filtros
    let url = 'http://localhost:3000/api/reports/common-problems';
    const queryParams = new URLSearchParams();
    
    
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.service_type) queryParams.append('service_type', filters.service_type); // Add service_type
    if (filters.searchText) queryParams.append('search', filters.searchText); // Add search
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('No se pudieron cargar los datos de problemas comunes');
    }
    
    const data = await response.json();
    commonProblemsData.value = data.data.problems;
  } catch (error) {
    console.error('Error cargando problemas comunes:', error);
    commonProblemsError.value = error.message || 'Error al cargar los datos';
  } finally {
    commonProblemsLoading.value = false;
  }
}

// Función para exportar reportes
async function exportReport(format) {
  if (isExporting.value) return;
  
  isExporting.value = true;
  
  try {
    // Construir la URL con los filtros
    let url = `http://localhost:3000/api/reports/export-orders?format=${format}`;
    const queryParams = new URLSearchParams();
    
    
    if (currentFilters.value.start_date) queryParams.append('start_date', currentFilters.value.start_date);
    if (currentFilters.value.end_date) queryParams.append('end_date', currentFilters.value.end_date);
    if (currentFilters.value.status) queryParams.append('status', currentFilters.value.status);
    if (currentFilters.value.service_type) queryParams.append('service_type', currentFilters.value.service_type); // Add service_type
    if (currentFilters.value.searchText) queryParams.append('search', currentFilters.value.searchText); // Add search
    // technician_id filter is not currently available in OrderSearchFilter, but could be added
    
    if (queryParams.toString()) {
      url += `&${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al exportar en formato ${format}`);
    }
    
    // Obtener el blob del archivo
    const blob = await response.blob();
    
    // Crear URL de objeto para el blob
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Crear elemento de enlace para descargar
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = downloadUrl;
    a.download = `reporte_ordenes_${date}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error(`Error exportando reporte en formato ${format}:`, error);
    alert(`Error al exportar: ${error.message}`);
  } finally {
    isExporting.value = false;
  }
}

// Función para manejar el cambio de filtros
function handleFilterChange(filters) {
  currentFilters.value = filters;
  loadStatusDistribution(filters);
  loadTechnicianPerformance(filters);
  loadCommonProblems(filters);
}

// Función para obtener el color según el estado
function getStatusColor(status) {
  const colors = {
    'pending': 'var(--pending)',
    'in_review': 'var(--in-review)',
    'repaired': 'var(--repaired)',
    'waiting_parts': 'var(--waiting-parts)',
    'closed': 'var(--closed)'
  };
  
  return colors[status] || 'var(--primary-blue)';
}

// Función para traducir los estados
function translateStatus(status) {
  const translations = {
    'pending': 'Pendiente',
    'in_review': 'En Revisión',
    'repaired': 'Reparado',
    'waiting_parts': 'Esperando Repuestos',
    'closed': 'Cerrado'
  };
  
  return translations[status] || status;
}

// Cargar datos al montar el componente
onMounted(() => {
  loadStatusDistribution();
  loadTechnicianPerformance();
  loadCommonProblems();
});
</script>

<style scoped>
.reports-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  flex: 1;
}

.page-container {
  flex: 1;
  padding: var(--spacing-large);
  margin-left: 250px;
  margin-top: 64px;
}

.page-title {
  margin-bottom: var(--spacing-large);
  color: var(--dark-gray);
}

.reports-section {
  margin-bottom: var(--spacing-large);
}

.export-actions {
  display: flex;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.export-button {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.export-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-button .material-icons {
  margin-right: 8px;
}

.excel-button {
  background-color: #4CAF50;
  color: white;
}

.excel-button:hover:not(:disabled) {
  background-color: #3d8b40;
}

.pdf-button {
  background-color: #F44336;
  color: white;
}

.pdf-button:hover:not(:disabled) {
  background-color: #d32f2f;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-large);
}

/* Estilos específicos para el gráfico de estados */
.status-chart {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-bar-container {
  height: 30px;
  background-color: var(--light-gray);
  border-radius: 4px;
  overflow: hidden;
}

.status-bar {
  height: 100%;
  transition: width 0.5s ease;
}

.status-info {
  display: flex;
  justify-content: space-between;
}

.status-name {
  font-weight: 500;
}

/* Estilos específicos para la tabla de técnicos */
.technician-chart {
  width: 100%;
  overflow-x: auto;
}

.technician-table {
  width: 100%;
  border-collapse: collapse;
}

.technician-table th,
.technician-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--light-gray);
}

.technician-table th {
  background-color: var(--light-gray);
  font-weight: 500;
}

.completion-rate {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-bar {
  height: 8px;
  background-color: var(--primary-blue);
  border-radius: 4px;
}

/* Estilos específicos para el gráfico de problemas comunes */
.problems-chart {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.problem-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.problem-bar-container {
  height: 30px;
  background-color: var(--light-gray);
  border-radius: 4px;
  overflow: hidden;
}

.problem-bar {
  height: 100%;
  background-color: var(--primary-blue);
  transition: width 0.5s ease;
}

.problem-info {
  display: flex;
  justify-content: space-between;
}

.problem-keyword {
  font-weight: 500;
}

@media (max-width: 768px) {
  .page-container {
    margin-left: 60px;
    padding: var(--spacing-medium);
  }
  
  .export-actions {
    flex-direction: column;
  }
}
</style>
