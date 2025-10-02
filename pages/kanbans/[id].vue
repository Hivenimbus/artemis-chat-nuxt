<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
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
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nova Coluna
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
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Erro ao carregar kanban</h3>
        <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
        <div class="mt-6">
          <button
            @click="navigateTo('/kanbans')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Voltar para Kanbans
          </button>
        </div>
      </div>

      <!-- Kanban Columns -->
      <div v-else class="flex space-x-6 overflow-x-auto pb-4">
        <div
          v-for="column in sortedColumns"
          :key="column.id"
          class="flex-shrink-0 w-80"
        >
          <KanbanColumn
            :column="column"
            :cards="getColumnCards(column.id)"
            @add-card="handleAddCard"
            @edit-card="handleEditCard"
            @delete-card="handleDeleteCard"
            @delete-column="handleDeleteColumn"
            @card-drop="handleCardDrop"
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
const route = useRoute()

// State
const kanban = ref(null)
const columns = ref([])
const cards = ref([])
const loading = ref(true)
const error = ref('')
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

// LocalStorage helpers
const loadKanbansFromStorage = () => {
  try {
    const stored = localStorage.getItem('kanbans')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading kanbans from storage:', error)
    return []
  }
}

const saveKanbansToStorage = (kanbansData) => {
  try {
    localStorage.setItem('kanbans', JSON.stringify(kanbansData))
  } catch (error) {
    console.error('Error saving kanbans to storage:', error)
  }
}

const loadCardsFromStorage = () => {
  try {
    const stored = localStorage.getItem('kanbanCards')
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error loading cards from storage:', error)
    return {}
  }
}

const saveCardsToStorage = (cardsData) => {
  try {
    localStorage.setItem('kanbanCards', JSON.stringify(cardsData))
  } catch (error) {
    console.error('Error saving cards to storage:', error)
  }
}

// Mock data for testing
const mockKanbanData = {
  'projeto-pessoal': {
    id: 'projeto-pessoal',
    title: 'Projetos Pessoais',
    description: 'Gerenciar tarefas e objetivos pessoais',
    columns: [
      { id: 'col-1', title: 'Para fazer', position: 0 },
      { id: 'col-2', title: 'Em andamento', position: 1 },
      { id: 'col-3', title: 'Concluído', position: 2 }
    ],
    color: 'bg-blue-500',
    cardCount: 12,
    completedCount: 8
  },
  'trabalho-artemis': {
    id: 'trabalho-artemis',
    title: 'Trabalho - Artemis',
    description: 'Kanban principal para projetos de trabalho',
    columns: [
      { id: 'col-4', title: 'Backlog', position: 0 },
      { id: 'col-5', title: 'Desenvolvimento', position: 1 },
      { id: 'col-6', title: 'Testes', position: 2 },
      { id: 'col-7', title: 'Deploy', position: 3 }
    ],
    color: 'bg-purple-500',
    cardCount: 24,
    completedCount: 15
  },
  'estudos-programacao': {
    id: 'estudos-programacao',
    title: 'Estudos - Programação',
    description: 'Planejamento de estudos e aprendizado em programação',
    columns: [
      { id: 'col-8', title: 'Para Estudar', position: 0 },
      { id: 'col-9', title: 'Estudando', position: 1 },
      { id: 'col-10', title: 'Praticando', position: 2 },
      { id: 'col-11', title: 'Revisado', position: 3 }
    ],
    color: 'bg-green-500',
    cardCount: 15,
    completedCount: 10
  },
  'financas-pessoais': {
    id: 'financas-pessoais',
    title: 'Finanças Pessoais',
    description: 'Gerenciamento financeiro e orçamento',
    columns: [
      { id: 'col-12', title: 'Planejar', position: 0 },
      { id: 'col-13', title: 'Executar', position: 1 },
      { id: 'col-14', title: 'Revisar', position: 2 }
    ],
    color: 'bg-indigo-500',
    cardCount: 6,
    completedCount: 2
  },
  'planejamento-viagem': {
    id: 'planejamento-viagem',
    title: 'Planejamento de Viagem',
    description: 'Organização de viagens e roteiros',
    columns: [
      { id: 'col-15', title: 'Pesquisar', position: 0 },
      { id: 'col-16', title: 'Reservar', position: 1 },
      { id: 'col-17', title: 'Preparar', position: 2 },
      { id: 'col-18', title: 'Viajar', position: 3 }
    ],
    color: 'bg-pink-500',
    cardCount: 10,
    completedCount: 7
  }
}

const mockCardsData = {
  'projeto-pessoal': [
    {
      id: 'card-1',
      kanban_id: 'projeto-pessoal',
      column_id: 'col-1',
      title: 'Fazer exercícios matinais',
      description: 'Começar rotina de exercícios todos os dias às 6h',
      position: 0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-2',
      kanban_id: 'projeto-pessoal',
      column_id: 'col-2',
      title: 'Ler livro de produtividade',
      description: 'Ler 30 páginas do livro "Hábitos Atômicos"',
      position: 0,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-3',
      kanban_id: 'projeto-pessoal',
      column_id: 'col-3',
      title: 'Organizar gavetas',
      description: 'Limpar e organizar todas as gavetas do quarto',
      position: 0,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  'trabalho-artemis': [
    {
      id: 'card-4',
      kanban_id: 'trabalho-artemis',
      column_id: 'col-4',
      title: 'Preparar apresentação',
      description: 'Criar slides para reunião semanal',
      position: 0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-5',
      kanban_id: 'trabalho-artemis',
      column_id: 'col-5',
      title: 'Revisar código',
      description: 'Fazer code review do pull request #123',
      position: 0,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-6',
      kanban_id: 'trabalho-artemis',
      column_id: 'col-6',
      title: 'Testar nova funcionalidade',
      description: 'Executar testes automatizados da nova feature',
      position: 0,
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-7',
      kanban_id: 'trabalho-artemis',
      column_id: 'col-7',
      title: 'Enviar relatório',
      description: 'Relatório mensal de progresso',
      position: 0,
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  'estudos-programacao': [
    {
      id: 'card-8',
      kanban_id: 'estudos-programacao',
      column_id: 'col-8',
      title: 'Curso de Vue.js',
      description: 'Completar módulo 3 do curso avançado',
      position: 0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-9',
      kanban_id: 'estudos-programacao',
      column_id: 'col-9',
      title: 'Praticar algoritmos',
      description: 'Resolver 5 exercícios no LeetCode',
      position: 0,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-10',
      kanban_id: 'estudos-programacao',
      column_id: 'col-11',
      title: 'Revisar padrões de projeto',
      description: 'Estudar Singleton e Factory patterns',
      position: 0,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  'financas-pessoais': [
    {
      id: 'card-11',
      kanban_id: 'financas-pessoais',
      column_id: 'col-12',
      title: 'Planejar orçamento mensal',
      description: 'Definir limites de gastos para cada categoria',
      position: 0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-12',
      kanban_id: 'financas-pessoais',
      column_id: 'col-13',
      title: 'Pagar contas do mês',
      description: 'Pagar faturas de cartão e contas fixas',
      position: 0,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  'planejamento-viagem': [
    {
      id: 'card-13',
      kanban_id: 'planejamento-viagem',
      column_id: 'col-15',
      title: 'Pesquisar destinos',
      description: 'Pesquisar lugares para férias de verão',
      position: 0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'card-14',
      kanban_id: 'planejamento-viagem',
      column_id: 'col-16',
      title: 'Reservar hotel',
      description: 'Comparar preços e reservar hospedagem',
      position: 0,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]
}

// Computed
const sortedColumns = computed(() => {
  return columns.value.sort((a, b) => a.position - b.position)
})

// Get cards for a specific column
const getColumnCards = (columnId) => {
  return cards.value
    .filter(card => card.column_id === columnId)
    .sort((a, b) => a.position - b.position)
}

// Load kanban data
const loadKanban = () => {
  try {
    loading.value = true
    error.value = ''

    // Try to load kanban from localStorage first
    let kanbansData = loadKanbansFromStorage()
    let kanbanData = kanbansData.find(k => k.id === route.params.id)

    // If not found in localStorage, try mock data
    if (!kanbanData && mockKanbanData[route.params.id]) {
      kanbanData = mockKanbanData[route.params.id]

      // Also save mock data to localStorage for consistency
      kanbansData.push(kanbanData)
      saveKanbansToStorage(kanbansData)
    }

    if (!kanbanData) {
      error.value = 'Kanban não encontrado'
      return
    }

    kanban.value = kanbanData
    columns.value = kanbanData.columns || []

    // Load cards from localStorage or mock data
    const allCards = loadCardsFromStorage()
    let kanbanCards = allCards[route.params.id]

    // If no cards in localStorage, try mock cards
    if (!kanbanCards && mockCardsData[route.params.id]) {
      kanbanCards = mockCardsData[route.params.id]

      // Save mock cards to localStorage
      allCards[route.params.id] = kanbanCards
      saveCardsToStorage(allCards)
    }

    cards.value = kanbanCards || []

    // If no columns exist, create default ones
    if (columns.value.length === 0) {
      createDefaultColumns()
    }
  } catch (error) {
    console.error('Error loading kanban:', error)
    error.value = 'Erro ao carregar kanban. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Create default columns
const createDefaultColumns = () => {
  try {
    const defaultColumns = [
      { id: `col-${Date.now()}-1`, title: 'A Fazer', position: 0 },
      { id: `col-${Date.now()}-2`, title: 'Fazendo', position: 1 },
      { id: `col-${Date.now()}-3`, title: 'Concluído', position: 2 }
    ]

    // Update kanban with default columns
    const kanbansData = loadKanbansFromStorage()
    const kanbanIndex = kanbansData.findIndex(k => k.id === route.params.id)

    if (kanbanIndex !== -1) {
      kanbansData[kanbanIndex].columns = defaultColumns
      saveKanbansToStorage(kanbansData)
      columns.value = defaultColumns
    }
  } catch (error) {
    console.error('Error creating default columns:', error)
  }
}

// Add column
const addColumn = () => {
  try {
    savingColumn.value = true

    const newColumn = {
      id: `col-${Date.now()}`,
      title: newColumnTitle.value,
      position: columns.value.length
    }

    // Update kanban with new column
    const kanbansData = loadKanbansFromStorage()
    const kanbanIndex = kanbansData.findIndex(k => k.id === route.params.id)

    if (kanbanIndex !== -1) {
      kanbansData[kanbanIndex].columns.push(newColumn)
      saveKanbansToStorage(kanbansData)
      columns.value.push(newColumn)
    }

    closeAddColumnModal()
  } catch (error) {
    console.error('Error adding column:', error)
    alert('Erro ao adicionar coluna. Tente novamente.')
  } finally {
    savingColumn.value = false
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

// Handle delete card
const handleDeleteCard = (cardId) => {
  if (!confirm('Tem certeza que deseja excluir este cartão?')) return

  try {
    // Remove card from localStorage
    const allCards = loadCardsFromStorage()
    const kanbanCards = allCards[route.params.id] || []
    const updatedCards = kanbanCards.filter(card => card.id !== cardId)

    allCards[route.params.id] = updatedCards
    saveCardsToStorage(allCards)

    // Update local state
    cards.value = updatedCards
  } catch (error) {
    console.error('Error deleting card:', error)
    alert('Erro ao excluir cartão. Tente novamente.')
  }
}

// Handle delete column
const handleDeleteColumn = (columnId) => {
  if (!confirm('Tem certeza que deseja excluir esta coluna? Todos os cartões nesta coluna também serão excluídos.')) return

  try {
    // Remove column from kanban
    const kanbansData = loadKanbansFromStorage()
    const kanbanIndex = kanbansData.findIndex(k => k.id === route.params.id)

    if (kanbanIndex !== -1) {
      kanbansData[kanbanIndex].columns = kanbansData[kanbanIndex].columns.filter(col => col.id !== columnId)
      saveKanbansToStorage(kanbansData)
      columns.value = kanbansData[kanbanIndex].columns
    }

    // Remove cards from this column
    const allCards = loadCardsFromStorage()
    const kanbanCards = allCards[route.params.id] || []
    const updatedCards = kanbanCards.filter(card => card.column_id !== columnId)

    allCards[route.params.id] = updatedCards
    saveCardsToStorage(allCards)
    cards.value = updatedCards
  } catch (error) {
    console.error('Error deleting column:', error)
    alert('Erro ao excluir coluna. Tente novamente.')
  }
}

// Handle card drop
const handleCardDrop = ({ cardId, newColumnId, newPosition }) => {
  try {
    // Update card in localStorage
    const allCards = loadCardsFromStorage()
    const kanbanCards = allCards[route.params.id] || []

    const updatedCards = kanbanCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          column_id: newColumnId,
          position: newPosition,
          updated_at: new Date().toISOString()
        }
      }
      return card
    })

    allCards[route.params.id] = updatedCards
    saveCardsToStorage(allCards)
    cards.value = updatedCards
  } catch (error) {
    console.error('Error moving card:', error)
    alert('Erro ao mover cartão. Tente novamente.')
  }
}

// Save card
const saveCard = () => {
  try {
    savingCard.value = true

    const allCards = loadCardsFromStorage()
    const kanbanCards = allCards[route.params.id] || []

    if (editingCard.value) {
      // Update existing card
      const updatedCards = kanbanCards.map(card => {
        if (card.id === editingCard.value.id) {
          return {
            ...card,
            title: cardForm.value.title,
            description: cardForm.value.description,
            updated_at: new Date().toISOString()
          }
        }
        return card
      })

      allCards[route.params.id] = updatedCards
      saveCardsToStorage(allCards)
      cards.value = updatedCards
    } else {
      // Create new card
      const maxPosition = Math.max(
        ...cards.value
          .filter(card => card.column_id === selectedColumnId.value)
          .map(card => card.position),
        -1
      )

      const newCard = {
        id: `card-${Date.now()}`,
        kanban_id: route.params.id,
        column_id: selectedColumnId.value,
        title: cardForm.value.title,
        description: cardForm.value.description,
        position: maxPosition + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      kanbanCards.push(newCard)
      allCards[route.params.id] = kanbanCards
      saveCardsToStorage(allCards)
      cards.value = kanbanCards
    }

    closeCardModal()
  } catch (error) {
    console.error('Error saving card:', error)
    alert('Erro ao salvar cartão. Tente novamente.')
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
const updateKanban = (title, description) => {
  try {
    // Update kanban in localStorage
    const kanbansData = loadKanbansFromStorage()
    const kanbanIndex = kanbansData.findIndex(k => k.id === route.params.id)

    if (kanbanIndex !== -1) {
      kanbansData[kanbanIndex] = {
        ...kanbansData[kanbanIndex],
        title,
        description,
        updated_at: new Date().toISOString()
      }
      saveKanbansToStorage(kanbansData)
      kanban.value.title = title
      kanban.value.description = description
    }
  } catch (error) {
    console.error('Error updating kanban:', error)
    alert('Erro ao atualizar kanban. Tente novamente.')
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