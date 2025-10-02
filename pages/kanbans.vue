<template>
  <div class="board-bg min-h-screen">
    <!-- Kanban Board -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Kanban Columns -->
      <div class="board-columns">
        <div
          v-for="column in columns"
          :key="column.id"
          class="board-column-wrapper"
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
    <Transition name="modal-fade">
      <div
        v-if="showCardModal"
        class="modal-overlay"
        @click.self="closeCardModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <Transition name="modal-pop">
          <div
            v-if="showCardModal"
            class="modal-content"
            @click.stop
          >
            <form @submit.prevent="saveCard">
              <div class="modal-header">
                <h3 id="modal-title" class="modal-title">
                  <svg class="modal-title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ editingCard ? 'Editar Tarefa' : 'Nova Tarefa' }}
                </h3>
              </div>

              <div class="modal-body">
                <div class="form-group">
                  <label for="card-title" class="form-label">
                    Título
                  </label>
                  <input
                    id="card-title"
                    v-model="cardForm.title"
                    type="text"
                    required
                    class="form-input"
                    placeholder="Título da tarefa"
                  />
                </div>

                <div class="form-group">
                  <label for="card-description" class="form-label">
                    Descrição (opcional)
                  </label>
                  <textarea
                    id="card-description"
                    v-model="cardForm.description"
                    rows="4"
                    class="form-input form-textarea"
                    placeholder="Descrição da tarefa..."
                  ></textarea>
                </div>

                <div class="form-group">
                  <label for="card-column" class="form-label">
                    Coluna
                  </label>
                  <select
                    id="card-column"
                    v-model="cardForm.columnId"
                    class="form-input form-select"
                  >
                    <option v-for="column in columns" :key="column.id" :value="column.id">
                      {{ column.title }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <div class="form-checkbox-wrapper">
                    <input
                      id="card-urgent"
                      v-model="cardForm.isUrgent"
                      type="checkbox"
                      class="form-checkbox"
                    />
                    <label for="card-urgent" class="form-checkbox-label">
                      <span class="flex items-center">
                        <svg class="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Marcar como urgente
                      </span>
                    </label>
                  </div>
                  <p class="form-helper-text">
                    Tarefas urgentes terão prioridade visual no quadro
                  </p>
                </div>
              </div>

              <div class="modal-footer">
                <button
                  type="button"
                  @click="closeCardModal"
                  class="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="savingCard"
                  class="btn btn-primary"
                >
                  <span v-if="savingCard">Salvando...</span>
                  <span v-else>{{ editingCard ? 'Atualizar' : 'Adicionar' }}</span>
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
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

<style scoped>
/* CSS Tokens - Scoped to Kanban page only */
.board-bg {
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

  --danger-500: 239 68 68;
  --danger-400: 252 165 165;

  --radius-xs: 8px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;

  --shadow-1: 0 6px 18px rgba(0,0,0,.08);
  --shadow-2: 0 12px 28px rgba(0,0,0,.12);
  --shadow-3: 0 18px 34px rgba(0,0,0,.16);

  --elev-1: 0 10px 25px rgba(30, 41, 59, .08);
  --elev-2: 0 16px 40px rgba(30, 41, 59, .12);

  --dur-fast: 150ms;
  --dur-med: 250ms;
  --dur-slow: 400ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-in: cubic-bezier(.5, 0, .75, 0);
}

/* Transitions - Scoped */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 250ms cubic-bezier(.22, 1, .36, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-pop-enter-active {
  transition: transform 250ms cubic-bezier(.22, 1, .36, 1), opacity 250ms cubic-bezier(.22, 1, .36, 1);
}

.modal-pop-enter-from {
  transform: scale(0.98) translateY(8px);
  opacity: 0;
}

.modal-pop-leave-active {
  transition: transform 150ms cubic-bezier(.5, 0, .75, 0), opacity 150ms cubic-bezier(.5, 0, .75, 0);
}

.modal-pop-leave-to {
  transform: scale(0.96);
  opacity: 0;
}

.list-move {
  transition: transform 250ms cubic-bezier(.22, 1, .36, 1);
}

/* Board Background */
.board-bg {
  background: 
    radial-gradient(1200px 800px at 10% -10%, rgba(59,130,246,.10), transparent),
    radial-gradient(1200px 800px at 110% 10%, rgba(16,185,129,.10), transparent),
    linear-gradient(180deg, rgb(var(--bg-0)) 0%, rgb(250, 250, 255) 100%);
  position: relative;
}

.board-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.4;
  pointer-events: none;
}

/* Board Columns */
.board-columns {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.board-columns::-webkit-scrollbar {
  height: 8px;
}

.board-columns::-webkit-scrollbar-track {
  background: transparent;
}

.board-columns::-webkit-scrollbar-thumb {
  background: rgba(var(--txt-3), 0.3);
  border-radius: 4px;
}

.board-columns::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--txt-3), 0.5);
}

.board-column-wrapper {
  flex-shrink: 0;
  width: 20rem;
  scroll-snap-align: start;
}

@media (min-width: 640px) {
  .board-column-wrapper {
    width: 22rem;
  }
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 1rem;
}

/* Modal Content */
.modal-content {
  background: rgb(255, 255, 255);
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(30, 41, 59, 0.12);
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(156, 163, 175, 0.1);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(156, 163, 175, 0.1);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(17, 24, 39);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-title-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: rgb(59, 130, 246);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: rgba(244, 246, 250, 0.3);
  border-top: 1px solid rgba(156, 163, 175, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-radius: 0 0 20px 20px;
}

/* Form Elements */
.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 12px;
  font-size: 0.875rem;
  color: rgb(17, 24, 39);
  background: rgb(255, 255, 255);
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
}

.form-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 6rem;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

.form-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 2px solid rgba(156, 163, 175, 0.3);
  cursor: pointer;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
}

.form-checkbox:checked {
  background: linear-gradient(135deg, rgb(239, 68, 68), rgb(252, 165, 165));
  border-color: rgb(239, 68, 68);
}

.form-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-checkbox-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(17, 24, 39);
  cursor: pointer;
}

.form-helper-text {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: rgb(75, 85, 99);
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, rgb(59, 130, 246), rgb(96, 165, 250));
  color: white;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: rgb(255, 255, 255);
  color: rgb(17, 24, 39);
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(244, 246, 250, 0.5);
  border-color: rgba(75, 85, 99, 0.4);
}

/* Responsive */
@media (max-width: 640px) {
  .board-column-wrapper {
    width: 18rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }
}
</style>
