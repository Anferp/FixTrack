<template>
  <div class="chart-container" :style="{ height: `${height}px` }">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-actions" v-if="$slots.actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="chart-content">
      <div v-if="loading" class="chart-loading">
        <span class="material-icons loading-icon">donut_large</span>
        <span>Cargando datos...</span>
      </div>
      <div v-else-if="error" class="chart-error">
        <span class="material-icons error-icon">error_outline</span>
        <span>{{ error }}</span>
      </div>
      <div v-else-if="noData" class="chart-no-data">
        <span class="material-icons no-data-icon">bar_chart</span>
        <span>No hay datos disponibles</span>
      </div>
      <div v-else class="chart-area" ref="chartRef">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  data: {
    type: Array,
    default: () => []
  },
  height: {
    type: Number,
    default: 300
  }
});

const chartRef = ref(null);
const noData = computed(() => !props.data || props.data.length === 0);

onMounted(() => {
  // Aquí se podría inicializar una biblioteca de gráficos si fuera necesario
});
</script>

<style scoped>
.chart-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-medium);
}

.chart-title {
  margin: 0;
  font-size: 18px;
  color: var(--dark-gray);
}

.chart-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.chart-area {
  width: 100%;
  height: 100%;
}

.chart-loading, 
.chart-error, 
.chart-no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
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

.no-data-icon {
  font-size: 48px;
  color: var(--medium-gray);
  margin-bottom: var(--spacing-small);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .chart-container {
    padding: var(--spacing-small);
  }
  
  .chart-title {
    font-size: 16px;
  }
}
</style>
