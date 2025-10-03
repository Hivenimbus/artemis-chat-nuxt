<template>
  <div class="kan-col" :data-status="column.title.toLowerCase()">
    <!-- Column Header -->
    <div class="kan-col__header">
      <div class="kan-col__header-title">
        <svg v-if="column.title.includes('Fazer')" class="kan-col__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <svg v-else-if="column.title.includes('Fazendo')" class="kan-col__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="kan-col__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="kan-col__title">{{ column.title }}</h2>
        <span class="kan-col__badge">{{ cards.length }}</span>
      </div>
      
      <!-- Column Options Menu -->
      <div class="kan-col__options">
        <button class="kan-col__options-btn" @click="showOptions = !showOptions" :aria-expanded="showOptions ? 'true' : 'false'">
          <svg class="kan-col__options-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        
        <!-- Options Dropdown -->
        <div v-if="showOptions" class="kan-col__options-dropdown">
          <button class="kan-col__option" @click="startRename">
            <svg class="kan-col__option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Renomear coluna
          </button>
          <button v-if="!isDefaultColumn" class="kan-col__option kan-col__option--danger" @click="deleteColumn">
            <svg class="kan-col__option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir coluna
          </button>
        </div>
      </div>
    </div>

    <!-- Cards Container -->
    <div
      class="kan-col__cards"
      :class="{ 
        'kan-col__cards--drag-over': isDragOver && isDragFromDifferentColumn,
        'kan-col__cards--reordering': dragOverIndex !== null && !isDragFromDifferentColumn
      }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Cards -->
      <TransitionGroup name="card-list" tag="div" class="kan-col__cards-list">
        <div
          v-for="(card, index) in cards"
          :key="card.id"
          class="card-drop-zone"
          @dragover.prevent="handleCardDragOver($event, index)"
          @dragleave="handleCardDragLeave($event, index)"
          @drop="handleCardDrop($event, index)"
          :class="{ 'card-drop-zone--active': dragOverIndex === index }"
        >
          <KanbanCard
            :card="card"
            :columns="columns"
            :current-column-id="column.id"
            @edit-card="$emit('edit-card', $event)"
            @delete-card="$emit('delete-card', $event)"
            @move-card="handleMoveCard(card.id, $event)"
          />
        </div>
      </TransitionGroup>

      <!-- Add Card Button -->
      <button
        @click="$emit('add-card', column.id)"
        class="kan-col__add-btn"
        :aria-label="`Adicionar cart\u00e3o em ${column.title}`"
      >
        <svg class="kan-col__add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Adicionar cartão
      </button>

      <!-- Drop Indicator - Only show when dragging from different column -->
      <Transition name="drop-indicator">
        <div v-if="isDragOver && isDragFromDifferentColumn" class="kan-col__drop-indicator">
          <svg class="kan-col__drop-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span>Solte o cartão aqui</span>
        </div>
      </Transition>
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
  },
  columns: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['add-card', 'edit-card', 'delete-card', 'card-drop', 'rename-column', 'delete-column', 'move-card'])

// State
const isDragOver = ref(false)
const dragOverIndex = ref(null)
const isDragFromDifferentColumn = ref(false)
const showOptions = ref(false)

// Check if this is a default column (can't be deleted)
const isDefaultColumn = computed(() => 
  ['todo', 'doing', 'done'].includes(props.column.id)
)

// Handle drag over column (for empty space)
const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'

  // Check if the card is from a different column
  const sourceColumnId = event.dataTransfer.getData('sourceColumnId')
  const isDifferentColumn = sourceColumnId && sourceColumnId !== props.column.id
  
  isDragFromDifferentColumn.value = isDifferentColumn

  if (!isDragOver.value && isDifferentColumn) {
    isDragOver.value = true
  }
}

// Handle drag leave column
const handleDragLeave = (event) => {
  // Only set isDragOver to false if the drag is leaving the column container
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
    isDragFromDifferentColumn.value = false
  }
}

// Handle drop on column (empty space - adds to end)
const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  isDragFromDifferentColumn.value = false

  const cardId = event.dataTransfer.getData('cardId')
  const sourceColumnId = event.dataTransfer.getData('sourceColumnId')

  if (!cardId) return

  // Only process the drop if it's a different column
  if (sourceColumnId !== props.column.id) {
    // Calculate new position (at the end of the column)
    const newPosition = props.cards.length

    // Emit the card drop event
    emit('card-drop', {
      cardId,
      newColumnId: props.column.id,
      newPosition
    })
  }
}

// Handle drag over a specific card
const handleCardDragOver = (event, index) => {
  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer.dropEffect = 'move'
  
  // Check if the card is from a different column
  const sourceColumnId = event.dataTransfer.getData('sourceColumnId')
  const isDifferentColumn = sourceColumnId && sourceColumnId !== props.column.id
  
  isDragFromDifferentColumn.value = isDifferentColumn
  dragOverIndex.value = index
}

// Handle drag leave from a specific card
const handleCardDragLeave = (event, index) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    if (dragOverIndex.value === index) {
      dragOverIndex.value = null
      isDragFromDifferentColumn.value = false
    }
  }
}

// Handle drop on a specific card
const handleCardDrop = (event, targetIndex) => {
  event.preventDefault()
  event.stopPropagation()
  dragOverIndex.value = null
  isDragOver.value = false
  isDragFromDifferentColumn.value = false

  const cardId = event.dataTransfer.getData('cardId')
  const sourceColumnId = event.dataTransfer.getData('sourceColumnId')

  if (!cardId) return

  // Get the Y position of the mouse relative to the card
  const cardElement = event.currentTarget
  const rect = cardElement.getBoundingClientRect()
  const mouseY = event.clientY
  const cardMiddle = rect.top + rect.height / 2

  // Determine if we should insert before or after
  let newPosition = targetIndex
  if (mouseY > cardMiddle) {
    newPosition = targetIndex + 1
  }

  // If same column and same position, don't do anything
  if (sourceColumnId === props.column.id) {
    const draggedCard = props.cards.find(c => c.id === cardId)
    if (draggedCard && draggedCard.position === newPosition) {
      return
    }
  }

  // Emit the card drop event with the new position
  emit('card-drop', {
    cardId,
    newColumnId: props.column.id,
    newPosition
  })
}

// Column management functions
const startRename = () => {
  const newName = prompt('Novo nome da coluna:', props.column.title)
  if (newName && newName.trim()) {
    emit('rename-column', { columnId: props.column.id, newTitle: newName.trim() })
  }
  showOptions.value = false
}

const deleteColumn = () => {
  if (confirm(`Tem certeza que deseja excluir a coluna "${props.column.title}"? Todos os cartões serão movidos para "Para Fazer".`)) {
    emit('delete-column', props.column.id)
  }
  showOptions.value = false
}

// Handle move card via dropdown
const handleMoveCard = (cardId, toColumnId) => {
  emit('move-card', {
    cardId,
    fromColumnId: props.column.id,
    toColumnId
  })
}
</script>

<style scoped>
/* Local CSS Variables */
.kan-col {
  --bg-0: 244 246 250;
  --bg-1: 255 255 255;
  --txt-1: 17 24 39;
  --txt-2: 75 85 99;
  --txt-3: 156 163 175;
  --ring: 59 130 246;

  --todo-500: 59 130 246;
  --todo-400: 96 165 250;
  --doing-500: 245 158 11;
  --doing-400: 251 191 36;
  --done-500: 16 185 129;
  --done-400: 52 211 153;

  --radius-xs: 8px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;

  --shadow-1: 0 6px 18px rgba(0,0,0,.08);
  --shadow-2: 0 12px 28px rgba(0,0,0,.12);
  --shadow-3: 0 18px 34px rgba(0,0,0,.16);

  --dur-fast: 150ms;
  --dur-med: 250ms;
  --dur-slow: 400ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);

  --col-500: var(--todo-500);
  --col-400: var(--todo-400);
  
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  border-top: 4px solid rgb(var(--col-500));
  display: flex;
  flex-direction: column;
  height: auto;
  transition: all var(--dur-fast) var(--ease-out);
}

/* Color Variants per Status */
.kan-col[data-status*='fazer'] {
  --col-500: var(--todo-500);
  --col-400: var(--todo-400);
}

.kan-col[data-status*='fazendo'] {
  --col-500: var(--doing-500);
  --col-400: var(--doing-400);
}

.kan-col[data-status*='conclu'] {
  --col-500: var(--done-500);
  --col-400: var(--done-400);
}

/* Column Header */
.kan-col__header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(var(--txt-3), 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kan-col__header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.kan-col__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: rgb(var(--col-500));
  flex-shrink: 0;
}

.kan-col__title {
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--txt-1));
  flex: 1;
}

.kan-col__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, rgb(var(--col-500)), rgb(var(--col-400)));
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(var(--col-500), 0.3);
}

/* Column Options Menu */
.kan-col__options {
  position: relative;
}

.kan-col__options-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(var(--txt-2), 0.6);
  cursor: pointer;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
}

.kan-col__options-btn:hover {
  background: rgba(var(--col-500), 0.08);
  color: rgb(var(--col-500));
  transform: scale(1.05);
}

.kan-col__options-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.kan-col__options-dropdown {
  position: absolute;
  right: 0;
  top: 2.5rem;
  min-width: 180px;
  background: rgb(var(--bg-1));
  border: 1px solid rgba(var(--txt-3), 0.2);
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(30, 41, 59, 0.15);
  padding: 0.375rem;
  z-index: 50;
}

.kan-col__option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgb(var(--txt-1));
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 120ms ease-out;
  text-align: left;
}

.kan-col__option:hover {
  background: rgba(var(--col-500), 0.06);
  color: rgb(var(--col-500));
}

.kan-col__option--danger {
  color: rgb(239, 68, 68);
}

.kan-col__option--danger:hover {
  background: rgba(239, 68, 68, 0.06);
  color: rgb(220, 38, 38);
}

.kan-col__option-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Cards Container */
.kan-col__cards {
  padding: 1rem;
  overflow-y: visible;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--col-500), 0.3) transparent;
}

.kan-col__cards::-webkit-scrollbar {
  width: 6px;
}

.kan-col__cards::-webkit-scrollbar-track {
  background: transparent;
}

.kan-col__cards::-webkit-scrollbar-thumb {
  background: rgba(var(--col-500), 0.3);
  border-radius: 3px;
}

.kan-col__cards::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--col-500), 0.5);
}

.kan-col__cards--drag-over {
  background: rgba(var(--col-500), 0.05);
  outline: 2px dashed rgba(var(--col-500), 0.4);
  outline-offset: -4px;
}

/* Blur cards and button only when dragging from different column */
.kan-col__cards--drag-over .kan-col__cards-list,
.kan-col__cards--drag-over .kan-col__add-btn {
  filter: blur(4px);
  opacity: 0.3;
  pointer-events: none;
  transition: all 250ms cubic-bezier(.22, 1, .36, 1);
}

/* No blur when reordering within same column */
.kan-col__cards--reordering .kan-col__cards-list,
.kan-col__cards--reordering .kan-col__add-btn {
  filter: none;
  opacity: 1;
  transition: all 250ms cubic-bezier(.22, 1, .36, 1);
}

/* Cards List */
.kan-col__cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Card Drop Zone */
.card-drop-zone {
  position: relative;
  transition: all 200ms cubic-bezier(.22, 1, .36, 1);
}

.card-drop-zone--active {
  transform: translateY(4px);
}

.card-drop-zone--active::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgb(var(--col-500)), rgb(var(--col-400)));
  border-radius: 2px;
  box-shadow: 0 0 12px rgba(var(--col-500), 0.5);
  animation: pulse-line 1s ease-in-out infinite;
}

@keyframes pulse-line {
  0%, 100% {
    opacity: 1;
    transform: scaleX(1);
  }
  50% {
    opacity: 0.7;
    transform: scaleX(0.98);
  }
}

/* Card List Transitions */
.card-list-enter-active,
.card-list-leave-active {
  transition: all var(--dur-med) var(--ease-out);
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.9);
}

.card-list-move {
  transition: transform var(--dur-med) var(--ease-out);
}

/* Add Button */
.kan-col__add-btn {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.875rem 1rem;
  border: 2px dashed rgba(var(--col-500), 0.3);
  border-radius: var(--radius-sm);
  background: transparent;
  color: rgb(var(--col-500));
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}

.kan-col__add-btn:hover {
  border-color: rgb(var(--col-500));
  background: rgba(var(--col-500), 0.05);
  transform: translateY(-2px);
}

.kan-col__add-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--col-500), 0.2);
}

.kan-col__add-btn:active {
  transform: translateY(0);
}

.kan-col__add-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Drop Indicator */
.kan-col__drop-indicator {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(var(--col-500), 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-sm);
  color: rgb(var(--col-500));
  font-weight: 700;
  font-size: 1.125rem;
  pointer-events: none;
  z-index: 20;
}

.kan-col__drop-icon {
  width: 4rem;
  height: 4rem;
  stroke-width: 2.5;
  animation: bounce-indicator 1s ease-in-out infinite;
}

@keyframes bounce-indicator {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Drop Indicator Transitions */
.drop-indicator-enter-active,
.drop-indicator-leave-active {
  transition: opacity var(--dur-fast) var(--ease-out);
}

.drop-indicator-enter-from,
.drop-indicator-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .kan-col__header {
    padding: 1rem 0.75rem;
  }

  .kan-col__title {
    font-size: 0.875rem;
  }

  .kan-col__badge {
    min-width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }
}
</style>
