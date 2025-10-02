<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Kanban Board -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Kanban Columns -->
      <div class="flex space-x-6 overflow-x-auto pb-4">
        <div
          v-for="column in columns"
          :key="column.id"
          class="flex-shrink-0 w-80"
        >
          <KanbanColumn
            :column="column"
            :cards="getColumnCards(column.id)"
            @add-card="handleAddCard"
            @edit-card="handleEditCard"
            @delete-card="handleDeleteCard"
            @card-drop="handleCardDrop"
          />
        </div>
      </div>
    </div>

    <!-- Add/Edit Card Modal -->
    <div
      v-if="showCardModal"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background-color: rgba(0, 0, 0, 0.5);"
      @click.self="closeCardModal"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <form @submit.prevent="saveCard">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingCard ? 'Editar Tarefa' : 'Nova Tarefa' }}
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
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Título da tarefa"
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
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descrição da tarefa..."
                ></textarea>
              </div>

              <div>
                <label for="card-column" class="block text-sm font-medium text-gray-700">
                  Coluna
                </label>
                <select
                  id="card-column"
                  v-model="cardForm.columnId"
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option v-for="column in columns" :key="column.id" :value="column.id">
                    {{ column.title }}
                  </option>
                </select>
              </div>

              <div>
                <div class="flex items-center">
                  <input
                    id="card-urgent"
                    v-model="cardForm.isUrgent"
                    type="checkbox"
                    class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label for="card-urgent" class="ml-2 block text-sm text-gray-900">
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Marcar como urgente
                    </span>
                  </label>
                </div>
                <p class="mt-1 text-xs text-gray-500">
                  Tarefas urgentes terão prioridade visual no quadro
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              type="button"
              @click="closeCardModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="savingCard"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <span v-if="savingCard">Salvando...</span>
              <span v-else>{{ editingCard ? 'Atualizar' : 'Adicionar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// State local para o kanban
const columns = ref([
  { id: 'todo', title: 'Para Fazer', position: 0 },
  { id: 'doing', title: 'Fazendo', position: 1 },
  { id: 'done', title: 'Concluído', position: 2 }
])

const cards = ref([])
const showCardModal = ref(false)
const editingCard = ref(null)
const savingCard = ref(false)
const cardForm = ref({
  title: '',
  description: '',
  columnId: 'todo',
  isUrgent: false
})

// Get cards for a specific column
const getColumnCards = (columnId) => {
  return cards.value
    .filter(card => card.columnId === columnId)
    .sort((a, b) => a.position - b.position)
}

// Handle add card
const handleAddCard = (columnId) => {
  editingCard.value = null
  cardForm.value = {
    title: '',
    description: '',
    columnId: columnId,
    isUrgent: false
  }
  showCardModal.value = true
}

// Handle edit card
const handleEditCard = (card) => {
  editingCard.value = card
  cardForm.value = {
    title: card.title,
    description: card.description || '',
    columnId: card.columnId,
    isUrgent: card.isUrgent || false
  }
  showCardModal.value = true
}

// Handle delete card
const handleDeleteCard = async (cardId) => {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

  const cardIndex = cards.value.findIndex(card => card.id === cardId)
  if (cardIndex > -1) {
    cards.value.splice(cardIndex, 1)
    // Reposition remaining cards in the same column
    const deletedCardColumn = cards.value[cardIndex]?.columnId
    if (deletedCardColumn) {
      repositionCardsInColumn(deletedCardColumn)
    }
  }
}

// Handle card drop
const handleCardDrop = ({ cardId, newColumnId, newPosition }) => {
  const card = cards.value.find(c => c.id === cardId)
  if (card) {
    const oldColumnId = card.columnId
    card.columnId = newColumnId
    card.position = newPosition
    repositionCardsInColumn(newColumnId)
    if (oldColumnId !== newColumnId) {
      repositionCardsInColumn(oldColumnId)
    }
  }
}

// Reposition cards in a column
const repositionCardsInColumn = (columnId) => {
  const columnCards = cards.value
    .filter(card => card.columnId === columnId)
    .sort((a, b) => a.position - b.position)

  columnCards.forEach((card, index) => {
    card.position = index
  })
}

// Save card
const saveCard = async () => {
  try {
    savingCard.value = true

    if (editingCard.value) {
      // Update existing card
      editingCard.value.title = cardForm.value.title
      editingCard.value.description = cardForm.value.description
      editingCard.value.columnId = cardForm.value.columnId
      editingCard.value.isUrgent = cardForm.value.isUrgent
      editingCard.value.updated_at = new Date().toISOString()

      // Reposition if column changed
      if (editingCard.value.columnId !== cardForm.value.columnId) {
        repositionCardsInColumn(editingCard.value.columnId)
        repositionCardsInColumn(cardForm.value.columnId)
      }
    } else {
      // Create new card
      const maxPosition = Math.max(
        ...cards.value
          .filter(card => card.columnId === cardForm.value.columnId)
          .map(card => card.position),
        -1
      )

      const newCard = {
        id: Date.now().toString(), // Simple ID generation
        kanban_id: 'default',
        columnId: cardForm.value.columnId,
        title: cardForm.value.title,
        description: cardForm.value.description,
        isUrgent: cardForm.value.isUrgent,
        position: maxPosition + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      cards.value.push(newCard)
    }

    closeCardModal()
  } catch (error) {
    console.error('Error saving card:', error)
    alert('Erro ao salvar tarefa. Tente novamente.')
  } finally {
    savingCard.value = false
  }
}

// Close card modal
const closeCardModal = () => {
  showCardModal.value = false
  editingCard.value = null
  cardForm.value = {
    title: '',
    description: '',
    columnId: 'todo',
    isUrgent: false
  }
}

// Load some example cards on mount
onMounted(() => {
  // Add some example cards
  cards.value = [
    {
      id: '1',
      kanban_id: 'default',
      columnId: 'todo',
      title: 'Configurar projeto',
      description: 'Instalar dependências e configurar ambiente de desenvolvimento',
      isUrgent: true,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      kanban_id: 'default',
      columnId: 'todo',
      title: 'Criar layout inicial',
      description: 'Desenvolver estrutura básica das páginas',
      isUrgent: false,
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      kanban_id: 'default',
      columnId: 'doing',
      title: 'Implementar autenticação',
      description: 'Configurar sistema de login e registro de usuários',
      isUrgent: false,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      kanban_id: 'default',
      columnId: 'done',
      title: 'Definir requisitos',
      description: 'Levantar requisitos com o cliente',
      isUrgent: false,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
})

// Meta tags
useHead({
  title: 'Meu Kanban - Artemis',
  meta: [
    { name: 'description', content: 'Quadro kanban para organizar suas tarefas' }
  ]
})
</script>