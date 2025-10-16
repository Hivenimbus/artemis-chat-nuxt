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
      <!-- Cards com virtualização para grandes listas -->
      <div v-if="useVirtualization" class="kan-col__cards-list kan-col__cards-list--virtual">
        <VirtualList
          :items="cardsWithPreview"
          :item-size="140"
          :container-height="400"
          :buffer-size="3"
          :is-dragging="globalDragState?.isDragging || false"
        >
          <template #default="{ item: card, index }">
            <div
              class="card-drop-zone"
              @dragover.prevent="handleCardDragOver($event, index)"
              @dragleave="handleCardDragLeave($event, index)"
              @drop="handleCardDrop($event, index)"
              :class="{
                'card-drop-zone--active': dragOverIndex === index,
                'card-drop-zone--preview': card.isPreview,
                'card-drop-zone--placeholder': card.isPlaceholder
              }"
            >
              <!-- Placeholder para card removido -->
              <div v-if="card.isPlaceholder" class="card-placeholder">
                <div class="card-placeholder__content">
                  <svg class="card-placeholder__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1 1 0 011-1h4a1 1 0 011 1v6m-6 0a1 1 0 001 1h2a1 1 0 001-1m0-5a1 1 0 011-1h2a1 1 0 011 1m0-5V4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span class="card-placeholder__text">Card movido</span>
                </div>
              </div>

              <!-- Card normal ou preview -->
              <KanbanCard
                v-else
                :card="card"
                :columns="columns"
                :current-column-id="column.id"
                :is-preview="card.isPreview"
                :global-drag-state="globalDragState"
                @edit-card="$emit('edit-card', $event)"
                @delete-card="$emit('delete-card', $event)"
                @move-card="handleMoveCard(card.id, $event)"
                @card-drag-start="$emit('card-drag-start', $event)"
                @card-drag-end="$emit('card-drag-end')"
              />
            </div>
          </template>
        </VirtualList>
      </div>

      <!-- Cards tradicionais para listas pequenas -->
      <TransitionGroup v-else name="card-list" tag="div" class="kan-col__cards-list">
        <div
          v-for="(card, index) in cardsWithPreview"
          :key="card.id"
          v-memo="[card.id, card.title, card.description, card.updated_at, dragOverIndex === index, card.isPreview, card.isPlaceholder]"
          class="card-drop-zone"
          @dragover.prevent="handleCardDragOver($event, index)"
          @dragleave="handleCardDragLeave($event, index)"
          @drop="handleCardDrop($event, index)"
          :class="{
            'card-drop-zone--active': dragOverIndex === index,
            'card-drop-zone--preview': card.isPreview,
            'card-drop-zone--placeholder': card.isPlaceholder
          }"
        >
          <!-- Placeholder para card removido -->
          <div v-if="card.isPlaceholder" class="card-placeholder">
            <div class="card-placeholder__content">
              <svg class="card-placeholder__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1 1 0 011-1h4a1 1 0 011 1v6m-6 0a1 1 0 001 1h2a1 1 0 001-1m0-5a1 1 0 011-1h2a1 1 0 011 1m0-5V4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="card-placeholder__text">Card movido</span>
            </div>
          </div>

          <!-- Card normal ou preview -->
          <KanbanCard
            v-else
            :card="card"
            :columns="columns"
            :current-column-id="column.id"
            :is-preview="card.isPreview"
            :global-drag-state="globalDragState"
            @edit-card="$emit('edit-card', $event)"
            @delete-card="$emit('delete-card', $event)"
            @move-card="handleMoveCard(card.id, $event)"
            @card-drag-start="$emit('card-drag-start', $event)"
            @card-drag-end="$emit('card-drag-end')"
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
  },
  globalDragState: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['add-card', 'edit-card', 'delete-card', 'card-drop', 'rename-column', 'delete-column', 'move-card', 'move-column', 'update-column-icon', 'update-column-color', 'card-drag-start', 'card-drag-end', 'update-preview-column'])

// State otimizado
const isDragOver = ref(false)
const dragOverIndex = ref(null)
const isDragFromDifferentColumn = ref(false)
const showOptions = ref(false)
const showIconPicker = ref(false)
const showColorPicker = ref(false)

// Variáveis simplificadas para melhor performance
// Removido batching complexo em favor de resposta imediata

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

// Determinar quando usar virtualização (mais de 10 cartões)
const useVirtualization = computed(() => props.cards.length > 10)

// Cards com preview do card sendo arrastado - OTIMIZADO COM SHALLOW REF
const cardsWithPreview = shallowRef([])

// Atualizar cards com preview apenas quando necessário - EVITAR RECOMPUTE EXCESSIVO
const updateCardsWithPreview = () => {
  const baseCards = [...props.cards]
  let needsUpdate = false

  // Verificar se precisa mostrar placeholder
  const needsPlaceholder = props.globalDragState?.isDragging &&
                          props.globalDragState?.originalColumnId === props.column.id &&
                          props.globalDragState?.draggedCard

  // Verificar se precisa mostrar preview
  const needsPreview = props.globalDragState?.isDragging &&
                       props.globalDragState?.previewColumnId === props.column.id &&
                       props.globalDragState?.draggedCard &&
                       props.globalDragState?.previewColumnId !== props.globalDragState?.originalColumnId

  // Comparar com estado atual para evitar updates desnecessários
  const currentHasPlaceholder = cardsWithPreview.value.some(card => card.isPlaceholder)
  const currentHasPreview = cardsWithPreview.value.some(card => card.isPreview)

  if (needsPlaceholder !== currentHasPlaceholder || needsPreview !== currentHasPreview) {
    needsUpdate = true
  }

  if (!needsUpdate) {
    // Verificar se os cards base mudaram (comparação simples)
    if (baseCards.length !== cardsWithPreview.value.filter(c => !c.isPlaceholder && !c.isPreview).length) {
      needsUpdate = true
    }
  }

  if (needsUpdate) {
    // Adicionar placeholder se necessário
    if (needsPlaceholder) {
      const placeholderCard = {
        isPlaceholder: true,
        id: `placeholder-${props.globalDragState.draggedCard.id}`,
        column_id: props.column.id,
        height: '120px'
      }
      baseCards.push(placeholderCard)
    }

    // Adicionar preview se necessário
    if (needsPreview) {
      const previewCard = {
        ...props.globalDragState.draggedCard,
        isPreview: true,
        id: `preview-${props.globalDragState.draggedCard.id}`,
        column_id: props.column.id
      }
      baseCards.push(previewCard)
    }

    cardsWithPreview.value = baseCards
  }
}

// Watch ULTRA OTIMIZADO - DESATIVADO DURANTE DRAG PARA ZERO DELAY
let isDuringDrag = false

// Watch simples apenas para cards - globalDragState handled manualmente
watch(() => props.cards,
  (newCards, oldCards) => {
    if (!isDuringDrag) {
      updateCardsWithPreview()
    }
  },
  { immediate: true, flush: 'sync' }
)

// Watch separado para drag state com otimização máxima
watch(() => props.globalDragState?.isDragging,
  (isDragging, wasDragging) => {
    isDuringDrag = isDragging

    if (isDragging) {
      // INÍCIO DRAG: Atualização imediata sem recálculo complexo
      const baseCards = [...props.cards]
      const needsPlaceholder = props.globalDragState?.originalColumnId === props.column.id
      const needsPreview = props.globalDragState?.previewColumnId === props.column.id

      // Adicionar items diretamente sem validações complexas
      if (needsPlaceholder) {
        const placeholderCard = {
          isPlaceholder: true,
          id: `placeholder-${props.globalDragState.draggedCard?.id}`,
          column_id: props.column.id,
          height: '120px'
        }
        baseCards.push(placeholderCard)
      }

      if (needsPreview && props.globalDragState?.draggedCard) {
        const previewCard = {
          ...props.globalDragState.draggedCard,
          isPreview: true,
          id: `preview-${props.globalDragState.draggedCard.id}`,
          column_id: props.column.id
        }
        baseCards.push(previewCard)
      }

      cardsWithPreview.value = baseCards
    } else {
      // FIM DRAG: Reset imediato
      isDuringDrag = false
      cardsWithPreview.value = [...props.cards]
    }
  },
  { immediate: false, flush: 'sync' }
)

// Watch simples para preview column - apenas quando não está arrastando
watch(() => props.globalDragState?.previewColumnId,
  (newColumnId, oldColumnId) => {
    if (!isDuringDrag && newColumnId !== oldColumnId) {
      updateCardsWithPreview()
    }
  },
  { immediate: false, flush: 'sync' }
)

// Handle drag over column - SIMPLIFICADO E OTIMIZADO
const handleDragOver = (event) => {
  try {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    // Resposta imediata usando estado global
    const isGlobalDragging = props.globalDragState?.isDragging
    const isDraggingOverThisColumn = props.globalDragState?.dragOverColumnId === props.column.id

    if (isGlobalDragging && !isDraggingOverThisColumn) {
      // Notificar pai imediatamente sobre a mudança de preview
      emit('update-preview-column', props.column.id)
    }

    // Atualizar estados locais de forma síncrona para resposta instantânea
    const sourceColumnId = event.dataTransfer.getData('sourceColumnId')
    const isDifferentColumn = sourceColumnId && sourceColumnId !== props.column.id

    if (isDifferentColumn || isGlobalDragging) {
      isDragFromDifferentColumn.value = isDifferentColumn
      isDragOver.value = true
    }

  } catch (error) {
    console.warn('Erro no handleDragOver:', error)
    // Reset states em caso de erro
    isDragOver.value = false
    isDragFromDifferentColumn.value = false
  }
}

// Handle drag leave column otimizado com resposta imediata
const handleDragLeave = (event) => {
  try {
    // Capturar referências seguras
    const currentTarget = event.currentTarget
    const relatedTarget = event.relatedTarget

    // Verificação robusta - se o elemento não existe mais, consideramos como leaving
    const elementExists = currentTarget && typeof currentTarget.contains === 'function'

    if (!elementExists) {
      // Elemento foi removido, reset states imediatamente
      isDragOver.value = false
      isDragFromDifferentColumn.value = false
      return
    }

    // Verificação segura para relatedTarget - resposta imediata
    const isLeavingContainer = relatedTarget === null || !currentTarget.contains(relatedTarget)

    if (isLeavingContainer) {
      isDragOver.value = false
      isDragFromDifferentColumn.value = false
    }
  } catch (error) {
    console.warn('Erro no handleDragLeave:', error)
    // Reset states imediatamente em caso de erro
    isDragOver.value = false
    isDragFromDifferentColumn.value = false
  }
}

// Handle drop on column (empty space - adds to end)
const handleDrop = (event) => {
  try {
    event.preventDefault()

    isDragOver.value = false
    isDragFromDifferentColumn.value = false

    const cardId = event.dataTransfer?.getData('cardId')
    const sourceColumnId = event.dataTransfer?.getData('sourceColumnId')

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
  } catch (error) {
    console.warn('Erro no handleDrop:', error)
    // Reset states em caso de erro
    isDragOver.value = false
    isDragFromDifferentColumn.value = false
  }
}

// Cache removido para simplicidade e performance

// Handle drag over a specific card - SIMPLIFICADO E OTIMIZADO
const handleCardDragOver = (event, index) => {
  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer.dropEffect = 'move'

  // Resposta imediata sem cache complexo
  const sourceColumnId = event.dataTransfer.getData('sourceColumnId')
  const isDifferentColumn = sourceColumnId && sourceColumnId !== props.column.id

  isDragFromDifferentColumn.value = isDifferentColumn

  // Apenas atualizar se o índice mudou para evitar renderizações desnecessárias
  if (dragOverIndex.value !== index) {
    dragOverIndex.value = index
  }
}

// Handle drag leave from a specific card otimizado
const handleCardDragLeave = (event, index) => {
  try {
    // Capturar referências seguras
    const currentTarget = event.currentTarget
    const relatedTarget = event.relatedTarget

    // Verificação robusta - se o elemento não existe mais, consideramos como leaving
    const elementExists = currentTarget && typeof currentTarget.contains === 'function'

    if (!elementExists) {
      // Elemento foi removido, reset states específicos
      if (dragOverIndex.value === index) {
        dragOverIndex.value = null
        isDragFromDifferentColumn.value = false
      }
      return
    }

    // Verificação segura para relatedTarget
    const isLeavingCard = relatedTarget === null || !currentTarget.contains(relatedTarget)

    if (isLeavingCard) {
      if (dragOverIndex.value === index) {
        dragOverIndex.value = null
        isDragFromDifferentColumn.value = false
      }
    }
  } catch (error) {
    console.warn('Erro no handleCardDragLeave:', error)
    // Reset states em caso de erro
    dragOverIndex.value = null
    isDragFromDifferentColumn.value = false
  }
}

// Handle drop on a specific card - ZERO LAYOUT THRASHING
const handleCardDrop = (event, targetIndex) => {
  event.preventDefault()
  event.stopPropagation()

  // Reset states imediatamente
  dragOverIndex.value = null
  isDragOver.value = false
  isDragFromDifferentColumn.value = false

  const cardId = event.dataTransfer.getData('cardId')
  const sourceColumnId = event.dataTransfer.getData('sourceColumnId')

  if (!cardId) return

  // CÁLCULO ULTRA RÁPIDO - ZERO DOM QUERIES
  // Usar apenas offsetY nativo do evento - SEM getBoundingClientRect()
  const offsetY = event.offsetY || 0
  const targetHeight = event.currentTarget?.clientHeight || 140

  // Determinar posição baseada no offset - cálculo instantâneo sem layout thrashing
  let newPosition = targetIndex
  if (offsetY > targetHeight / 2) {
    newPosition = targetIndex + 1
  }

  // OTIMIZAÇÃO MÁXIMA: Zero DOM queries, zero cálculos complexos
  // Posição calculada instantaneamente com dados nativos do evento

  // Emitir evento IMEDIATAMENTE sem delay
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

// Cleanup simplificado quando o componente é destruído
onBeforeUnmount(() => {
  // Reset states para garantir limpeza
  isDragOver.value = false
  isDragFromDifferentColumn.value = false
  dragOverIndex.value = null
})
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
  /* ZERO DELAY - sem transições */
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

/* Column Options Menu otimizado */
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
  /* ZERO DELAY - sem transições */
  will-change: auto;
}

.kan-col__options-btn:hover {
  background: rgba(var(--col-500), 0.08);
  color: rgb(var(--col-500));
  transform: scale(1.03);
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
  /* ZERO DELAY - sem transições */
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
  /* ZERO DELAY - sem transições */
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

.kan-col__cards--drag-over {
  background: rgba(var(--col-500), 0.08);
  outline: 2px dashed rgba(var(--col-500), 0.6);
  outline-offset: -4px;
  /* ZERO DELAY - sem transições */
  transform: scale(1.005);
}

/* Blur cards and button only when dragging from different column */
.kan-col__cards--drag-over .kan-col__cards-list,
.kan-col__cards--drag-over .kan-col__add-btn {
  filter: blur(4px);
  opacity: 0.3;
  pointer-events: none;
  /* ZERO DELAY - sem transições */
}

/* No blur when reordering within same column */
.kan-col__cards--reordering .kan-col__cards-list,
.kan-col__cards--reordering .kan-col__add-btn {
  filter: none;
  opacity: 1;
  /* ZERO DELAY - sem transições */
}

/* Cards List */
.kan-col__cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 600px;
  overflow-y: auto;
}

/* Virtual list otimizado */
.kan-col__cards-list--virtual {
  gap: 0;
  padding: 0;
}

.kan-col__cards-list--virtual .VirtualList {
  width: 100%;
}

.kan-col__cards-list--virtual .virtual-list__item {
  padding: 0.375rem 0;
}

.kan-col__cards-list--virtual .card-drop-zone {
  margin-bottom: 0.75rem;
}

/* Card Drop Zone - ZERO DELAY */
.card-drop-zone {
  position: relative;
  /* ZERO DELAY - sem transições */
}

.card-drop-zone--active {
  transform: translateY(2px) scale(1.01);
  background: rgba(var(--col-500), 0.03);
  border-radius: 8px;
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

/* Card List Transitions - ZERO DELAY */
.card-list-enter-active,
.card-list-leave-active {
  /* ZERO DELAY - sem transições */
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateX(8px) scale(0.98);
}

.card-list-move {
  /* ZERO DELAY - sem transições */
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
  /* ZERO DELAY - sem transições */
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

/* Drop Indicator Transitions - ZERO DELAY */
.drop-indicator-enter-active,
.drop-indicator-leave-active {
  /* ZERO DELAY - sem transições */
}

.drop-indicator-enter-from,
.drop-indicator-leave-to {
  opacity: 0;
}

/* Card Drop Zone Preview */
.card-drop-zone--preview {
  background: rgba(var(--col-500), 0.05);
  border-radius: 8px;
}

/* Card Drop Zone Placeholder */
.card-drop-zone--placeholder {
  min-height: 120px;
}

/* Placeholder Visual */
.card-placeholder {
  width: 100%;
  height: 120px;
  border: 2px dashed rgba(var(--txt-2), 0.4);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--bg-1), 0.5);
  opacity: 0.7;
  animation: placeholder-pulse 2s ease-in-out infinite;
}

.card-placeholder__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgb(var(--txt-2));
}

.card-placeholder__icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.5;
}

.card-placeholder__text {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.7;
}

@keyframes placeholder-pulse {
  0%, 100% {
    opacity: 0.7;
    border-color: rgba(var(--txt-2), 0.4);
  }
  50% {
    opacity: 0.4;
    border-color: rgba(var(--txt-2), 0.2);
  }
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
