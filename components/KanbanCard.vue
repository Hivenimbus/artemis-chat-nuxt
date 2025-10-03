<template>
  <div
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    class="kan-card"
    :class="{
      'kan-card--dragging': isDragging,
      'kan-card--urgent': card.isUrgent
    }"
  >
    <!-- Card Content -->
    <div class="kan-card__content">
      <!-- Card Header -->
      <div class="kan-card__header">
        <h3 class="kan-card__title">
          {{ card.title }}
        </h3>
        <span v-if="card.isUrgent" class="kan-card__badge-urgent">
          <svg class="kan-card__badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Urgente
        </span>
      </div>

      <!-- Card Description -->
      <p v-if="card.description" class="kan-card__description">
        {{ card.description }}
      </p>
    </div>

    <!-- Card Actions -->
    <div class="kan-card__actions">
      <button
        @click="$emit('edit-card', card)"
        class="kan-card__action-btn kan-card__action-btn--edit"
        :aria-label="`Editar ${card.title}`"
        title="Editar"
      >
        <svg class="kan-card__action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        @click="$emit('delete-card', card.id)"
        class="kan-card__action-btn kan-card__action-btn--delete"
        :aria-label="`Excluir ${card.title}`"
        title="Excluir"
      >
        <svg class="kan-card__action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      
      <!-- Move Card Dropdown -->
      <div class="kan-card__move" ref="moveMenuRef" v-if="availableColumns.length > 0">
        <button
          @click.stop="toggleMoveMenu"
          class="kan-card__action-btn kan-card__action-btn--move"
          :aria-label="`Mover ${card.title} para outra coluna`"
          :aria-expanded="showMoveMenu ? 'true' : 'false'"
          :aria-haspopup="true"
          title="Mover para outra coluna"
        >
          <svg class="kan-card__action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        
        <!-- Dropdown Menu -->
        <Transition name="fade-scale">
          <div v-if="showMoveMenu" class="kan-card__move-menu" role="menu" @click.stop>
            <div class="kan-card__move-menu-header">Mover para:</div>
            <button
              v-for="column in availableColumns"
              :key="column.id"
              @click="moveToColumn(column.id)"
              class="kan-card__move-menu-item"
              role="menuitem"
            >
              {{ column.title }}
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Drag Handle Indicator -->
    <div class="kan-card__drag-handle" aria-hidden="true">
      <svg class="kan-card__drag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
      </svg>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  columns: {
    type: Array,
    default: () => []
  },
  currentColumnId: {
    type: [String, Number],
    required: true
  }
})

// Emits
const emit = defineEmits(['edit-card', 'delete-card', 'move-card'])

// State
const isDragging = ref(false)
const showMoveMenu = ref(false)
const moveMenuRef = ref(null)

// Available columns (exclude current column)
const availableColumns = computed(() => {
  return (props.columns || []).filter(col => col.id !== props.currentColumnId)
})

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

// Toggle move menu
const toggleMoveMenu = () => {
  showMoveMenu.value = !showMoveMenu.value
}

// Move to column
const moveToColumn = (columnId) => {
  emit('move-card', columnId)
  showMoveMenu.value = false
}

// Click outside to close menu
const handleClickOutside = (event) => {
  if (showMoveMenu.value && moveMenuRef.value && !moveMenuRef.value.contains(event.target)) {
    showMoveMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Local CSS Variables */
.kan-card {
  --bg-0: 244 246 250;
  --bg-1: 255 255 255;
  --txt-1: 17 24 39;
  --txt-2: 75 85 99;
  --txt-3: 156 163 175;
  --ring: 59 130 246;

  --danger-500: 239 68 68;
  --danger-400: 252 165 165;

  --radius-xs: 8px;
  --radius-sm: 12px;

  --shadow-1: 0 6px 18px rgba(0,0,0,.08);
  --shadow-2: 0 12px 28px rgba(0,0,0,.12);
  --shadow-3: 0 18px 34px rgba(0,0,0,.16);

  --dur-fast: 150ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);

  position: relative;
  background: rgb(var(--bg-1));
  border: 1px solid rgba(var(--txt-3), 0.15);
  border-radius: var(--radius-sm);
  padding: 1.25rem;
  box-shadow: var(--shadow-1);
  cursor: move;
  transition: all var(--dur-fast) var(--ease-out);
  user-select: none;
}

.kan-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--shadow-2);
  border-color: rgb(var(--ring));
}

.kan-card:focus-within {
  outline: 2px solid rgb(var(--ring));
  outline-offset: 2px;
}

/* Urgent Card Variant - removed border, keeping only badge */

/* Dragging State */
.kan-card--dragging {
  opacity: 0.6;
  transform: rotate(2deg) scale(1.03);
  box-shadow: var(--shadow-3);
  cursor: grabbing;
}

/* Card Content */
.kan-card__content {
  margin-bottom: 1rem;
}

/* Card Header */
.kan-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.kan-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--txt-1));
  line-height: 1.4;
  flex: 1;
  word-break: break-word;
}

/* Urgent Badge */
.kan-card__badge-urgent {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, rgb(var(--danger-500)), rgb(var(--danger-400)));
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(var(--danger-500), 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

.kan-card__badge-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* Card Description */
.kan-card__description {
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgb(var(--txt-2));
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

/* Card Actions */
.kan-card__actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--txt-3), 0.1);
  position: relative;
}

.kan-card__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: rgb(var(--txt-3));
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}

.kan-card__action-btn:hover {
  transform: scale(1.1);
}

.kan-card__action-btn:focus {
  outline: 2px solid rgb(var(--ring));
  outline-offset: 2px;
}

.kan-card__action-btn:active {
  transform: scale(0.95);
}

.kan-card__action-btn--edit:hover {
  background: rgba(var(--ring), 0.1);
  color: rgb(var(--ring));
}

.kan-card__action-btn--delete:hover {
  background: rgba(var(--danger-500), 0.1);
  color: rgb(var(--danger-500));
}

.kan-card__action-btn--move:hover {
  background: rgba(16, 185, 129, 0.1);
  color: rgb(16, 185, 129);
}

.kan-card__action-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Move Card Dropdown */
.kan-card__move {
  position: relative;
  display: inline-flex;
  margin-left: auto;
}

.kan-card__move-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.5rem);
  min-width: 180px;
  background: rgb(var(--bg-1));
  border: 1px solid rgba(var(--txt-3), 0.2);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-2);
  z-index: 100;
  overflow: hidden;
}

.kan-card__move-menu-header {
  padding: 0.625rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(var(--txt-2));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(var(--txt-3), 0.05);
  border-bottom: 1px solid rgba(var(--txt-3), 0.1);
}

.kan-card__move-menu-item {
  width: 100%;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--txt-1));
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  display: block;
}

.kan-card__move-menu-item:hover {
  background: rgba(16, 185, 129, 0.1);
  color: rgb(16, 185, 129);
}

.kan-card__move-menu-item:active {
  transform: scale(0.98);
}

/* Fade Scale Transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: transform 120ms var(--ease-out), opacity 120ms var(--ease-out);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  transform: scale(0.95) translateY(4px);
  opacity: 0;
}

/* Drag Handle */
.kan-card__drag-handle {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
  pointer-events: none;
}

.kan-card:hover .kan-card__drag-handle {
  opacity: 0.3;
}

.kan-card__drag-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(var(--txt-2));
}

/* Responsive */
@media (max-width: 640px) {
  .kan-card {
    padding: 1rem;
  }

  .kan-card__title {
    font-size: 0.875rem;
  }

  .kan-card__description {
    font-size: 0.8125rem;
  }

  .kan-card__badge-urgent {
    font-size: 0.6875rem;
    padding: 0.25rem 0.5rem;
  }

  .kan-card__action-btn {
    width: 2rem;
    height: 2rem;
  }

  .kan-card__action-icon {
    width: 1.125rem;
    height: 1.125rem;
  }
}

/* Hover Animation for Badge */
@keyframes urgentPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

.kan-card__badge-urgent {
  animation: urgentPulse 2s ease-in-out infinite;
}
</style>
