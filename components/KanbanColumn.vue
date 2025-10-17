<template>
  <div class="kan-col" :data-status="column.title.toLowerCase()" :style="{ '--col-500': columnColor['500'], '--col-400': columnColor['400'] }" :class="{ 'kan-col--menu-open': showOptions || showIconPicker || showColorPicker }">
    <!-- Column Header -->
    <div class="kan-col__header">
      <div class="kan-col__header-title">
        <svg class="kan-col__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getColumnIconPath()" />
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
          
          <!-- Icon Picker -->
          <div class="kan-col__option-wrapper">
            <button class="kan-col__option" @click.stop="toggleIconPicker">
              <svg class="kan-col__option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Alterar ícone
              <svg class="kan-col__option-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div v-if="showIconPicker" class="kan-col__sub-dropdown" @click.stop>
              <button
                v-for="icon in iconOptions"
                :key="icon.value"
                @click="updateIcon(icon.value)"
                class="kan-col__sub-option"
                :class="{ 'kan-col__sub-option--active': column.icon === icon.value }"
              >
                <svg class="kan-col__sub-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon.path" />
                </svg>
                <span>{{ icon.label }}</span>
              </button>
            </div>
          </div>
          
          <!-- Color Picker -->
          <div class="kan-col__option-wrapper">
            <button class="kan-col__option" @click.stop="toggleColorPicker">
              <svg class="kan-col__option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Alterar cor
              <svg class="kan-col__option-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div v-if="showColorPicker" class="kan-col__sub-dropdown" @click.stop>
              <button
                v-for="color in colorOptions"
                :key="color.value"
                @click="updateColor(color.value)"
                class="kan-col__sub-option"
                :class="{ 'kan-col__sub-option--active': column.color === color.value }"
              >
                <div class="kan-col__color-preview" :style="{ backgroundColor: color.hex }"></div>
                <span>{{ color.label }}</span>
              </button>
            </div>
          </div>
          
          <button 
            class="kan-col__option" 
            @click="moveColumnLeft"
            :disabled="!canMoveLeft"
          >
            <svg class="kan-col__option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Mover para trás
          </button>
          <button 
            class="kan-col__option" 
            @click="moveColumnRight"
            :disabled="!canMoveRight"
          >
            <svg class="kan-col__option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            Mover para frente
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
    <div class="kan-col__cards">
      <!-- Draggable Cards List -->
      <VueDraggable
        v-model="columnCards"
        :group="{ name: 'kanban-cards', pull: true, put: true }"
        :animation="150"
        ghost-class="kan-card--ghost"
        drag-class="kan-card--dragging"
        class="kan-col__cards-list"
        @add="handleCardAdd"
        @remove="handleCardRemove"
        @end="handleDragEnd"
      >
        <KanbanCard
          v-for="card in columnCards"
          :key="card.id"
          :card="card"
          :columns="columns"
          :current-column-id="column.id"
          @edit-card="$emit('edit-card', $event)"
          @delete-card="$emit('delete-card', $event)"
          @move-card="handleMoveCard(card.id, $event)"
        />
      </VueDraggable>

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
    </div>
  </div>
</template>

<script setup>
// Import VueDraggablePlus
import { VueDraggable } from 'vue-draggable-plus'

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
const emit = defineEmits(['add-card', 'edit-card', 'delete-card', 'card-drop', 'update-cards', 'card-moved', 'rename-column', 'delete-column', 'move-card', 'move-column', 'update-column-icon', 'update-column-color'])

// State
const showOptions = ref(false)
const showIconPicker = ref(false)
const showColorPicker = ref(false)

// Create a computed property for cards in this column
const columnCards = computed({
  get: () => props.cards,
  set: (newCards) => {
    // Only emit update if this is a reordering within the same column
    // Cross-column moves are handled by @add and @remove events
    const currentCardIds = props.cards.map(c => c.id).sort()
    const newCardIds = newCards.map(c => c.id).sort()

    // If the cards are the same (just reordered), emit update event
    if (JSON.stringify(currentCardIds) === JSON.stringify(newCardIds)) {
      emit('update-cards', newCards)
    }
  }
})

// Store current drag state
const dragState = ref({
  cardId: null,
  fromColumnId: null,
  toColumnId: null
})

// Handle card added to this column
const handleCardAdd = (event) => {
  const { item, newIndex } = event
  const cardId = item.dataset.cardId || item.getAttribute('data-card-id')

  console.log('Card added to column', props.column.id, { cardId, newIndex })

  if (cardId) {
    // Update drag state
    dragState.value.cardId = cardId
    dragState.value.toColumnId = props.column.id

    // Emit the move event with complete information
    emit('card-moved', {
      cardId,
      fromColumnId: dragState.value.fromColumnId,
      toColumnId: props.column.id,
      newIndex,
      oldIndex: null
    })

    // Reset drag state
    dragState.value = { cardId: null, fromColumnId: null, toColumnId: null }
  }
}

// Handle card removed from this column
const handleCardRemove = (event) => {
  const { item, oldIndex } = event
  const cardId = item.dataset.cardId || item.getAttribute('data-card-id')

  console.log('Card removed from column', props.column.id, { cardId, oldIndex })

  if (cardId) {
    // Store the source column for when the card is added elsewhere
    dragState.value.cardId = cardId
    dragState.value.fromColumnId = props.column.id
  }
}

// Handle drag end event from VueDraggable
const handleDragEnd = (event) => {
  console.log('Drag ended:', event)
}

// Icon paths mapping
const iconPaths = {
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M5 13l4 4L19 7',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
}

// Get icon path for current column
const getColumnIconPath = () => {
  const icon = props.column.icon || 'clipboard'
  return iconPaths[icon] || iconPaths.clipboard
}

// Color mapping
const colorMap = {
  blue: { '500': '59 130 246', '400': '96 165 250' },
  yellow: { '500': '245 158 11', '400': '251 191 36' },
  green: { '500': '16 185 129', '400': '52 211 153' },
  red: { '500': '239 68 68', '400': '252 165 165' }
}

// Get color values for current column
const columnColor = computed(() => {
  const color = props.column.color || 'blue'
  return colorMap[color] || colorMap.blue
})

// Check if this is a default column (can't be deleted)
const isDefaultColumn = computed(() =>
  ['todo', 'doing', 'done'].includes(props.column.id)
)

// Check if column can move left or right
const currentColumnIndex = computed(() => {
  return props.columns.findIndex(col => col.id === props.column.id)
})

const canMoveLeft = computed(() => currentColumnIndex.value > 0)
const canMoveRight = computed(() => currentColumnIndex.value < props.columns.length - 1 && currentColumnIndex.value !== -1)

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

// Move column left (backwards)
const moveColumnLeft = () => {
  if (canMoveLeft.value) {
    emit('move-column', {
      columnId: props.column.id,
      direction: 'left'
    })
    showOptions.value = false
  }
}

// Move column right (forward)
const moveColumnRight = () => {
  if (canMoveRight.value) {
    emit('move-column', {
      columnId: props.column.id,
      direction: 'right'
    })
    showOptions.value = false
  }
}

// Icon and color options
const iconOptions = [
  { value: 'clipboard', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Documento' },
  { value: 'clock', path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Relógio' },
  { value: 'check', path: 'M5 13l4 4L19 7', label: 'Concluído' },
  { value: 'alert', path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', label: 'Urgente' }
]

const colorOptions = [
  { value: 'blue', label: 'Azul', hex: '#3B82F6' },
  { value: 'yellow', label: 'Amarelo', hex: '#F59E0B' },
  { value: 'green', label: 'Verde', hex: '#10B981' },
  { value: 'red', label: 'Vermelho', hex: '#EF4444' }
]

// Toggle icon picker
const toggleIconPicker = () => {
  showIconPicker.value = !showIconPicker.value
  showColorPicker.value = false
}

// Toggle color picker
const toggleColorPicker = () => {
  showColorPicker.value = !showColorPicker.value
  showIconPicker.value = false
}

// Update column icon
const updateIcon = (iconValue) => {
  emit('update-column-icon', { columnId: props.column.id, icon: iconValue })
  showIconPicker.value = false
  showOptions.value = false
}

// Update column color
const updateColor = (colorValue) => {
  emit('update-column-color', { columnId: props.column.id, color: colorValue })
  showColorPicker.value = false
  showOptions.value = false
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

/* Increase z-index when menu is open to appear above other columns */
.kan-col--menu-open {
  position: relative;
  z-index: 9997;
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
  overflow: visible;
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
  z-index: 9998;
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

.kan-col__option:hover:not(:disabled) {
  background: rgba(var(--col-500), 0.06);
  color: rgb(var(--col-500));
}

.kan-col__option:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

.kan-col__option-chevron {
  width: 0.875rem;
  height: 0.875rem;
  margin-left: auto;
  opacity: 0.5;
}

.kan-col__option-wrapper {
  position: relative;
}

.kan-col__sub-dropdown {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 0.5rem;
  min-width: 160px;
  background: rgb(var(--bg-1));
  border: 1px solid rgba(var(--txt-3), 0.2);
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(30, 41, 59, 0.12);
  padding: 0.25rem;
  z-index: 9999;
}

.kan-col__sub-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgb(var(--txt-1));
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 120ms ease-out;
  text-align: left;
}

.kan-col__sub-option:hover {
  background: rgba(var(--col-500), 0.08);
}

.kan-col__sub-option--active {
  background: rgba(var(--col-500), 0.12);
  font-weight: 600;
}

.kan-col__sub-option-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  overflow: visible;
}

.kan-col__color-preview {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
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

/* Cards List */
.kan-col__cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 100px;
}

/* VueDraggable Ghost Class */
.kan-card--ghost {
  opacity: 0.5;
  background: rgba(var(--col-500), 0.1);
  border: 2px dashed rgba(var(--col-500), 0.4);
  cursor: grabbing !important;
}

/* VueDraggable Dragging Class */
.kan-card--dragging {
  opacity: 0.8;
  transform: rotate(2deg) scale(1.03);
  box-shadow: var(--shadow-3);
  cursor: grabbing !important;
}

/* Card transitions for VueDraggable */
.kan-col__cards-list > * {
  transition: all var(--dur-fast) var(--ease-out);
}

/* Ensure cards maintain grab cursor */
.kan-col__cards-list .kan-card {
  cursor: grab !important;
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
