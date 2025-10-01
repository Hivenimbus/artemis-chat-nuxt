<template>
  <div
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow duration-200"
    :class="{ 'opacity-50': isDragging }"
  >
    <!-- Card Header -->
    <div class="flex justify-between items-start mb-3">
      <h3 class="text-sm font-medium text-gray-900 leading-tight">
        {{ card.title }}
      </h3>
      <div class="flex space-x-1 opacity-0 hover:opacity-100 transition-opacity duration-200">
        <button
          @click="$emit('edit-card', card)"
          class="text-gray-400 hover:text-indigo-600 transition-colors duration-200 p-1 rounded hover:bg-gray-100"
          title="Editar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="$emit('delete-card', card.id)"
          class="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 rounded hover:bg-gray-100"
          title="Excluir"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Card Description -->
    <div v-if="card.description" class="mb-3">
      <p class="text-sm text-gray-600 line-clamp-3">
        {{ card.description }}
      </p>
    </div>

    <!-- Card Footer -->
    <div class="flex items-center justify-between text-xs text-gray-500">
      <div class="flex items-center space-x-2">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formatDate(card.created_at) }}</span>
      </div>
      <div v-if="card.updated_at !== card.created_at" class="flex items-center space-x-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ formatDate(card.updated_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['edit-card', 'delete-card'])

// State
const isDragging = ref(false)

// Handle drag start
const handleDragStart = (event) => {
  isDragging.value = true
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('cardId', props.card.id)
  event.dataTransfer.setData('sourceColumnId', props.card.column_id)

  // Add a custom data attribute for better drag detection
  event.target.classList.add('dragging')
}

// Handle drag end
const handleDragEnd = (event) => {
  isDragging.value = false
  event.target.classList.remove('dragging')
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Hoje'
  } else if (diffDays === 1) {
    return 'Ontem'
  } else if (diffDays < 7) {
    return `${diffDays}d`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}sem`
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}
</style>