<template>
  <div class="board-bg min-h-screen">
    <!-- Kanban Board -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <!-- Top-right Kanban selector -->
      <div class="kan-menu">
        <button class="kan-menu__button" @click="toggleKanbanMenu" :aria-expanded="showKanbanMenu ? 'true' : 'false'">
          <span class="kan-menu__label">{{ currentKanbanName }}</span>
          <svg class="kan-menu__chev" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <!-- Backdrop to close -->
        <div v-if="showKanbanMenu" class="kan-menu__backdrop" @click="showKanbanMenu=false"></div>
        <!-- Dropdown -->
        <div v-if="showKanbanMenu" class="kan-menu__dropdown" role="menu">
          <div class="kan-menu__section">
            <div class="kan-menu__section-title">Meus Kanbans</div>
            <ul class="kan-menu__list">
              <li v-for="k in kanbans" :key="k.id">
                <button class="kan-menu__item" :class="{ 'kan-menu__item--active': k.id === currentKanbanId }" @click="selectKanban(k.id)">
                  <span class="kan-menu__dot" :class="{ 'kan-menu__dot--active': k.id === currentKanbanId }"></span>
                  <span class="kan-menu__item-label">{{ k.name }}</span>
                </button>
              </li>
            </ul>
          </div>
          <div class="kan-menu__divider"></div>
          <div class="kan-menu__section">
            <button class="kan-menu__create" @click="createNewKanban">
              <svg class="kan-menu__create-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Criar novo kanban
            </button>
          </div>
        </div>
      </div>
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
            @rename-column="handleRenameColumn"
            @delete-column="handleDeleteColumn"
          />
        </div>
      </div>
    </div>

    <!-- Add New Column Button (Floating) -->
    <div class="add-column-floating">
      <button class="add-column-btn" @click="addNewColumn" title="Adicionar nova coluna" aria-label="Adicionar coluna">
        <svg class="add-column-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
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

const kanbans = ref([
  { id: 'default', name: 'Kanban Padrão' },
  { id: 'work', name: 'Projetos' }
])
const currentKanbanId = ref('default')
const showKanbanMenu = ref(false)

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

const currentKanbanName = computed(() => kanbans.value.find(k => k.id === currentKanbanId.value)?.name || 'Selecionar Kanban')
const toggleKanbanMenu = () => { showKanbanMenu.value = !showKanbanMenu.value }
const selectKanban = (id) => { currentKanbanId.value = id; showKanbanMenu.value = false }
const createNewKanban = () => {
  const name = prompt('Nome do novo kanban:')
  if (!name) return
  const id = `k_${Date.now()}`
  kanbans.value.push({ id, name })
  currentKanbanId.value = id
  // Opcional: adicionar alguns cards exemplo nesse kanban
  const now = new Date().toISOString()
  cards.value.push({ id: `${Date.now()}_1`, kanban_id: id, columnId: 'todo', title: 'Novo kanban criado', description: 'Comece adicionando tarefas', isUrgent: false, position: 0, created_at: now, updated_at: now })
}

// Column management functions
const addNewColumn = () => {
  const title = prompt('Nome da nova coluna:')
  if (!title || !title.trim()) return
  
  const newColumn = {
    id: `col_${Date.now()}`,
    title: title.trim(),
    position: columns.value.length
  }
  columns.value.push(newColumn)
}

const handleRenameColumn = ({ columnId, newTitle }) => {
  const column = columns.value.find(c => c.id === columnId)
  if (column) {
    column.title = newTitle
  }
}

const handleDeleteColumn = (columnId) => {
  // Move all cards from deleted column to 'todo'
  cards.value.forEach(card => {
    if (card.columnId === columnId) {
      card.columnId = 'todo'
      // Reposition in todo column
      const todoCards = cards.value.filter(c => c.columnId === 'todo')
      card.position = todoCards.length
    }
  })
  
  // Remove the column
  const columnIndex = columns.value.findIndex(c => c.id === columnId)
  if (columnIndex > -1) {
    columns.value.splice(columnIndex, 1)
  }
  
  // Reposition cards in todo column
  repositionCardsInColumn('todo')
}

// Get cards for a specific column in current kanban
const getColumnCards = (columnId) => {
  return cards.value
    .filter(card => card.kanban_id === currentKanbanId.value && card.columnId === columnId)
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
  if (!card) return

  const oldColumnId = card.columnId
  const oldPosition = card.position

  // Moving to a different column
  if (oldColumnId !== newColumnId) {
    card.columnId = newColumnId
    card.position = newPosition
    repositionCardsInColumn(oldColumnId)
    repositionCardsInColumn(newColumnId)
  } 
  // Moving within the same column
  else {
    // Get all cards in the same column except the dragged one
    const columnCards = cards.value
      .filter(c => c.columnId === oldColumnId && c.id !== cardId)
      .sort((a, b) => a.position - b.position)

    // Insert the card at the new position
    columnCards.splice(newPosition, 0, card)

    // Update positions for all cards
    columnCards.forEach((c, index) => {
      c.position = index
    })
  }
}

// Reposition cards in a column for current kanban
const repositionCardsInColumn = (columnId) => {
  const columnCards = cards.value
    .filter(card => card.kanban_id === currentKanbanId.value && card.columnId === columnId)
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
          .filter(card => card.kanban_id === currentKanbanId.value && card.columnId === cardForm.value.columnId)
          .map(card => card.position),
        -1
      )

      const newCard = {
        id: Date.now().toString(), // Simple ID generation
        kanban_id: currentKanbanId.value,
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
  // Add example cards for another kanban (work)
  cards.value.push(
    { id: 'w1', kanban_id: 'work', columnId: 'todo', title: 'Planejar sprint', description: 'Definir escopo da sprint', isUrgent: false, position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'w2', kanban_id: 'work', columnId: 'doing', title: 'Revisar PRs', description: 'Revisão dos pull requests abertos', isUrgent: false, position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'w3', kanban_id: 'work', columnId: 'done', title: 'Reunião diária', description: 'Daily standup concluída', isUrgent: false, position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  )
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* Responsive grid adjustments */
@media (min-width: 768px) {
  .board-columns {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}

@media (min-width: 1024px) {
  .board-columns {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
}

/* Limit maximum columns per row */
@media (min-width: 1280px) {
  .board-columns {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    max-width: none;
  }
}

.board-column-wrapper {
  min-width: 0; /* Permite que o conteúdo encolha */
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
  .board-columns {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }
}
/* Kanban selector menu */
.kan-menu { position: fixed; top: 4.5rem; right: 2rem; z-index: 30; }
.kan-menu__button { display: inline-flex; align-items: center; gap: .5rem; padding: .375rem .625rem; background: rgba(255,255,255,.8); border: 1px solid rgba(156,163,175,.3); border-radius: 10px; box-shadow: 0 6px 20px rgba(30,41,59,.08); color: #111827; font-weight: 600; transition: all 150ms cubic-bezier(.22,1,.36,1); font-size: .875rem; }
.kan-menu__button:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(30,41,59,.12); }
.kan-menu__label { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kan-menu__chev { width: 1rem; height: 1rem; color: #6B7280; }
.kan-menu__backdrop { position: fixed; inset: 0; z-index: 29; }
.kan-menu__dropdown { position: absolute; right: 0; margin-top: .5rem; width: 280px; background: #fff; border: 1px solid rgba(156,163,175,.2); border-radius: 12px; box-shadow: 0 16px 40px rgba(30,41,59,.16); padding: .5rem; z-index: 31; }
.kan-menu__section { padding: .25rem .25rem; }
.kan-menu__section-title { font-size: .75rem; color: #6B7280; font-weight: 700; padding: .25rem .5rem .5rem; text-transform: uppercase; letter-spacing: .04em; }
.kan-menu__list { list-style: none; margin: 0; padding: 0; max-height: 300px; overflow: auto; }
.kan-menu__item { width: 100%; display: flex; align-items: center; gap: .5rem; padding: .5rem .5rem; border-radius: 10px; border: 1px solid transparent; background: transparent; color: #111827; cursor: pointer; transition: all 120ms ease-out; }
.kan-menu__item:hover { background: rgba(59,130,246,.06); border-color: rgba(59,130,246,.15); }
.kan-menu__item--active { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.3); }
.kan-menu__dot { width: .5rem; height: .5rem; border-radius: 9999px; background: #D1D5DB; }
.kan-menu__dot--active { background: #3B82F6; }
.kan-menu__item-label { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kan-menu__divider { height: 1px; background: rgba(156,163,175,.2); margin: .25rem .25rem; }
.kan-menu__create { width: 100%; display: inline-flex; align-items: center; gap: .5rem; padding: .5rem; border-radius: 10px; border: 1px solid rgba(156,163,175,.25); background: linear-gradient(135deg, #EFF6FF, #FFFFFF); cursor: pointer; color: #1F2937; font-weight: 600; }
.kan-menu__create:hover { background: linear-gradient(135deg, #DBEAFE, #FFFFFF); }
.kan-menu__create-icon { width: 1rem; height: 1rem; color: #3B82F6; }

/* Add Column Floating Button */
.add-column-floating {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  z-index: 40;
}

.add-column-btn {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(156, 163, 175, 0.35);
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245, 247, 255, 0.95));
  color: rgb(59, 130, 246);
  box-shadow: 0 10px 25px rgba(30, 41, 59, 0.12);
  transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
  cursor: pointer;
}

.add-column-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(30, 41, 59, 0.16);
  background: linear-gradient(135deg, #EFF6FF, #FFFFFF);
}

.add-column-btn:active {
  transform: translateY(0);
}

.add-column-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 16px 40px rgba(30, 41, 59, 0.16);
}

.add-column-icon {
  width: 20px;
  height: 20px;
}

/* Responsive adjustments for floating button */
@media (max-width: 640px) {
  .add-column-floating {
    right: 1rem;
    bottom: 1rem;
  }
  
  .add-column-btn {
    width: 48px;
    height: 48px;
  }
  
  .add-column-icon {
    width: 22px;
    height: 22px;
  }
}

</style>
