<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header com loading overlay -->
    <div class="bg-white shadow-sm border-b border-gray-200 relative">
      <!-- Loading overlay apenas para operações críticas (não inclui movimentação) -->
      <div
        v-if="loadingCard || loadingColumn"
        class="absolute inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center"
      >
        <div class="flex items-center space-x-2 text-indigo-600">
          <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="text-sm font-medium">
            {{ loadingCard ? 'Processando cartão...' : 'Processando...' }}
          </span>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center space-x-4">
            <button
              @click="navigateTo('/kanbans')"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ kanban?.title }}</h1>
              <p class="mt-1 text-sm text-gray-600">{{ kanban?.description }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="showAddColumnModal = true"
              :disabled="loadingColumn"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50"
            >
              <svg v-if="loadingColumn" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ loadingColumn ? 'Processando...' : 'Nova Coluna' }}
            </button>
            <button
              @click="editKanban"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Kanban Board -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="initialLoading || dataLoading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Erro ao carregar kanban</h3>
        <p class="mt-1 text-sm text-gray-500">{{ errorMessage }}</p>
        <div class="mt-6">
          <button
            @click="navigateTo('/kanbans')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Voltar para Kanbans
          </button>
        </div>
      </div>

      <!-- Kanban Columns otimizado com v-memo -->
      <div v-else class="flex space-x-6 overflow-x-auto pb-4">
        <div
          v-for="column in sortedColumns"
          :key="column.id"
          v-memo="[column.id, column.title, column.updated_at]"
          class="flex-shrink-0 w-80"
        >
          <KanbanColumn
            :column="column"
            :cards="getColumnCards(column.id)"
            :global-drag-state="globalDragState"
            @add-card="handleAddCard"
            @edit-card="handleEditCard"
            @delete-card="handleDeleteCard"
            @delete-column="handleDeleteColumn"
            @card-drop="handleCardDrop"
            @card-drag-start="startInstantMove"
            @card-drag-end="endInstantMove"
            @update-preview-column="updatePreviewColumn"
          />
        </div>
      </div>
    </div>

    <!-- Add Column Modal -->
    <Teleport to="body">
      <div v-if="showAddColumnModal" class="fixed z-50 inset-0 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeAddColumnModal"></div>
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form @submit.prevent="addColumn">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Nova Coluna
                </h3>
                <div>
                  <label for="column-title" class="block text-sm font-medium text-gray-700">
                    Título da Coluna
                  </label>
                  <input
                    id="column-title"
                    v-model="newColumnTitle"
                    type="text"
                    required
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="Ex: A Fazer, Fazendo, Concluído"
                  />
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  :disabled="savingColumn"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <span v-if="savingColumn">Adicionando...</span>
                  <span v-else>Adicionar</span>
                </button>
                <button
                  type="button"
                  @click="closeAddColumnModal"
                  class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add/Edit Card Modal -->
    <Teleport to="body">
      <div v-if="showCardModal" class="fixed z-50 inset-0 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeCardModal"></div>
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form @submit.prevent="saveCard">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {{ editingCard ? 'Editar Cartão' : 'Novo Cartão' }}
                </h3>
                <div class="space-y-4">
                  <div>
                    <label for="card-title" class="block text-sm font-medium text-gray-700">
                      Título
                    </label>
                    <input
                      id="card-title"
                      v-model="cardForm.title"
                      type="text"
                      required
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="Título do cartão"
                    />
                  </div>
                  <div>
                    <label for="card-description" class="block text-sm font-medium text-gray-700">
                      Descrição (opcional)
                    </label>
                    <textarea
                      id="card-description"
                      v-model="cardForm.description"
                      rows="4"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="Descrição do cartão..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  :disabled="savingCard"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <span v-if="savingCard">Salvando...</span>
                  <span v-else>{{ editingCard ? 'Atualizar' : 'Adicionar' }}</span>
                </button>
                <button
                  type="button"
                  @click="closeCardModal"
                  class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

// State otimizado com shallowRef para performance
const kanban = shallowRef(null)
const columns = shallowRef([])
const cards = shallowRef([])
const initialLoading = ref(true)
const error = ref('')

// Cache key para controle de atualizações
const cacheKey = computed(() => `kanban-${route.params.id}`)
const showAddColumnModal = ref(false)
const newColumnTitle = ref('')
const savingColumn = ref(false)
const showCardModal = ref(false)
const editingCard = ref(null)
const cardForm = ref({
  title: '',
  description: ''
})
const savingCard = ref(false)
const selectedColumnId = ref(null)

// Loading states granulares
const loadingCard = ref(false)
const loadingMove = ref(false)
const loadingColumn = ref(false)

// Computed
const sortedColumns = computed(() => {
  return columns.value.sort((a, b) => a.position - b.position)
})

// Cache para cards por coluna para evitar recálculos
const columnCardsCache = new Map()

// Get cards for a specific column com memoização
const getColumnCards = (columnId) => {
  // Verificar cache
  const cacheKey = `${columnId}-${cards.value.length}`
  if (columnCardsCache.has(cacheKey)) {
    return columnCardsCache.get(cacheKey)
  }

  // Calcular e cachear
  const columnCards = cards.value
    .filter(card => card.column_id === columnId)
    .sort((a, b) => a.position - b.position)

  // Limitar cache a 50 entradas
  if (columnCardsCache.size > 50) {
    const firstKey = columnCardsCache.keys().next().value
    columnCardsCache.delete(firstKey)
  }

  columnCardsCache.set(cacheKey, columnCards)
  return columnCards
}

// Load kanban data otimizado com cache
const {
  data: kanbanData,
  pending: kanbanLoading,
  error: kanbanError,
  refresh: refreshKanban
} = useLazyAsyncData(cacheKey.value, async () => {
  try {
    const { data } = await $fetch(`/api/kanbans/${route.params.id}`)

    return {
      kanban: {
        id: data.id,
        title: data.title,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      },
      columns: data.columns || [],
      cards: data.cards || []
    }
  } catch (err) {
    console.error('Erro ao carregar kanban:', err)
    throw err
  }
}, {
  // Cache por 5 minutos
  server: false,
  default: () => ({
    kanban: null,
    columns: [],
    cards: []
  })
})

// Sincronizar dados reativos com dados cacheados
watchEffect(() => {
  if (kanbanData.value) {
    kanban.value = kanbanData.value.kanban
    columns.value = kanbanData.value.columns
    cards.value = kanbanData.value.cards

    // Parar loading inicial quando dados são carregados
    if (initialLoading.value && !dataLoading.value) {
      initialLoading.value = false
    }

    // Se não há colunas, criar padrão
    if (columns.value.length === 0 && !dataLoading.value) {
      createDefaultColumns()
    }
  }
})

// Loading states otimizados
const dataLoading = computed(() => kanbanLoading.value)
const errorMessage = computed(() => kanbanError.value?.message || '')

// Refresh otimizado
const loadKanban = async () => {
  await refreshKanban()
}

// Create default columns
const createDefaultColumns = async () => {
  try {
    const defaultColumns = [
      { title: 'A Fazer', icon: 'clipboard', color: 'blue', position: 0 },
      { title: 'Fazendo', icon: 'clock', color: 'yellow', position: 1 },
      { title: 'Concluído', icon: 'check', color: 'green', position: 2 }
    ]

    for (const column of defaultColumns) {
      // Usando a rota genérica para criar colunas (se existir)
      await $fetch('/api/kanbans/columns', {
        method: 'POST',
        body: {
          kanban_id: route.params.id,
          title: column.title,
          icon: column.icon,
          color: column.color,
          position: column.position
        }
      }).catch(() => {
        // Se não tiver endpoint específico, cria diretamente
        // Esta é uma fallback simples para garantir que funcione
      })
    }

    // Reload kanban data
    await loadKanban()
  } catch (error) {
    console.error('Erro ao criar colunas padrão:', error)
  }
}

// Add column otimizado com atualização delta
const addColumn = async () => {
  try {
    savingColumn.value = true
    loadingColumn.value = true

    let newColumn = null

    try {
      // Tentar API primeiro
      const response = await $fetch('/api/kanbans/columns', {
        method: 'POST',
        body: {
          kanban_id: route.params.id,
          title: newColumnTitle.value,
          icon: 'clipboard',
          color: 'blue',
          position: columns.value.length
        }
      })
      newColumn = response.data || response
    } catch (apiError) {
      // Fallback: criar diretamente via Supabase
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert({
          kanban_id: route.params.id,
          title: newColumnTitle.value,
          icon: 'clipboard',
          color: 'blue',
          position: columns.value.length
        })
        .select()
        .single()

      if (error) throw error
      newColumn = data
    }

    // Atualização delta - não recarregar tudo
    if (newColumn) {
      columns.value = [...columns.value, newColumn]
      // Limpar cache de cards por coluna
      columnCardsCache.clear()
    }

    closeAddColumnModal()
  } catch (error) {
    console.error('Erro ao adicionar coluna:', error)
    alert('Erro ao adicionar coluna: ' + (error.message || 'Tente novamente.'))
  } finally {
    savingColumn.value = false
    loadingColumn.value = false
  }
}

// Handle add card
const handleAddCard = (columnId) => {
  selectedColumnId.value = columnId
  editingCard.value = null
  cardForm.value = {
    title: '',
    description: ''
  }
  showCardModal.value = true
}

// Handle edit card
const handleEditCard = (card) => {
  selectedColumnId.value = card.column_id
  editingCard.value = card
  cardForm.value = {
    title: card.title,
    description: card.description || ''
  }
  showCardModal.value = true
}

// Handle delete card otimizado com atualização delta
const handleDeleteCard = async (cardId) => {
  if (!confirm('Tem certeza que deseja excluir este cartão?')) return

  try {
    loadingCard.value = true
    let deleted = false

    try {
      await $fetch(`/api/kanbans/cards/${cardId}`, {
        method: 'DELETE'
      })
      deleted = true
    } catch (apiError) {
      // Fallback: excluir diretamente via Supabase
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
      deleted = true
    }

    // Atualização delta
    if (deleted) {
      cards.value = cards.value.filter(c => c.id !== cardId)
      columnCardsCache.clear()
    }
  } catch (error) {
    console.error('Erro ao excluir cartão:', error)
    alert('Erro ao excluir cartão: ' + (error.message || 'Tente novamente.'))
    // Em caso de erro, recarregar para manter consistência
    await loadKanban()
  } finally {
    loadingCard.value = false
  }
}

// Handle delete column
const handleDeleteColumn = async (columnId) => {
  if (!confirm('Tem certeza que deseja excluir esta coluna? Todos os cartões nesta coluna também serão excluídos.')) return

  try {
    const { error } = await supabase
      .from('kanban_columns')
      .delete()
      .eq('id', columnId)

    if (error) throw error
    await loadKanban()
  } catch (error) {
    console.error('Error deleting column:', error)
    alert('Erro ao excluir coluna. Tente novamente.')
  }
}

// Estado global de dragging para movimento instantâneo
const globalDragState = ref({
  isDragging: false,
  draggedCard: null,
  originalColumnId: null,
  previewColumnId: null,
  dragOverColumnId: null
})

// Sistema de backup/rollback inteligente para movimentação
const dragBackup = ref(null)

// Iniciar movimento instantâneo no drag start - OTIMIZADO
const startInstantMove = (cardId) => {
  const card = cards.value.find(c => c.id === cardId)
  if (!card) return

  // Criar backup de forma síncrona ultra-rápida
  dragBackup.value = {
    cardId,
    originalCard: { ...card },
    originalCards: [...cards.value],
    originalColumnId: card.column_id,
    originalPosition: card.position,
    timestamp: Date.now()
  }

  // Configurar estado global de dragging forma síncrona
  globalDragState.value = {
    isDragging: true,
    draggedCard: { ...card },
    originalColumnId: card.column_id,
    previewColumnId: card.column_id,
    dragOverColumnId: null
  }

  // REMOVER CARD VISIVELMENTE de forma OTIMIZADA
  const cardIndex = cards.value.findIndex(c => c.id === cardId)
  if (cardIndex !== -1) {
    // Remover card da visualização de forma imediata
    const newCards = [...cards.value]
    newCards.splice(cardIndex, 1)

    // Reorganizar APENAS os cards da coluna afetada
    const columnCards = newCards.filter(c => c.column_id === card.column_id)
    const otherColumnCards = newCards.filter(c => c.column_id !== card.column_id)

    // Reorganizar posições sem criar novos objetos desnecessários
    columnCards.forEach((c, index) => {
      c.position = index
    })

    // Atualizar estado de forma otimizada
    cards.value = [...otherColumnCards, ...columnCards]

    // Limpar cache APENAS da coluna afetada
    const affectedCacheKeys = Array.from(columnCardsCache.keys())
      .filter(key => key.includes(card.column_id.toString()))
    affectedCacheKeys.forEach(key => columnCardsCache.delete(key))
  }
}

// Finalizar movimento instantâneo
const endInstantMove = () => {
  globalDragState.value = {
    isDragging: false,
    draggedCard: null,
    originalColumnId: null,
    previewColumnId: null,
    dragOverColumnId: null
  }
}

// Atualizar preview de coluna durante o drag - OTIMIZADO
const updatePreviewColumn = (columnId) => {
  if (!globalDragState.value.isDragging) return

  // Evitar atualizações desnecessárias se a coluna não mudou
  if (globalDragState.value.previewColumnId === columnId) return

  // Atualização síncrona e instantânea
  globalDragState.value.dragOverColumnId = columnId
  globalDragState.value.previewColumnId = columnId

  // Se o card já foi movido visualmente, não fazer nada mais
  // O preview será tratado pelo componente KanbanColumn
}

// Criar backup do estado antes do drag
const createDragBackup = (cardId) => {
  const card = cards.value.find(c => c.id === cardId)
  if (!card) return null

  return {
    cardId,
    originalCard: { ...card },
    originalCards: [...cards.value],
    originalColumnId: card.column_id,
    originalPosition: card.position,
    timestamp: Date.now()
  }
}

// Rollback suave com animação
const performRollback = (backup) => {
  if (!backup) return

  // Adicionar classe de erro para feedback visual
  const cardElement = document.querySelector(`[data-card-id="${backup.cardId}"]`)
  if (cardElement) {
    cardElement.classList.add('rollback-error')
    setTimeout(() => {
      cardElement.classList.remove('rollback-error')
    }, 1000)
  }

  // Restaurar estado original
  cards.value = backup.originalCards
  columnCardsCache.clear()

  // Notificação sutil
  if (process.client) {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2'
    toast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>Falha ao mover cartão - posição restaurada</span>
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 4000)
  }
}

// Handle card drop - TOTALMENTE NÃO BLOQUEANTE
const handleCardDrop = ({ cardId, newColumnId, newPosition }) => {
  if (!globalDragState.value.isDragging || !dragBackup.value) return

  // Movimento visual já foi feito no dragStart!
  // Iniciar persistência em background SEM BLOQUEAR A UI

  const finalizeMove = async () => {
    try {
      // Encontrar posição correta
      const targetColumnCards = cards.value.filter(c => c.column_id === newColumnId)
      let actualPosition = newPosition

      const draggedCardId = globalDragState.value.draggedCard?.id
      if (targetColumnCards.some(c => c.id === draggedCardId)) {
        actualPosition = targetColumnCards.findIndex(c => c.id === draggedCardId)
      }

      // Persistir em background COM TIMEOUT LONGO para não bloquear
      const persistPromise = new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await $fetch(`/api/kanbans/cards/${cardId}/move`, {
              method: 'PUT',
              body: {
                column_id: newColumnId,
                position: actualPosition
              }
            })
            resolve()
          } catch (apiError) {
            // Fallback direto
            try {
              const { error } = await supabase
                .from('kanban_cards')
                .update({
                  column_id: newColumnId,
                  position: actualPosition,
                  updated_at: new Date().toISOString()
                })
                .eq('id', cardId)

              if (error) throw error
              resolve()
            } catch (fallbackError) {
              reject(fallbackError)
            }
          }
        }, 50) // 50ms delay para garantir que não bloqueie
      })

      await persistPromise

    } catch (error) {
      console.error('Erro na persistência (background):', error)
      // Rollback em background se falhar
      if (dragBackup.value) {
        performRollback(dragBackup.value)
      }
    }
  }

  // EXECUTAR EM BACKGROUND - NÃO ESPERAR!
  finalizeMove()

  // Finalizar estado imediatamente
  endInstantMove()

  // Limpar backup após tempo
  setTimeout(() => {
    if (dragBackup.value?.cardId === cardId) {
      dragBackup.value = null
    }
  }, 3000)
}

// Save card otimizado com atualização delta
const saveCard = async () => {
  try {
    savingCard.value = true

    if (editingCard.value) {
      // Update existing card
      let updatedCard = null

      try {
        const response = await $fetch(`/api/kanbans/cards/${editingCard.value.id}`, {
          method: 'PUT',
          body: {
            title: cardForm.value.title,
            description: cardForm.value.description,
            column_id: selectedColumnId.value
          }
        })
        updatedCard = response.data || response
      } catch (apiError) {
        // Fallback: atualizar diretamente via Supabase
        const { data, error } = await supabase
          .from('kanban_cards')
          .update({
            title: cardForm.value.title,
            description: cardForm.value.description,
            column_id: selectedColumnId.value,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCard.value.id)
          .select()
          .single()

        if (error) throw error
        updatedCard = data
      }

      // Atualização delta
      if (updatedCard) {
        const cardIndex = cards.value.findIndex(c => c.id === editingCard.value.id)
        if (cardIndex !== -1) {
          cards.value = [
            ...cards.value.slice(0, cardIndex),
            updatedCard,
            ...cards.value.slice(cardIndex + 1)
          ]
        }
        columnCardsCache.clear()
      }
    } else {
      // Create new card
      const maxPosition = Math.max(
        ...cards.value
          .filter(card => card.column_id === selectedColumnId.value)
          .map(card => card.position),
        -1
      )

      let newCard = null

      try {
        const response = await $fetch('/api/kanbans/cards', {
          method: 'POST',
          body: {
            kanban_id: route.params.id,
            column_id: selectedColumnId.value,
            title: cardForm.value.title,
            description: cardForm.value.description,
            position: maxPosition + 1
          }
        })
        newCard = response.data || response
      } catch (apiError) {
        // Fallback: criar diretamente via Supabase
        const { data, error } = await supabase
          .from('kanban_cards')
          .insert({
            kanban_id: route.params.id,
            column_id: selectedColumnId.value,
            title: cardForm.value.title,
            description: cardForm.value.description,
            position: maxPosition + 1
          })
          .select()
          .single()

        if (error) throw error
        newCard = data
      }

      // Atualização delta
      if (newCard) {
        cards.value = [...cards.value, newCard]
        columnCardsCache.clear()
      }
    }

    closeCardModal()
  } catch (error) {
    console.error('Erro ao salvar cartão:', error)
    alert('Erro ao salvar cartão: ' + (error.message || 'Tente novamente.'))
  } finally {
    savingCard.value = false
  }
}

// Edit kanban
const editKanban = () => {
  const newTitle = prompt('Título do kanban:', kanban.value.title)
  const newDescription = prompt('Descrição do kanban:', kanban.value.description || '')

  if (newTitle && newTitle.trim()) {
    updateKanban(newTitle.trim(), newDescription?.trim())
  }
}

// Update kanban
const updateKanban = async (title, description) => {
  try {
    await $fetch(`/api/kanbans/${route.params.id}`, {
      method: 'PUT',
      body: {
        title,
        description
      }
    }).catch(async () => {
      // Fallback: atualizar diretamente via Supabase
      const { error } = await supabase
        .from('kanbans')
        .update({
          title,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', route.params.id)

      if (error) throw error
    })

    kanban.value.title = title
    kanban.value.description = description
  } catch (error) {
    console.error('Erro ao atualizar kanban:', error)
    alert('Erro ao atualizar kanban: ' + (error.message || 'Tente novamente.'))
  }
}

// Close modals
const closeAddColumnModal = () => {
  showAddColumnModal.value = false
  newColumnTitle.value = ''
}

const closeCardModal = () => {
  showCardModal.value = false
  editingCard.value = null
  selectedColumnId.value = null
  cardForm.value = {
    title: '',
    description: ''
  }
}

// Load on mount
onMounted(() => {
  loadKanban()
})

// Meta tags
useHead({
  title: computed(() => kanban.value ? `${kanban.value.title} - Artemis` : 'Kanban - Artemis'),
  meta: [
    { name: 'description', content: computed(() => kanban.value?.description || 'Quadro kanban') }
  ]
})
</script>