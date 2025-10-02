<template>
  <div
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    class="bg-white rounded-lg shadow-sm border p-4 cursor-move hover:shadow-md transition-shadow duration-200"
    :class="{
      'opacity-50': isDragging,
      'border-red-400 border-l-4': card.isUrgent,
      'border-gray-200': !card.isUrgent
    }"
  >
    <!-- Card Header -->
    <div class="flex justify-between items-start mb-3">
      <div class="flex items-center space-x-2">
        <h3 class="text-sm font-medium text-gray-900 leading-tight">
          {{ card.title }}
        </h3>
        <div v-if="card.isUrgent" class="flex items-center">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Urgente
          </span>
        </div>
      </div>
      <div class="flex space-x-1">
        <button
          @click="$emit('edit-card', card)"
          class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 p-1.5 rounded-md"
          title="Editar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="$emit('delete-card', card.id)"
          class="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 p-1.5 rounded-md"
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
  event.dataTransfer.setData('sourceColumnId', props.card.columnId)

  // Add a custom data attribute for better drag detection
  event.target.classList.add('dragging')
}

// Handle drag end
const handleDragEnd = (event) => {
  isDragging.value = false
  event.target.classList.remove('dragging')
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