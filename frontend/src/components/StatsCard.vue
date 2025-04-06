<template>
  <div class="stats-card" :style="{ 'background-color': backgroundColor }">
    <div class="stats-icon" :style="{ 'color': iconColor }">
      <span class="material-icons">{{ icon }}</span>
    </div>
    <div class="stats-content">
      <div class="stats-value">{{ value }}</div>
      <div class="stats-title">{{ title }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  backgroundColor: {
    type: String,
    default: 'white'
  },
  iconColor: {
    type: String,
    default: 'var(--primary-blue)'
  }
});
</script>

<style scoped>
.stats-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-medium);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 100px;
  overflow: hidden;
  position: relative;
}

.stats-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 60px;
  margin-right: var(--spacing-medium);
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.05);
}

.stats-icon .material-icons {
  font-size: 32px;
}

.stats-content {
  display: flex;
  flex-direction: column;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--dark-gray);
  margin-bottom: 4px;
}

.stats-title {
  font-size: 14px;
  color: var(--medium-gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .stats-card {
    min-height: 80px;
  }
  
  .stats-icon {
    min-width: 50px;
    height: 50px;
  }
  
  .stats-icon .material-icons {
    font-size: 28px;
  }
  
  .stats-value {
    font-size: 24px;
  }
  
  .stats-title {
    font-size: 12px;
  }
}
</style>
