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
              <li v-for="k in kanbans" :key="k.id" class="kan-menu__list-item">
                <div class="kan-menu__item" :class="{ 'kan-menu__item--active': k.id === currentKanbanId }">
                  <button class="kan-menu__item-button" @click="selectKanban(k.id)">
                    <span class="kan-menu__dot" :class="{ 'kan-menu__dot--active': k.id === currentKanbanId }"></span>
                    <span class="kan-menu__item-label">{{ k.title }}</span>
                  </button>
                  <div class="kan-menu__item-actions">
                    <button 
                      class="kan-menu__action-btn kan-menu__action-btn--edit"
                      @click.stop="editKanban(k)"
                      title="Editar kanban"
                      :aria-label="`Editar ${k.title}`"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      class="kan-menu__action-btn kan-menu__action-btn--delete"
                      @click.stop="deleteKanban(k.id)"
                      title="Apagar kanban"
                      :aria-label="`Apagar ${k.title}`"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
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
      <div class="board-columns-container" ref="boardColumnsContainerRef">
        <div class="board-columns" ref="boardColumnsRef">
          <div
            v-for="column in columns"
            :key="column.id"
            class="board-column-wrapper"
          >
            <KanbanColumn
              :column="column"
              :columns="columns"
              :cards="getColumnCards(column.id)"
              @add-card="handleAddCard"
              @edit-card="handleEditCard"
              @delete-card="handleDeleteCard"
              @card-moved="handleCardMoved"
              @move-card="handleMoveCard"
              @move-column="handleMoveColumn"
              @rename-column="handleRenameColumn"
              @delete-column="handleDeleteColumn"
              @update-column-icon="handleUpdateColumnIcon"
              @update-column-color="handleUpdateColumnColor"
            />
          </div>
        </div>
        <!-- Scroll indicators -->
        <button 
          v-if="showScrollIndicators" 
          class="scroll-indicator scroll-indicator-left" 
          :class="{ 'visible': canScrollLeft }"
          @click="scrollColumns('left')"
          :disabled="!canScrollLeft"
          aria-label="Rolar para esquerda"
          title="Ver colunas anteriores"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          v-if="showScrollIndicators" 
          class="scroll-indicator scroll-indicator-right" 
          :class="{ 'visible': canScrollRight }"
          @click="scrollColumns('right')"
          :disabled="!canScrollRight"
          aria-label="Rolar para direita"
          title="Ver próximas colunas"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Add New Column Button (Floating) -->
    <div class="add-column-floating">
      <button class="add-column-btn" @click="addNewColumn" :disabled="columns.length >= 6" title="Adicionar nova coluna" aria-label="Adicionar coluna">
        <svg class="add-column-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="add-column-text">Adicionar Coluna</span>
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
                    v-model="cardForm.column_id"
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
                      v-model="cardForm.is_urgent"
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

    <!-- Create Kanban Modal -->
    <Transition name="modal-fade">
      <div
        v-if="showKanbanModal"
        class="modal-overlay"
        @click.self="closeKanbanModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-modal-title"
      >
        <Transition name="modal-pop">
          <div
            v-if="showKanbanModal"
            class="modal-content modal-content--large"
            @click.stop
          >
            <form @submit.prevent="saveKanban">
              <div class="modal-header">
                <h3 id="kanban-modal-title" class="modal-title">
                  <svg class="modal-title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10m0-10a2 2 0 012 2h2a2 2 0 012-2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Criar Novo Kanban
                </h3>
              </div>

              <div class="modal-body">
                <!-- Kanban Name -->
                <div class="form-group">
                  <label for="kanban-name" class="form-label">
                    Nome do Kanban
                  </label>
                  <input
                    id="kanban-name"
                    v-model="kanbanForm.name"
                    type="text"
                    required
                    class="form-input"
                    placeholder="Ex: Projetos, Pessoal, Trabalho..."
                  />
                </div>

                <!-- Columns Section -->
                <div class="form-group">
                  <div class="form-label-with-action">
                    <label class="form-label">Colunas (máximo 6)</label>
                    <button
                      type="button"
                      @click="addColumnToForm"
                      :disabled="kanbanForm.columns.length >= 6"
                      class="btn-add-column"
                    >
                      <svg class="btn-add-column-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar coluna
                    </button>
                  </div>

                  <!-- Columns List -->
                  <div class="columns-list">
                    <div
                      v-for="(column, index) in kanbanForm.columns"
                      :key="index"
                      class="column-item"
                    >
                      <div class="column-item-number">{{ index + 1 }}</div>
                      <input
                        v-model="column.name"
                        type="text"
                        required
                        class="form-input column-item-input"
                        :placeholder="`Nome da coluna ${index + 1}`"
                      />
                      
                      <!-- Column Customization (Icon and Color) -->
                      <div class="column-customization">
                        <!-- Icon Dropdown -->
                        <div class="column-custom-dropdown-wrapper">
                          <button
                            type="button"
                            @click.stop="toggleIconDropdown(index)"
                            class="btn-column-custom btn-column-icon"
                            :aria-label="`Escolher ícone para coluna ${index + 1}`"
                            title="Escolher ícone"
                          >
                            <svg class="column-custom-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(column.icon)" />
                            </svg>
                          </button>
                          <div v-if="openIconDropdown === index" class="column-custom-dropdown">
                            <div
                              v-for="iconOption in iconOptions"
                              :key="iconOption.value"
                              @click="setColumnIcon(index, iconOption.value)"
                              class="column-custom-option"
                              :class="{ 'column-custom-option--active': column.icon === iconOption.value }"
                            >
                              <svg class="column-custom-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconOption.path" />
                              </svg>
                              <span>{{ iconOption.label }}</span>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Color Dropdown -->
                        <div class="column-custom-dropdown-wrapper">
                          <button
                            type="button"
                            @click.stop="toggleColorDropdown(index)"
                            class="btn-column-custom btn-column-color"
                            :style="{ backgroundColor: getColorData(column.color).hex }"
                            :aria-label="`Escolher cor para coluna ${index + 1}`"
                            title="Escolher cor"
                          >
                          </button>
                          <div v-if="openColorDropdown === index" class="column-custom-dropdown">
                            <div
                              v-for="colorOption in colorOptions"
                              :key="colorOption.value"
                              @click="setColumnColor(index, colorOption.value)"
                              class="column-custom-option"
                              :class="{ 'column-custom-option--active': column.color === colorOption.value }"
                            >
                              <div class="column-color-preview" :style="{ backgroundColor: colorOption.hex }"></div>
                              <span>{{ colorOption.label }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Move Up/Down Buttons -->
                      <div class="column-item-actions">
                        <button
                          type="button"
                          @click="moveColumnUp(index)"
                          :disabled="index === 0"
                          class="btn-move-column btn-move-column--up"
                          :aria-label="`Mover coluna ${index + 1} para cima`"
                          title="Mover para cima"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          @click="moveColumnDown(index)"
                          :disabled="index === kanbanForm.columns.length - 1"
                          class="btn-move-column btn-move-column--down"
                          :aria-label="`Mover coluna ${index + 1} para baixo`"
                          title="Mover para baixo"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        @click="removeColumnFromForm(index)"
                        :disabled="kanbanForm.columns.length <= 1"
                        class="btn-remove-column"
                        :aria-label="`Remover coluna ${index + 1}`"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p class="form-helper-text">
                    Você poderá adicionar, renomear ou remover colunas depois.
                  </p>
                </div>
              </div>

              <div class="modal-footer">
                <button
                  type="button"
                  @click="closeKanbanModal"
                  class="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="savingKanban || !kanbanForm.name.trim() || kanbanForm.columns.length === 0"
                  class="btn btn-primary"
                >
                  <span v-if="savingKanban">Criando...</span>
                  <span v-else>Criar Kanban</span>
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>

  <!-- Sistema de Notificações -->
  <div class="notifications-container">
    <TransitionGroup name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification',
          `notification--${notification.type}`,
          {
            'notification--syncing': notification.syncing
          }
        ]"
      >
        <div class="notification__content">
          <div class="notification__icon">
            <svg v-if="notification.type === 'success'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="notification.type === 'error'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else-if="notification.type === 'warning'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="notification__message">
            {{ notification.message }}
          </div>
          <div v-if="notification.syncing" class="notification__sync">
            <div class="notification__spinner"></div>
          </div>
          <button
            @click="removeNotification(notification.id)"
            class="notification__close"
            aria-label="Fechar notificação"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const { userData } = useUser()

// State para o kanban
const columns = ref([])
const kanbans = ref([])
const currentKanbanId = ref(null)
const showKanbanMenu = ref(false)
const loading = ref(true)
const error = ref('')

// Sistema de notificações e rollback
const notifications = ref([])
const syncStatus = ref({}) // Para tracking de operações em background

// Função de notificação
const showNotification = (message, type = 'info') => {
  const id = Date.now()
  notifications.value.push({
    id,
    message,
    type,
    timestamp: new Date()
  })

  // Auto-remove após 3 segundos para success, 5 para erros
  setTimeout(() => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }, type === 'success' ? 3000 : 5000)
}

// Função de rollback otimista
const rollbackOptimisticUpdate = (originalData, targetRef) => {
  if (Array.isArray(originalData)) {
    targetRef.value.splice(0, targetRef.value.length, ...originalData)
  } else if (typeof originalData === 'object') {
    Object.assign(targetRef.value, originalData)
  }
}

// Remover notificação manualmente
const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Scroll indicators state
const boardColumnsContainerRef = ref(null)
const boardColumnsRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const showScrollIndicators = ref(false)

// Scroll columns function - scroll by 3 columns at a time
const scrollColumns = (direction) => {
  const el = boardColumnsRef.value
  if (!el) return

  const columnsToScroll = 3
  // Measure an actual column width for accuracy
  const sampleCol = el.querySelector('.board-column-wrapper')
  const columnWidth = sampleCol ? Math.round(sampleCol.getBoundingClientRect().width) : 320
  // Read computed gap between flex items (columnGap works with flex too)
  const styles = window.getComputedStyle(el)
  const gapPx = parseFloat(styles.columnGap || styles.gap) || 24

  const scrollDistance = (columnWidth * columnsToScroll) + (gapPx * (columnsToScroll - 1))
  const scrollAmount = direction === 'left' ? -scrollDistance : scrollDistance

  el.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  })
}

const cards = ref([])
const showCardModal = ref(false)
const editingCard = ref(null)
const savingCard = ref(false)
const cardForm = ref({
  title: '',
  description: '',
  column_id: null,
  is_urgent: false
})

// Kanban modal state
const showKanbanModal = ref(false)
const savingKanban = ref(false)
const kanbanForm = ref({
  name: '',
  columns: [
    { name: 'Para Fazer', icon: 'clipboard', color: 'blue' },
    { name: 'Fazendo', icon: 'clock', color: 'yellow' },
    { name: 'Concluído', icon: 'check', color: 'green' }
  ]
})

const currentKanbanName = computed(() => kanbans.value.find(k => k.id === currentKanbanId.value)?.title || 'Selecionar Kanban')
const toggleKanbanMenu = () => { showKanbanMenu.value = !showKanbanMenu.value }
const selectKanban = (id) => {
  currentKanbanId.value = id;
  showKanbanMenu.value = false;
  loadKanbanData();
}

// Carregar kanbans do usuário
const loadKanbans = async () => {
  try {
    const { data, error } = await supabase
      .from('kanbans')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    kanbans.value = data || []

    // Selecionar primeiro kanban se não houver nenhum selecionado
    if (!currentKanbanId.value && kanbans.value.length > 0) {
      currentKanbanId.value = kanbans.value[0].id
      await loadKanbanData()
    }
  } catch (error) {
    console.error('Error loading kanbans:', error)
    error.value = 'Erro ao carregar kanbans'
    showNotification('Erro ao carregar seus kanbans. Tente recarregar a página.', 'error')
  }
}

// Carregar dados do kanban atual
const loadKanbanData = async () => {
  if (!currentKanbanId.value) return

  try {
    loading.value = true

    // Carregar colunas
    const { data: columnsData, error: columnsError } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('kanban_id', currentKanbanId.value)
      .order('position', { ascending: true })

    if (columnsError) throw columnsError
    columns.value = columnsData || []

    // Carregar cards
    const { data: cardsData, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('kanban_id', currentKanbanId.value)
      .order('position', { ascending: true })

    if (cardsError) throw cardsError
    cards.value = cardsData || []

  } catch (error) {
    console.error('Error loading kanban data:', error)
    error.value = 'Erro ao carregar dados do kanban'
  } finally {
    loading.value = false
  }
}

// Edit kanban
const editKanban = async (kanban) => {
  const newName = prompt('Novo nome do kanban:', kanban.title)
  if (newName && newName.trim() && newName.trim() !== kanban.title) {
    try {
      const { error } = await supabase
        .from('kanbans')
        .update({
          title: newName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', kanban.id)

      if (error) throw error

      kanban.title = newName.trim()
    } catch (error) {
      console.error('Error updating kanban:', error)
      showNotification('Erro ao atualizar kanban. Tente novamente.', 'error')
    }
  }
}

// Delete kanban
const deleteKanban = async (kanbanId) => {
  const kanban = kanbans.value.find(k => k.id === kanbanId)
  if (!kanban) return

  if (kanbans.value.length <= 1) {
    showNotification('Você não pode excluir o último kanban.', 'warning')
    return
  }

  if (!confirm(`Tem certeza que deseja excluir o kanban "${kanban.title}"? Todos os cartões serão perdidos.`)) {
    return
  }

  try {
    const { error } = await supabase
      .from('kanbans')
      .delete()
      .eq('id', kanbanId)

    if (error) throw error

    // Remove kanban from local state
    const index = kanbans.value.findIndex(k => k.id === kanbanId)
    if (index > -1) {
      kanbans.value.splice(index, 1)
    }

    // If current kanban was deleted, switch to first available
    if (currentKanbanId.value === kanbanId) {
      currentKanbanId.value = kanbans.value[0]?.id || null
      if (currentKanbanId.value) {
        await loadKanbanData()
      }
    }

    showKanbanMenu.value = false
  } catch (error) {
    console.error('Error deleting kanban:', error)
    showNotification('Erro ao excluir kanban. Tente novamente.', 'error')
  }
}

// Open kanban modal
const createNewKanban = () => {
  showKanbanMenu.value = false
  showKanbanModal.value = true
}

// Add column to form
const addColumnToForm = () => {
  if (kanbanForm.value.columns.length < 6) {
    kanbanForm.value.columns.push({ name: '', icon: 'clipboard', color: 'blue' })
  }
}

// Remove column from form
const removeColumnFromForm = (index) => {
  if (kanbanForm.value.columns.length > 1) {
    kanbanForm.value.columns.splice(index, 1)
  }
}

// Move column up in form
const moveColumnUp = (index) => {
  if (index > 0) {
    const cols = kanbanForm.value.columns
    ;[cols[index - 1], cols[index]] = [cols[index], cols[index - 1]]
  }
}

// Move column down in form
const moveColumnDown = (index) => {
  const cols = kanbanForm.value.columns
  if (index < cols.length - 1) {
    ;[cols[index], cols[index + 1]] = [cols[index + 1], cols[index]]
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
  { value: 'blue', rgb500: '59 130 246', rgb400: '96 165 250', label: 'Azul', hex: '#3B82F6' },
  { value: 'yellow', rgb500: '245 158 11', rgb400: '251 191 36', label: 'Amarelo', hex: '#F59E0B' },
  { value: 'green', rgb500: '16 185 129', rgb400: '52 211 153', label: 'Verde', hex: '#10B981' },
  { value: 'red', rgb500: '239 68 68', rgb400: '252 165 165', label: 'Vermelho', hex: '#EF4444' }
]

// State for dropdowns
const openIconDropdown = ref(null)
const openColorDropdown = ref(null)

// Toggle icon dropdown
const toggleIconDropdown = (index) => {
  openIconDropdown.value = openIconDropdown.value === index ? null : index
  openColorDropdown.value = null
}

// Toggle color dropdown
const toggleColorDropdown = (index) => {
  openColorDropdown.value = openColorDropdown.value === index ? null : index
  openIconDropdown.value = null
}

// Set column icon
const setColumnIcon = (index, icon) => {
  kanbanForm.value.columns[index].icon = icon
  openIconDropdown.value = null
}

// Set column color
const setColumnColor = (index, color) => {
  kanbanForm.value.columns[index].color = color
  openColorDropdown.value = null
}

// Get icon path by value
const getIconPath = (iconValue) => {
  return iconOptions.find(i => i.value === iconValue)?.path || iconOptions[0].path
}

// Get color data by value
const getColorData = (colorValue) => {
  return colorOptions.find(c => c.value === colorValue) || colorOptions[0]
}

// Save kanban
const saveKanban = async () => {
  try {
    savingKanban.value = true

    if (!userData.value?.empresa_id) {
      throw new Error('Usuário não vinculado a uma empresa')
    }

    // Create new kanban
    const { data: newKanban, error: kanbanError } = await supabase
      .from('kanbans')
      .insert({
        title: kanbanForm.value.name.trim(),
        description: null,
        empresa_id: userData.value.empresa_id,
        created_by: userData.value.id
      })
      .select()
      .single()

    if (kanbanError) throw kanbanError

    // Create columns for this kanban
    const columnsToCreate = kanbanForm.value.columns
      .filter(col => col.name.trim())
      .map((col, index) => ({
        kanban_id: newKanban.id,
        title: col.name.trim(),
        icon: col.icon,
        color: col.color,
        position: index
      }))

    if (columnsToCreate.length > 0) {
      const { error: columnsError } = await supabase
        .from('kanban_columns')
        .insert(columnsToCreate)

      if (columnsError) throw columnsError
    }

    // Add to local state
    kanbans.value.push(newKanban)

    // Switch to new kanban
    currentKanbanId.value = newKanban.id
    await loadKanbanData()

    closeKanbanModal()
  } catch (error) {
    console.error('Error creating kanban:', error)
    showNotification('Erro ao criar kanban. Tente novamente.', 'error')
  } finally {
    savingKanban.value = false
  }
}

// Close kanban modal
const closeKanbanModal = () => {
  showKanbanModal.value = false
  kanbanForm.value = {
    name: '',
    columns: [
      { name: 'Para Fazer', icon: 'clipboard', color: 'blue' },
      { name: 'Fazendo', icon: 'clock', color: 'yellow' },
      { name: 'Concluído', icon: 'check', color: 'green' }
    ]
  }
}

// Column management functions
const addNewColumn = async () => {
  if (columns.value.length >= 6) {
    showNotification('Limite de 6 colunas por kanban alcançado.', 'warning')
    return
  }

  const title = prompt('Nome da nova coluna:')
  if (!title || !title.trim()) return

  try {
    const { data: newColumn, error } = await supabase
      .from('kanban_columns')
      .insert({
        kanban_id: currentKanbanId.value,
        title: title.trim(),
        icon: 'clipboard',
        color: 'blue',
        position: columns.value.length
      })
      .select()
      .single()

    if (error) throw error

    columns.value.push(newColumn)

    // Scroll to the new column after DOM update
    nextTick(() => {
      const boardColumns = boardColumnsRef.value
      if (boardColumns) {
        boardColumns.scrollTo({
          left: boardColumns.scrollWidth,
          behavior: 'smooth'
        })
      }
    })
  } catch (error) {
    console.error('Error adding column:', error)
    showNotification('Erro ao adicionar coluna. Tente novamente.', 'error')
  }
}

const handleRenameColumn = async ({ columnId, newTitle }) => {
  try {
    const { error } = await supabase
      .from('kanban_columns')
      .update({
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', columnId)

    if (error) throw error

    const column = columns.value.find(c => c.id === columnId)
    if (column) {
      column.title = newTitle
    }
  } catch (error) {
    console.error('Error renaming column:', error)
    showNotification('Erro ao renomear coluna. Tente novamente.', 'error')
  }
}

const handleUpdateColumnIcon = async ({ columnId, icon }) => {
  try {
    const { error } = await supabase
      .from('kanban_columns')
      .update({
        icon: icon,
        updated_at: new Date().toISOString()
      })
      .eq('id', columnId)

    if (error) throw error

    const column = columns.value.find(c => c.id === columnId)
    if (column) {
      column.icon = icon
    }
  } catch (error) {
    console.error('Error updating column icon:', error)
  }
}

const handleUpdateColumnColor = async ({ columnId, color }) => {
  try {
    const { error } = await supabase
      .from('kanban_columns')
      .update({
        color: color,
        updated_at: new Date().toISOString()
      })
      .eq('id', columnId)

    if (error) throw error

    const column = columns.value.find(c => c.id === columnId)
    if (column) {
      column.color = color
    }
  } catch (error) {
    console.error('Error updating column color:', error)
  }
}

// Handle move column
const handleMoveColumn = async ({ columnId, direction }) => {
  const currentIndex = columns.value.findIndex(c => c.id === columnId)
  if (currentIndex === -1) return

  const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1

  // Check bounds
  if (newIndex < 0 || newIndex >= columns.value.length) return

  try {
    // Swap columns
    const columnsCopy = [...columns.value]
    const temp = columnsCopy[currentIndex]
    columnsCopy[currentIndex] = columnsCopy[newIndex]
    columnsCopy[newIndex] = temp

    // Update positions in database
    const updates = columnsCopy.map((col, index) => ({
      id: col.id,
      position: index
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('kanban_columns')
        .update({
          position: update.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)

      if (error) throw error
    }

    // Update positions in local state
    columnsCopy.forEach((col, index) => {
      col.position = index
    })

    columns.value = columnsCopy
  } catch (error) {
    console.error('Error moving column:', error)
    showNotification('Erro ao mover coluna. Tente novamente.', 'error')
  }
}

const handleDeleteColumn = async (columnId) => {
  if (!confirm('Tem certeza que deseja excluir esta coluna? Todos os cartões nesta coluna também serão excluídos.')) {
    return
  }

  try {
    // Move cards to first column before deleting
    const firstColumn = columns.value.find(c => c.id !== columnId)
    if (firstColumn) {
      const { error: moveError } = await supabase
        .from('kanban_cards')
        .update({
          column_id: firstColumn.id,
          updated_at: new Date().toISOString()
        })
        .eq('column_id', columnId)

      if (moveError) throw moveError
    }

    // Delete the column
    const { error } = await supabase
      .from('kanban_columns')
      .delete()
      .eq('id', columnId)

    if (error) throw error

    // Remove from local state
    const columnIndex = columns.value.findIndex(c => c.id === columnId)
    if (columnIndex > -1) {
      columns.value.splice(columnIndex, 1)
    }

    // Update positions of remaining columns
    const updates = columns.value.map((col, index) => ({
      id: col.id,
      position: index
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('kanban_columns')
        .update({
          position: update.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)

      if (error) throw error
    }

    // Reload data to update cards
    await loadKanbanData()
  } catch (error) {
    console.error('Error deleting column:', error)
    showNotification('Erro ao excluir coluna. Tente novamente.', 'error')
  }
}

// Get cards for a specific column in current kanban
const getColumnCards = (columnId) => {
  return cards.value
    .filter(card => card.kanban_id === currentKanbanId.value && card.column_id === columnId)
    .sort((a, b) => a.position - b.position)
}

// Handle add card com atualização otimista
const handleAddCard = (columnId) => {
  editingCard.value = null
  cardForm.value = {
    title: '',
    description: '',
    column_id: columnId,
    is_urgent: false
  }
  showCardModal.value = true
}

// Handle edit card com atualização otimista
const handleEditCard = (card) => {
  editingCard.value = card
  cardForm.value = {
    title: card.title,
    description: card.description || '',
    column_id: card.column_id,
    is_urgent: card.is_urgent || false
  }
  showCardModal.value = true
}

// Handle delete card com atualização otimista
const handleDeleteCard = async (cardId) => {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

  // Encontrar card para rollback
  const cardIndex = cards.value.findIndex(card => card.id === cardId)
  const cardToDelete = cardIndex > -1 ? cards.value[cardIndex] : null

  if (!cardToDelete) return

  // Atualização otimista: remover imediatamente da UI
  const deletedCardColumn = cardToDelete.column_id
  cards.value.splice(cardIndex, 1)

  try {
    // Sincronizar com banco em background
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', cardId)

    if (error) throw error

    // Reposition remaining cards in the same column
    await repositionCardsInColumn(deletedCardColumn)
  } catch (error) {
    console.error('Error deleting card:', error)
    // Rollback: restaurar card na UI
    cards.value.splice(cardIndex, 0, cardToDelete)
    showNotification('Erro ao excluir tarefa. Tente novamente.', 'error')
  }
}


// Handle card moved between columns com atualização otimista
const handleCardMoved = async (moveData) => {
  const { cardId, fromColumnId, toColumnId, newIndex } = moveData

  // Basic validation
  if (!cardId || !toColumnId) return

  // Encontrar card para rollback
  const targetCard = cards.value.find(c => c.id === cardId)
  if (!targetCard) return

  // Salvar estado original para rollback
  const originalState = {
    column_id: targetCard.column_id,
    position: targetCard.position
  }

  try {
    // Atualização otimista: atualizar UI imediatamente
    const oldColumnId = targetCard.column_id
    targetCard.column_id = toColumnId
    targetCard.position = newIndex !== undefined ? newIndex : 0

    // Sincronizar com banco em background
    const { error } = await supabase
      .from('kanban_cards')
      .update({
        column_id: toColumnId,
        position: newIndex !== undefined ? newIndex : 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)

    if (error) throw error

    // Reposition cards in both columns
    await repositionCardsInColumn(oldColumnId)
    await repositionCardsInColumn(toColumnId)
  } catch (error) {
    console.error('Error moving card:', error)
    // Rollback: restaurar estado original
    targetCard.column_id = originalState.column_id
    targetCard.position = originalState.position
    showNotification('Erro ao mover tarefa. Tente novamente.', 'error')
  }
}

// Handle move card via dropdown com atualização otimista
const handleMoveCard = async (moveData) => {
  // Suporte para diferentes formatos do evento
  let cardId, fromColumnId, toColumnId

  if (moveData.cardId) {
    // Formato completo com objeto
    cardId = moveData.cardId
    fromColumnId = moveData.fromColumnId
    toColumnId = moveData.toColumnId
  } else {
    // Formato simples (compatibilidade com KanbanCard.vue)
    cardId = moveData
    const card = cards.value.find(c => c.id === cardId)
    if (!card) return
    fromColumnId = card.column_id
    toColumnId = moveData
  }

  if (fromColumnId === toColumnId) return

  // Encontrar card para rollback
  const card = cards.value.find(c => c.id === cardId)
  if (!card) return

  // Salvar estado original
  const originalState = {
    column_id: card.column_id,
    position: card.position
  }

  try {
    // Calculate new position (end of target column)
    const targetColumnCards = cards.value.filter(c =>
      c.kanban_id === currentKanbanId.value && c.column_id === toColumnId
    )
    const newPosition = targetColumnCards.length

    // Atualização otimista: mover visualmente imediatamente
    const oldColumnId = card.column_id
    card.column_id = toColumnId
    card.position = newPosition

    // Sincronizar com banco em background
    const { error } = await supabase
      .from('kanban_cards')
      .update({
        column_id: toColumnId,
        position: newPosition,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)

    if (error) throw error

    // Reposition cards in both columns
    await repositionCardsInColumn(oldColumnId)
    await repositionCardsInColumn(toColumnId)
  } catch (error) {
    console.error('Error moving card:', error)
    // Rollback: restaurar estado original
    card.column_id = originalState.column_id
    card.position = originalState.position
    showNotification('Erro ao mover tarefa. Tente novamente.', 'error')
  }
}

// Reposition cards in a column
const repositionCardsInColumn = async (columnId) => {
  try {
    const columnCards = cards.value
      .filter(card => card.kanban_id === currentKanbanId.value && card.column_id === columnId)
      .sort((a, b) => a.position - b.position)

    // Update positions
    const updates = columnCards.map((card, index) => ({
      id: card.id,
      position: index
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('kanban_cards')
        .update({
          position: update.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)

      if (error) throw error
    }

    // Update local state
    columnCards.forEach((card, index) => {
      card.position = index
      card.updated_at = new Date().toISOString()
    })
  } catch (error) {
    console.error('Error repositioning cards:', error)
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
          column_id: cardForm.value.column_id,
          is_urgent: cardForm.value.is_urgent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCard.value.id)

      if (error) throw error

      // Update local state
      editingCard.value.title = cardForm.value.title
      editingCard.value.description = cardForm.value.description
      editingCard.value.column_id = cardForm.value.column_id
      editingCard.value.is_urgent = cardForm.value.is_urgent
      editingCard.value.updated_at = new Date().toISOString()

      // Reposition if column changed
      if (editingCard.value.column_id !== cardForm.value.column_id) {
        await repositionCardsInColumn(editingCard.value.column_id)
        await repositionCardsInColumn(cardForm.value.column_id)
      }
    } else {
      // Create new card
      const maxPosition = Math.max(
        ...cards.value
          .filter(card => card.kanban_id === currentKanbanId.value && card.column_id === cardForm.value.column_id)
          .map(card => card.position),
        -1
      )

      const { data: newCard, error } = await supabase
        .from('kanban_cards')
        .insert({
          kanban_id: currentKanbanId.value,
          column_id: cardForm.value.column_id,
          title: cardForm.value.title,
          description: cardForm.value.description,
          is_urgent: cardForm.value.is_urgent,
          position: maxPosition + 1
        })
        .select()
        .single()

      if (error) throw error

      cards.value.push(newCard)
    }

    closeCardModal()
  } catch (error) {
    console.error('Error saving card:', error)
    showNotification('Erro ao salvar tarefa. Tente novamente.', 'error')
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
    column_id: null,
    is_urgent: false
  }
}

// Carregar dados iniciais
onMounted(async () => {
  await loadKanbans()

  // Set up scroll indicators listeners
  const el = boardColumnsRef.value
  const container = boardColumnsContainerRef.value
  if (el && container) {
    const updateScrollState = () => {
      canScrollLeft.value = el.scrollLeft > 0
      canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      // Show indicators only if content overflows (mais de 3 colunas ~ 320px cada)
      showScrollIndicators.value = el.scrollWidth > el.clientWidth + 10

      // Limit viewport to show only first 3 columns when at start and more than 3 columns
      const sampleCol = el.querySelector('.board-column-wrapper')
      const colWidth = sampleCol ? Math.round(sampleCol.getBoundingClientRect().width) : 320
      const styles = window.getComputedStyle(el)
      const gapPx = parseFloat(styles.columnGap || styles.gap) || 24
      const columnsToShow = 3
      const desiredWidth = (colWidth * columnsToShow) + (gapPx * (columnsToShow - 1))
      const hasMoreThanThree = columns.value.length > 3
      const atStart = el.scrollLeft <= 0
      if (hasMoreThanThree && atStart) {
        container.style.maxWidth = desiredWidth + 'px'
        container.style.marginInline = 'auto'
      } else {
        container.style.maxWidth = ''
        container.style.marginInline = ''
      }
    }

    updateScrollState()
    el.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)
    // Cleanup on unmount
    onBeforeUnmount(() => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      document.removeEventListener('click', closeDropdowns)
    })
  }

  // Close dropdowns when clicking outside
  const closeDropdowns = (event) => {
    if (!event.target.closest('.column-custom-dropdown-wrapper')) {
      openIconDropdown.value = null
      openColorDropdown.value = null
    }
  }
  document.addEventListener('click', closeDropdowns)
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

/* Board Columns Container */
.board-columns-container {
  position: relative;
  width: 100%;
}

/* Board Columns - Horizontal Scroll Layout */
.board-columns {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 1rem;
  scroll-behavior: smooth;
  /* Custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

/* Webkit scrollbar styling */
.board-columns::-webkit-scrollbar {
  height: 8px;
}

.board-columns::-webkit-scrollbar-track {
  background: rgba(244, 246, 250, 0.5);
  border-radius: 4px;
}

.board-columns::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
  transition: background 150ms ease;
}

.board-columns::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

.board-column-wrapper {
  flex: 0 0 320px;
  min-width: 320px;
  max-width: 320px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .board-columns {
    gap: 1rem;
  }
  
  .board-column-wrapper {
    flex: 0 0 280px;
    min-width: 280px;
    max-width: 280px;
  }
}

@media (max-width: 640px) {
  .board-column-wrapper {
    flex: 0 0 260px;
    min-width: 260px;
    max-width: 260px;
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

/* Modal Content Large */
.modal-content--large {
  max-width: 42rem;
}

/* Form Label with Action */
.form-label-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

/* Button Add Column */
.btn-add-column {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(59, 130, 246);
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
}

.btn-add-column:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.btn-add-column:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add-column-icon {
  width: 1rem;
  height: 1rem;
}

/* Columns List */
.columns-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(244, 246, 250, 0.5);
  border: 1px solid rgba(156, 163, 175, 0.2);
  border-radius: 12px;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
}

.column-item:hover {
  background: rgba(244, 246, 250, 0.8);
  border-color: rgba(156, 163, 175, 0.3);
}

.column-item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, rgb(59, 130, 246), rgb(96, 165, 250));
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.column-item-input {
  flex: 1;
  margin: 0 !important;
}

.column-item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.btn-move-column {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 1.625rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgb(156, 163, 175);
  cursor: pointer;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
  flex-shrink: 0;
}

.btn-move-column:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  transform: scale(1.1);
}

.btn-move-column:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-move-column svg {
  width: 1.125rem;
  height: 1.125rem;
}

.btn-remove-column {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgb(156, 163, 175);
  cursor: pointer;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
  flex-shrink: 0;
}

.btn-remove-column:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
  transform: scale(1.1);
}

.btn-remove-column:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-remove-column svg {
  width: 1.25rem;
  height: 1.25rem;
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

  .modal-content--large {
    max-width: 100%;
  }

  .column-item {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .column-item-number {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }

  .column-item-actions {
    gap: 0.125rem;
  }

  .btn-move-column {
    width: 1.75rem;
    height: 1.5rem;
  }

  .btn-move-column svg {
    width: 1rem;
    height: 1rem;
  }

  .btn-add-column {
    font-size: 0.75rem;
    padding: 0.375rem 0.625rem;
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
.kan-menu__list-item { position: relative; }
.kan-menu__item { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .5rem .5rem; border-radius: 10px; border: 1px solid transparent; background: transparent; transition: all 120ms ease-out; }
.kan-menu__item:hover { background: rgba(59,130,246,.06); border-color: rgba(59,130,246,.15); }
.kan-menu__item--active { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.3); }
.kan-menu__item-button { display: flex; align-items: center; gap: .5rem; flex: 1; background: transparent; border: none; color: #111827; cursor: pointer; padding: 0; text-align: left; }
.kan-menu__dot { width: .5rem; height: .5rem; border-radius: 9999px; background: #D1D5DB; flex-shrink: 0; }
.kan-menu__dot--active { background: #3B82F6; }
.kan-menu__item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kan-menu__item-actions { display: flex; gap: .25rem; opacity: 0; transition: opacity 150ms ease; flex-shrink: 0; }
.kan-menu__item:hover .kan-menu__item-actions { opacity: 1; }
.kan-menu__action-btn { display: inline-flex; align-items: center; justify-content: center; width: 1.75rem; height: 1.75rem; padding: 0; border: none; border-radius: 6px; background: transparent; cursor: pointer; transition: all 120ms ease-out; }
.kan-menu__action-btn svg { width: .875rem; height: .875rem; }
.kan-menu__action-btn--edit { color: #6B7280; }
.kan-menu__action-btn--edit:hover { background: rgba(59,130,246,.1); color: #3B82F6; }
.kan-menu__action-btn--delete { color: #6B7280; }
.kan-menu__action-btn--delete:hover { background: rgba(239,68,68,.1); color: #EF4444; }
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
  height: 48px;
  padding: 0 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border-radius: 24px;
  border: 1px solid rgba(156, 163, 175, 0.35);
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245, 247, 255, 0.95));
  color: rgb(59, 130, 246);
  box-shadow: 0 10px 25px rgba(30, 41, 59, 0.12);
  transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
  cursor: pointer;
  white-space: nowrap;
}

.add-column-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.1);
}

.add-column-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(30, 41, 59, 0.16);
  background: linear-gradient(135deg, #EFF6FF, #FFFFFF);
}

.add-column-btn:active:not(:disabled) {
  transform: translateY(0);
}

.add-column-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 16px 40px rgba(30, 41, 59, 0.16);
}

.add-column-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.add-column-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(59, 130, 246);
  transition: color var(--dur-fast) var(--ease-out);
}

.add-column-btn:hover:not(:disabled) .add-column-text {
  color: rgb(37, 99, 235);
}

.add-column-btn:disabled .add-column-text {
  color: rgba(59, 130, 246, 0.6);
}

/* Scroll Indicators */
.scroll-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), transparent);
  border: none;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms var(--ease-out), background 200ms var(--ease-out);
  z-index: 10;
}

.scroll-indicator.visible {
  opacity: 1;
  pointer-events: auto;
}

.scroll-indicator:disabled {
  cursor: not-allowed;
  opacity: 0 !important;
  pointer-events: none;
}

.scroll-indicator-left {
  left: 0;
  padding-right: 10px;
  background: linear-gradient(90deg, rgba(244, 246, 250, 0.95) 60%, transparent);
}

.scroll-indicator-right {
  right: 0;
  padding-left: 10px;
  background: linear-gradient(270deg, rgba(244, 246, 250, 0.95) 60%, transparent);
}

.scroll-indicator:hover:not(:disabled) {
  background: linear-gradient(90deg, rgba(244, 246, 250, 1) 70%, transparent);
}

.scroll-indicator-right:hover:not(:disabled) {
  background: linear-gradient(270deg, rgba(244, 246, 250, 1) 70%, transparent);
}

.scroll-indicator svg {
  width: 28px;
  height: 28px;
  color: rgb(59, 130, 246);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 150ms var(--ease-out), color 150ms var(--ease-out);
}

.scroll-indicator:hover:not(:disabled) svg {
  color: rgb(37, 99, 235);
  transform: scale(1.1);
}

.scroll-indicator:active:not(:disabled) svg {
  transform: scale(0.95);
}

.scroll-indicator-left:hover:not(:disabled) svg {
  animation: none;
  transform: translateX(-3px) scale(1.1);
}

.scroll-indicator-right:hover:not(:disabled) svg {
  animation: none;
  transform: translateX(3px) scale(1.1);
}

@keyframes bounce-left {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-4px);
  }
}

@keyframes bounce-right {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(4px);
  }
}

/* Responsive adjustments for floating button and scroll indicators */
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

  /* Hide scroll indicators on mobile - touch scrolling is more intuitive */
  .scroll-indicator {
    display: none;
  }
}

/* Sistema de Notificações */
.notifications-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
  max-width: 400px;
}

.notification {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  margin-bottom: 0.75rem;
  pointer-events: all;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 250ms cubic-bezier(.22, 1, .36, 1);
  transform-origin: top right;
}

.notification--success {
  border-left: 4px solid #10b981;
}

.notification--error {
  border-left: 4px solid #ef4444;
}

.notification--warning {
  border-left: 4px solid #f59e0b;
}

.notification--info {
  border-left: 4px solid #3b82f6;
}

.notification--syncing {
  opacity: 0.8;
  border-left: 4px solid #6b7280;
}

.notification__content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
}

.notification__icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.notification--success .notification__icon {
  color: #10b981;
}

.notification--error .notification__icon {
  color: #ef4444;
}

.notification--warning .notification__icon {
  color: #f59e0b;
}

.notification--info .notification__icon {
  color: #3b82f6;
}

.notification--syncing .notification__icon {
  color: #6b7280;
}

.notification__message {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
}

.notification__sync {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.notification__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #6b7280;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.notification__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: #9ca3af;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
  margin: -0.25rem;
  padding: 0;
}

.notification__close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

.notification__close svg {
  width: 1rem;
  height: 1rem;
}

/* Transições de notificação */
.notification-enter-active {
  transition: all 250ms cubic-bezier(.22, 1, .36, 1);
}

.notification-leave-active {
  transition: all 200ms cubic-bezier(.5, 0, .75, 0);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notification-move {
  transition: transform 250ms cubic-bezier(.22, 1, .36, 1);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive para notificações */
@media (max-width: 640px) {
  .notifications-container {
    top: auto;
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }

  .notification {
    transform-origin: bottom center;
  }

  .notification-enter-from {
    transform: translateY(100%) scale(0.9);
  }

  .notification-leave-to {
    transform: translateY(100%) scale(0.95);
  }
}

/* Column Customization */
.column-customization {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.column-custom-dropdown-wrapper {
  position: relative;
}

.btn-column-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 150ms cubic-bezier(.22, 1, .36, 1);
  flex-shrink: 0;
}

.btn-column-custom:hover {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: scale(1.05);
}

.btn-column-icon {
  color: rgb(75, 85, 99);
}

.btn-column-color {
  border-width: 2px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.column-custom-icon {
  width: 1.25rem;
  height: 1.25rem;
  overflow: visible;
}

.column-custom-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.375rem;
  min-width: 160px;
  background: white;
  border: 1px solid rgba(156, 163, 175, 0.2);
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(30, 41, 59, 0.15);
  padding: 0.375rem;
  z-index: 100;
}

.column-custom-option {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 120ms ease-out;
  font-size: 0.875rem;
  color: rgb(17, 24, 39);
}

.column-custom-option:hover {
  background: rgba(59, 130, 246, 0.08);
}

.column-custom-option--active {
  background: rgba(59, 130, 246, 0.12);
  font-weight: 600;
}

.column-custom-option-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(75, 85, 99);
  flex-shrink: 0;
  overflow: visible;
}

.column-color-preview {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.column-item {
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .column-customization {
    gap: 0.375rem;
  }
  
  .btn-column-custom {
    width: 2rem;
    height: 2rem;
  }
  
  .column-custom-icon {
    width: 1rem;
    height: 1rem;
  }
}

</style>
