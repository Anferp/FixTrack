<template>
  <div class="file-uploader">
    <h3 class="uploader-title">Adjuntar archivos</h3>
    <div class="upload-container">
      <label for="file-input" class="upload-label">
        <span class="material-icons">cloud_upload</span>
        <span>{{ selectedFile ? selectedFile.name : 'Seleccionar archivo' }}</span>
      </label>
      <input 
        type="file" 
        id="file-input" 
        class="file-input" 
        @change="handleFileChange" 
        accept="image/*,.pdf,.doc,.docx"
      />
      <input 
        v-model="fileDescription" 
        class="description-input" 
        placeholder="Descripción del archivo..." 
      />
      <button 
        class="upload-button" 
        @click="uploadFile" 
        :disabled="!selectedFile || isUploading"
      >
        {{ isUploading ? 'Subiendo...' : 'Subir archivo' }}
      </button>
    </div>
    <div v-if="error" class="upload-error">
      {{ error }}
    </div>
    <div v-if="uploadedFiles.length > 0" class="uploaded-files">
      <h4>Archivos adjuntos</h4>
      <div class="files-list">
        <div v-for="(file, index) in uploadedFiles" :key="index" class="file-item">
          <span class="material-icons file-icon">description</span>
          <div class="file-info">
            <div class="file-name">{{ getFileName(file.file_path) }}</div>
            <div class="file-date">{{ formatDate(file.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  orderId: {
    type: [Number, String],
    required: true
  },
  uploadedFiles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['file-uploaded']);

const selectedFile = ref(null);
const fileDescription = ref('');
const isUploading = ref(false);
const error = ref('');

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    error.value = '';
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('description', fileDescription.value);

  isUploading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/tech/orders/${props.orderId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al subir el archivo');
    }

    const data = await response.json();
    emit('file-uploaded', data.data.attachment);
    
    // Reiniciar formulario
    selectedFile.value = null;
    fileDescription.value = '';
    document.getElementById('file-input').value = '';
    
  } catch (err) {
    error.value = err.message || 'Error al subir el archivo';
    console.error('Error al subir archivo:', err);
  } finally {
    isUploading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getFileName = (path) => {
  if (!path) return 'Archivo';
  return path.split('/').pop();
};
</script>

<style scoped>
.file-uploader {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.uploader-title {
  margin-top: 0;
  margin-bottom: var(--spacing-medium);
  color: var(--dark-gray);
  font-size: 18px;
}

.upload-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.upload-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-small);
  padding: var(--spacing-small);
  border: 2px dashed var(--light-blue);
  border-radius: 8px;
  cursor: pointer;
  background-color: var(--light-gray);
  transition: border-color 0.3s;
}

.upload-label:hover {
  border-color: var(--primary-blue);
}

.file-input {
  display: none;
}

.description-input {
  padding: var(--spacing-small);
  border: 1px solid var(--light-blue);
  border-radius: 8px;
  font-family: 'Roboto', sans-serif;
}

.upload-button {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.upload-button:hover:not(:disabled) {
  background-color: #1565C0;
}

.upload-button:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
}

.upload-error {
  color: #f44336;
  margin-top: var(--spacing-small);
  font-size: 14px;
}

.uploaded-files {
  margin-top: var(--spacing-large);
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
  margin-top: var(--spacing-small);
}

.file-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-small);
  background-color: var(--light-gray);
  border-radius: 8px;
}

.file-icon {
  color: var(--primary-blue);
  margin-right: var(--spacing-small);
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-date {
  font-size: 12px;
  color: var(--medium-gray);
}
</style>
