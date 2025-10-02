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
    <Teleport to="body">
      <div v-if="showCardModal" class="fixed z-50 inset-0 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeCardModal"></div>
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form @submit.prevent="saveCard">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
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
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
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
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
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
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                    >
                      <option v-for="column in columns" :key="column.id" :value="column.id">
                        {{ column.title }}
                      </option>
                    </select>
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
  columnId: 'todo'
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
    columnId: columnId
  }
  showCardModal.value = true
}

// Handle edit card
const handleEditCard = (card) => {
  editingCard.value = card
  cardForm.value = {
    title: card.title,
    description: card.description || '',
    columnId: card.columnId
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
    columnId: 'todo'
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