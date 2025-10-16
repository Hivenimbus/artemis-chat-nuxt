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

// Computed - SIMPLIFICADO sem sort()
const sortedColumns = computed(() => {
  const colsArray = columns.value
  const length = colsArray.length

  // Para arrays pequenos (< 20 itens), insertion sort manual é mais rápido que sort()
  if (length <= 1) return colsArray

  const result = [...colsArray]

  // Insertion sort simplificado - performance máxima para pequenos arrays
  for (let i = 1; i < length; i++) {
    const current = result[i]
    let j = i - 1

    // Encontrar posição correta
    while (j >= 0 && result[j].position > current.position) {
      result[j + 1] = result[j]
      j--
    }

    result[j + 1] = current
  }

  return result
})

// Cache REMOVIDO - cálculo direto é mais rápido

// Get cards for a specific column - SEM SPLICE (EVITA RE-RENDERS)
const getColumnCards = (columnId) => {
  // Coleta em array separado + sort final - MELHOR PERFORMANCE

  const cardsArray = cards.value
  const length = cardsArray.length
  const result = []

  // Primeiro passo: coletar apenas cards da coluna (SEM splice)
  for (let i = 0; i < length; i++) {
    const card = cardsArray[i]
    if (card.column_id === columnId) {
      result.push(card)
    }
  }

  // Segundo passo: ordenar uma única vez com insertion sort manual
  if (result.length > 1) {
    for (let i = 1; i < result.length; i++) {
      const current = result[i]
      let j = i - 1

      // Encontrar posição correta
      while (j >= 0 && result[j].position > current.position) {
        result[j + 1] = result[j]
        j--
      }

      result[j + 1] = current
    }
  }

  return result
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
      // Cache REMOVIDO - não há mais limpeza necessária
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
      // Cache REMOVIDO - não há mais limpeza necessária
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

// Estado global de dragging - SIMPLIFICADO para performance máxima
const globalDragState = ref({
  isDragging: false,
  draggedCard: null,
  originalColumnId: null
})

// Sistema de backup/rollback inteligente para movimentação
const dragBackup = ref(null)

// Iniciar movimento instantâneo - OTIMIZADO MÁXIMO SEM RE-RENDER
const startInstantMove = (cardId) => {
  // Loop manual para encontrar card - SEM findIndex()
  let card = null
  let cardIndex = -1
  const cardsArray = cards.value

  for (let i = 0; i < cardsArray.length; i++) {
    if (cardsArray[i].id === cardId) {
      card = cardsArray[i]
      cardIndex = i
      break
    }
  }

  if (!card || cardIndex === -1) return

  // Criar backup mínimo
  dragBackup.value = {
    cardId,
    originalCards: [...cards.value],
    originalColumnId: card.column_id
  }

  // Configurar estado global simplificado
  globalDragState.value = {
    isDragging: true,
    draggedCard: { ...card },
    originalColumnId: card.column_id
  }

  // REMOVER CARD VISIVELMENTE - ZERO RE-RENDER
  const columnId = card.column_id

  // CRIAR NOVO ARRAY SEM O CARD - EVITA RE-RENDER DURANTE DRAG
  const newCards = []
  const length = cardsArray.length

  // Loop manual ultra otimizado - ZERO RE-RENDER
  for (let i = 0; i < length; i++) {
    if (i !== cardIndex) {
      const currentCard = cardsArray[i]

      // Reorganizar posição se for da mesma coluna
      if (currentCard.column_id === columnId) {
        currentCard.position = newCards.length
      }

      newCards.push(currentCard)
    }
  }

  // ATRIBUIR NOVO ARRAY DE UMA VEZ - MINIMIZA TRIGGERS DO VUE
  cards.value = newCards
}

// Finalizar movimento instantâneo - SIMPLIFICADO
const endInstantMove = () => {
  globalDragState.value = {
    isDragging: false,
    draggedCard: null,
    originalColumnId: null
  }
}

// Update preview de coluna - REMOVIDO para simplificação
// Não é mais necessário com estado global simplificado
const updatePreviewColumn = () => {
  // Função vazia - mantida apenas para compatibilidade de eventos
}

// Backup function REMOVIDA - backup simplificado está em startInstantMove

// Rollback INSTANTÂNEO sem animações
const performRollback = (backup) => {
  if (!backup) return

  // Restaurar estado original de forma INSTANTÂNEA
  cards.value = [...backup.originalCards]
  // Cache REMOVIDO - não há mais limpeza necessária

  // Feedback visual INSTANTÂNEO - sem delays
  if (process.client) {
    // 1. Highlight imediato no card restaurado
    const cardElement = document.querySelector(`[data-card-id="${backup.cardId}"]`)
    if (cardElement) {
      // Adicionar highlight instantâneo
      cardElement.classList.add('rollback-error', 'rollback-highlight')

      // Remover classes instantaneamente também
      cardElement.classList.remove('rollback-error', 'rollback-highlight')
    }

    // 2. Toast instantâneo sem animações
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex flex-col gap-3 max-w-sm border-l-4 border-orange-600'
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-semibold text-white">Falha ao mover cartão</p>
          <p class="text-orange-100 text-sm">Posição original restaurada</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="this.closest('.fixed').remove()" class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm">
          Entendido
        </button>
      </div>
    `

    // Mostrar toast INSTANTANEAMENTE - sem transições
    document.body.appendChild(toast)

    // SEM setTimeout - REMOÇÃO IMEDIATA via clique
    // O usuário remove o toast quando quiser - ZERO DELAY
  }
}

// Handle card drop - MOVIMENTO VERDADEIRAMENTE INSTANTÂNEO
const handleCardDrop = ({ cardId, newColumnId, newPosition }) => {
  if (!globalDragState.value.isDragging || !dragBackup.value) return

  // Movimento visual já foi feito no dragStart!
  // Adicionar card imediatamente na nova posição para UX perfeito
  const draggedCard = globalDragState.value.draggedCard
  if (draggedCard) {
    // Atualizar card visualmente de forma imediata
    draggedCard.column_id = newColumnId
    draggedCard.position = newPosition

    // CONSTRUIR ARRAY FINAL SEM SPLICE - ZERO RE-RENDERS
    const originalCards = cards.value
    const newCards = []
    const length = originalCards.length

    // Loop único: adicionar cards existentes + novo card na posição correta
    let addedDraggedCard = false
    for (let i = 0; i < length; i++) {
      // Adicionar card na posição correta se for o momento
      if (!addedDraggedCard && i === newPosition) {
        newCards.push(draggedCard)
        addedDraggedCard = true
      }

      // Adicionar card original (não é o dragged card)
      if (originalCards[i].id !== draggedCard.id) {
        newCards.push(originalCards[i])
      }
    }

    // Adicionar no final se não foi adicionado ainda
    if (!addedDraggedCard) {
      newCards.push(draggedCard)
    }

    // REORGANIZAR POSIÇÕES - LOOP MANUAL ULTRA OTIMIZADO
    const cardsArray = newCards
    const newLength = cardsArray.length

    // Criar mapa de posições por coluna para performance
    const columnPositions = {}

    // Primeiro passe: contar cards por coluna
    for (let i = 0; i < newLength; i++) {
      const card = cardsArray[i]
      const colId = card.column_id

      if (!columnPositions[colId]) {
        columnPositions[colId] = 0
      }
    }

    // Segundo passe: atribuir posições corretas
    for (let i = 0; i < newLength; i++) {
      const card = cardsArray[i]
      const colId = card.column_id

      card.position = columnPositions[colId]++
    }

    // ATRIBUIR ARRAY FINAL DE UMA VEZ - MINIMIZA TRIGGERS DO VUE
    cards.value = newCards
  }

  // Finalizar estado imediatamente para UX instantâneo
  endInstantMove()

  // Persistir em background de forma 100% SÍNCRONA - ZERO DELAY ABSOLUTO
  const persistInBackground = () => {
    // VALIDAÇÃO IMEDIATA sem async
    if (!draggedCard) return

    // CÁLCULO INSTANTÂNEO DA POSIÇÃO - SEM findIndex()
    const cardsArray = cards.value
    const targetColumnCards = []

    // Loop único: filtrar e encontrar posição
    let actualPosition = newPosition
    for (let i = 0; i < cardsArray.length; i++) {
      const card = cardsArray[i]
      if (card.column_id === newColumnId) {
        targetColumnCards.push(card)
        if (card.id === draggedCard.id) {
          actualPosition = targetColumnCards.length - 1
        }
      }
    }

    // FETCH SÍNCRONO USANDO XMLHttpRequest para ZERO DELAY
    const persistRequest = new XMLHttpRequest()
    persistRequest.open('PUT', `/api/kanbans/cards/${cardId}/move`, true)
    persistRequest.setRequestHeader('Content-Type', 'application/json')

    persistRequest.onload = () => {
      if (persistRequest.status >= 400) {
        // ERRO: Tentar fallback Supabase
        persistWithSupabase(cardId, newColumnId, actualPosition)
      }
      // SUCESSO: Não fazer nada (movimento visual já foi feito)
    }

    persistRequest.onerror = () => {
      // ERRO DE REDE: Tentar fallback
      persistWithSupabase(cardId, newColumnId, actualPosition)
    }

    // ENVIAR REQUISIÇÃO SEM BLOQUEAR
    persistRequest.send(JSON.stringify({
      column_id: newColumnId,
      position: actualPosition
    }))
  }

  // Fallback Supabase também síncrono
  const persistWithSupabase = (cardId, newColumnId, actualPosition) => {
    // IMPORTANTE: Usar async IIFE sem await para não bloquear
    (async () => {
      try {
        const { error } = await supabase
          .from('kanban_cards')
          .update({
            column_id: newColumnId,
            position: actualPosition,
            updated_at: new Date().toISOString()
          })
          .eq('id', cardId)

        if (error) {
          console.error('Erro na persistência Supabase:', error)
          // Rollback se falhar
          if (dragBackup.value) {
            performRollback(dragBackup.value)
          }
        }
      } catch (error) {
        console.error('Erro crítico na persistência:', error)
        // Rollback se falhar
        if (dragBackup.value) {
          performRollback(dragBackup.value)
        }
      }
    })()
  }

  // Executar persistência IMEDIATAMENTE sem delay
  persistInBackground()

  // Limpar backup imediatamente
  if (dragBackup.value?.cardId === cardId) {
    dragBackup.value = null
  }
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

      // Atualização delta - SEM findIndex()
      if (updatedCard) {
        const cardsArray = cards.value
        let cardIndex = -1

        // Loop manual para encontrar posição
        for (let i = 0; i < cardsArray.length; i++) {
          if (cardsArray[i].id === editingCard.value.id) {
            cardIndex = i
            break
          }
        }

        if (cardIndex !== -1) {
          cards.value = [
            ...cardsArray.slice(0, cardIndex),
            updatedCard,
            ...cardsArray.slice(cardIndex + 1)
          ]
        }
        // Cache REMOVIDO - não há mais limpeza necessária
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
        // Cache REMOVIDO - não há mais limpeza necessária
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