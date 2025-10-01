<template>
  <div class="flex flex-col h-full">
    <!-- Column Header -->
    <div class="flex items-center justify-between mb-4 px-3">
      <h2 class="text-sm font-semibold text-gray-900 flex items-center">
        <span>{{ column.title }}</span>
        <span class="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {{ cards.length }}
        </span>
      </h2>
      <div class="flex items-center space-x-1 opacity-0 hover:opacity-100 transition-opacity duration-200">
        <button
          @click="$emit('delete-column', column.id)"
          class="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 rounded hover:bg-gray-100"
          title="Excluir coluna"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Cards Container -->
    <div
      class="flex-1 bg-gray-50 rounded-lg p-3 min-h-[400px]"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :class="{ 'bg-indigo-50 border-2 border-indigo-200 border-dashed': isDragOver }"
    >
      <!-- Cards -->
      <div class="space-y-3">
        <KanbanCard
          v-for="card in cards"
          :key="card.id"
          :card="card"
          @edit-card="$emit('edit-card', $event)"
          @delete-card="$emit('delete-card', $event)"
        />
      </div>

      <!-- Add Card Button -->
      <button
        @click="$emit('add-card', column.id)"
        class="mt-3 w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Adicionar cartão
      </button>

      <!-- Drop Indicator -->
      <div
        v-if="isDragOver"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div class="text-indigo-600 font-medium text-sm">
          Solte o cartão aqui
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  cards: {
    type: Array,
    default: () => []
  }
})

// Emits
defineEmits(['add-card', 'edit-card', 'delete-card', 'delete-column', 'card-drop'])

// State
const isDragOver = ref(false)

// Handle drag over
const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'

  if (!isDragOver.value) {
    isDragOver.value = true
  }
}

// Handle drag leave
const handleDragLeave = (event) => {
  // Only set isDragOver to false if the drag is leaving the column container
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

// Handle drop
const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false

  const cardId = event.dataTransfer.getData('cardId')
  const sourceColumnId = event.dataTransfer.getData('sourceColumnId')

  if (!cardId) return

  // Only process the drop if it's a different column or repositioning within the same column
  if (sourceColumnId !== props.column.id) {
    // Calculate new position (at the end of the column)
    const newPosition = props.cards.length

    // Emit the card drop event
    $emit('card-drop', {
      cardId,
      newColumnId: props.column.id,
      newPosition
    })
  }
}
</script>

<style scoped>
/* Ensure proper positioning for drop indicator */
.bg-gray-50 {
  position: relative;
}
</style>