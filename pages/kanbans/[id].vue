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
// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
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
const loadKanban = async () => {
  try {
    loading.value = true
    error.value = ''

    // Load kanban
    const { data: kanbanData, error: kanbanError } = await supabase
      .from('kanbans')
      .select('*')
      .eq('id', route.params.id)
      .eq('user_id', user.value.id)
      .single()

    if (kanbanError) {
      if (kanbanError.code === 'PGRST116') {
        error.value = 'Kanban não encontrado'
      } else {
        throw kanbanError
      }
      return
    }

    kanban.value = kanbanData

    // Load columns
    const { data: columnsData, error: columnsError } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('kanban_id', route.params.id)
      .order('position', { ascending: true })

    if (columnsError) throw columnsError
    columns.value = columnsData || []

    // Load cards
    const { data: cardsData, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('kanban_id', route.params.id)
      .order('position', { ascending: true })

    if (cardsError) throw cardsError
    cards.value = cardsData || []

    // If no columns exist, create default ones
    if (columns.value.length === 0) {
      await createDefaultColumns()
    }
  } catch (error) {
    console.error('Error loading kanban:', error)
    error.value = 'Erro ao carregar kanban. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Create default columns
const createDefaultColumns = async () => {
  try {
    const defaultColumns = [
      { title: 'A Fazer', position: 0 },
      { title: 'Fazendo', position: 1 },
      { title: 'Concluído', position: 2 }
    ]

    for (const column of defaultColumns) {
      const { error } = await supabase
        .from('kanban_columns')
        .insert({
          kanban_id: route.params.id,
          title: column.title,
          position: column.position
        })

      if (error) throw error
    }

    // Reload columns
    const { data } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('kanban_id', route.params.id)
      .order('position', { ascending: true })

    columns.value = data || []
  } catch (error) {
    console.error('Error creating default columns:', error)
  }
}

// Add column
const addColumn = async () => {
  try {
    savingColumn.value = true

    const { error } = await supabase
      .from('kanban_columns')
      .insert({
        kanban_id: route.params.id,
        title: newColumnTitle.value,
        position: columns.value.length
      })

    if (error) throw error

    closeAddColumnModal()
    await loadKanban()
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
const handleDeleteCard = async (cardId) => {
  if (!confirm('Tem certeza que deseja excluir este cartão?')) return

  try {
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', cardId)

    if (error) throw error
    await loadKanban()
  } catch (error) {
    console.error('Error deleting card:', error)
    alert('Erro ao excluir cartão. Tente novamente.')
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

// Handle card drop
const handleCardDrop = async ({ cardId, newColumnId, newPosition }) => {
  try {
    const { error } = await supabase
      .from('kanban_cards')
      .update({
        column_id: newColumnId,
        position: newPosition,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)

    if (error) throw error
    await loadKanban()
  } catch (error) {
    console.error('Error moving card:', error)
    alert('Erro ao mover cartão. Tente novamente.')
  }
}

// Save card
const saveCard = async () => {
  try {
    savingCard.value = true

    if (editingCard.value) {
      // Update existing card
      const { error } = await supabase
        .from('kanban_cards')
        .update({
          title: cardForm.value.title,
          description: cardForm.value.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCard.value.id)

      if (error) throw error
    } else {
      // Create new card
      const maxPosition = Math.max(
        ...cards.value
          .filter(card => card.column_id === selectedColumnId.value)
          .map(card => card.position),
        -1
      )

      const { error } = await supabase
        .from('kanban_cards')
        .insert({
          kanban_id: route.params.id,
          column_id: selectedColumnId.value,
          title: cardForm.value.title,
          description: cardForm.value.description,
          position: maxPosition + 1
        })

      if (error) throw error
    }

    closeCardModal()
    await loadKanban()
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
const updateKanban = async (title, description) => {
  try {
    const { error } = await supabase
      .from('kanbans')
      .update({
        title,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', route.params.id)

    if (error) throw error
    kanban.value.title = title
    kanban.value.description = description
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