<template>
  <div class="comment-box">
    <h3 class="comments-title">Comentarios</h3>
    <div class="comments-container">
      <div v-if="comments.length === 0" class="no-comments">
        No hay comentarios disponibles.
      </div>
      <div v-else class="comments-list">
        <div v-for="(comment, index) in comments" :key="index" class="comment-item">
          <div class="comment-header">
            <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
          </div>
          <div class="comment-content">
            {{ comment.content }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="canAddComments" class="add-comment">
      <textarea 
        v-model="newComment" 
        class="comment-textarea" 
        placeholder="Escriba un comentario..."
        rows="3"
      ></textarea>
      <button 
        @click="submitComment" 
        class="comment-submit"
        :disabled="!newComment.trim()"
      >
        Agregar Comentario
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  comments: {
    type: Array,
    required: true
  },
  canAddComments: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit-comment']);

const newComment = ref('');

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const submitComment = () => {
  if (newComment.value.trim()) {
    emit('submit-comment', newComment.value);
    newComment.value = '';
  }
};
</script>

<style scoped>
.comment-box {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.comments-title {
  margin-top: 0;
  margin-bottom: var(--spacing-medium);
  color: var(--dark-gray);
  font-size: 18px;
}

.comments-container {
  margin-bottom: var(--spacing-medium);
}

.no-comments {
  padding: var(--spacing-medium);
  text-align: center;
  color: var(--medium-gray);
  background-color: var(--light-gray);
  border-radius: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.comment-item {
  background-color: var(--light-gray);
  padding: var(--spacing-medium);
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-small);
}

.comment-date {
  font-size: 12px;
  color: var(--medium-gray);
}

.comment-content {
  color: var(--dark-gray);
  line-height: 1.5;
}

.add-comment {
  margin-top: var(--spacing-medium);
}

.comment-textarea {
  width: 100%;
  padding: var(--spacing-small);
  border: 1px solid var(--light-blue);
  border-radius: 8px;
  resize: vertical;
  margin-bottom: var(--spacing-small);
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease;
}

.comment-textarea:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.comment-submit {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.comment-submit:hover {
  background-color: #1565C0;
}

.comment-submit:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
}
</style>
