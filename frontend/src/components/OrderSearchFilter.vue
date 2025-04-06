<template>
  <div class="search-filter">
    <div class="filter-header">
      <h3 class="filter-title">Filtrar Órdenes</h3>
      <button v-if="hasFilters" @click="resetFilters" class="reset-button">
        <span class="material-icons">clear</span>
        Limpiar filtros
      </button>
    </div>
    
    <div class="filter-form">
      <div class="filter-row">
        <div class="filter-group">
          <label for="searchText">Buscar</label>
          <div class="search-input-container">
            <input 
              type="text" 
              id="searchText" 
              v-model="filters.searchText" 
              placeholder="Ticket, cliente..."
              @input="updateFilters"
            >
            <span class="material-icons search-icon">search</span>
          </div>
        </div>
        
        <div class="filter-group">
          <label for="status">Estado</label>
          <select id="status" v-model="filters.status" @change="updateFilters">
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="in_review">En revisión</option>
            <option value="waiting_parts">Esperando repuestos</option>
            <option value="repaired">Reparado</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="service_type">Tipo de Servicio</label>
          <select id="service_type" v-model="filters.service_type" @change="updateFilters">
            <option value="">Todos</option>
            <option value="equipment_repair">Reparación de equipo</option>
            <option value="remote_assistance">Asistencia remota</option>
          </select>
        </div>
      </div>
      
      <div class="filter-row">
        <div class="filter-group">
          <label for="start_date">Fecha Inicio</label>
          <input 
            type="date" 
            id="start_date" 
            v-model="filters.start_date"
            @change="updateFilters"
          >
        </div>
        
        <div class="filter-group">
          <label for="end_date">Fecha Fin</label>
          <input 
            type="date" 
            id="end_date" 
            v-model="filters.end_date"
            @change="updateFilters"
          >
        </div>
        
        <div class="filter-group filter-actions">
          <button class="filter-button" @click="applyFilters">
            <span class="material-icons">filter_list</span>
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['filter-change']);

const defaultFilters = {
  searchText: '',
  status: '',
  service_type: '',
  start_date: '',
  end_date: ''
};

const filters = ref({...defaultFilters});

const hasFilters = computed(() => {
  return Object.keys(filters.value).some(key => {
    const value = filters.value[key];
    return value !== defaultFilters[key] && value !== '';
  });
});

function updateFilters() {
  // Debounce could be added here for search text
}

function applyFilters() {
  emit('filter-change', {...filters.value});
}

function resetFilters() {
  filters.value = {...defaultFilters};
  emit('filter-change', {...filters.value});
}
</script>

<style scoped>
.search-filter {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-medium);
}

.filter-title {
  margin: 0;
  font-size: 18px;
  color: var(--dark-gray);
}

.reset-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  font-size: 14px;
}

.reset-button .material-icons {
  font-size: 16px;
  margin-right: 4px;
}

.filter-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.filter-row {
  display: flex;
  gap: var(--spacing-medium);
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--dark-gray);
}

.filter-group input,
.filter-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--light-blue);
  border-radius: 4px;
  font-size: 14px;
}

.filter-group input:focus,
.filter-group select:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.search-input-container {
  position: relative;
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--medium-gray);
  font-size: 20px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.filter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.filter-button:hover {
  background-color: #1565C0;
}

.filter-button .material-icons {
  margin-right: 8px;
  font-size: 18px;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    gap: var(--spacing-small);
  }
  
  .filter-group {
    min-width: 100%;
  }
}
</style>
