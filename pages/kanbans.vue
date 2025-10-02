<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
            <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-full">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Empty State - Centralizado -->
      <div v-else-if="kanbans.length === 0" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-4h.01M9 16h.01" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum kanban encontrado</h3>
          <p class="mt-1 text-sm text-gray-500">
            Comece criando seu primeiro quadro kanban.
          </p>
          <div class="mt-6">
            <button
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Criar Kanban
            </button>
          </div>
        </div>
      </div>

      <!-- Kanbans Grid -->
      <div v-else class="flex-1 overflow-y-auto py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start relative">
        <div
          v-for="kanban in kanbans"
          :key="kanban.id"
          class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
          @click="navigateToKanban(kanban.id)"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div class="flex space-x-2">
                <button
                  @click.stop="editKanban(kanban)"
                  class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click.stop="deleteKanban(kanban.id)"
                  class="text-red-400 hover:text-red-600 transition-colors duration-200"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">{{ kanban.title }}</h3>
            <p class="text-sm text-gray-500 mb-4">{{ kanban.description || 'Sem descrição' }}</p>
            <div class="flex items-center text-sm text-gray-500">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ formatDate(kanban.created_at) }}
            </div>
          </div>
        </div>

        <!-- Floating Action Button -->
        <button
          @click="showCreateModal = true"
          class="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-40 group"
          title="Criar novo kanban"
        >
          <svg class="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Criar Novo Kanban
          </span>
        </button>
      </div>
    </div>

      <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed z-[9999] inset-0 flex items-center justify-center p-4">
        <!-- Background overlay -->
        <div class="fixed inset-0 backdrop-blur-[2px] bg-white/10 transition-opacity" @click="closeModal"></div>

        <!-- Modal panel -->
        <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <form @submit.prevent="saveKanban">
            <div class="px-6 py-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ editingKanban ? 'Editar Kanban' : 'Criar Novo Kanban' }}
                </h3>
                <button
                  type="button"
                  @click="closeModal"
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="space-y-4">
                <div>
                  <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    id="title"
                    v-model="form.title"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ex: Meu Projeto Kanban"
                  />
                </div>
                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    id="description"
                    v-model="form.description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Descreva o propósito deste kanban..."
                  ></textarea>
                </div>

                <!-- Colunas Section -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Colunas *
                  </label>
                  <div class="space-y-2">
                    <div v-for="(column, index) in form.columns" :key="column.id" class="flex items-center space-x-2">
                      <div class="flex-1 relative">
                        <input
                          v-model="column.title"
                          type="text"
                          required
                          class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          :placeholder="`Coluna ${index + 1}`"
                        />
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                          {{ index + 1 }}
                        </span>
                      </div>
                      <button
                        type="button"
                        @click="removeColumn(column.id)"
                        :disabled="form.columns.length <= 1"
                        class="p-2 text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                        title="Remover coluna"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Botão Adicionar Coluna -->
                  <button
                    type="button"
                    @click="addColumn"
                    :disabled="form.columns.length >= 6"
                    class="mt-3 w-full px-3 py-2 border border-dashed rounded-md text-sm flex items-center justify-center transition-colors duration-200"
                    :class="[
                      form.columns.length >= 6
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50'
                    ]"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span v-if="form.columns.length >= 6">Máximo de 6 colunas atingido</span>
                    <span v-else>Adicionar Coluna ({{ form.columns.length }}/6)</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="saving || !form.title.trim()"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="saving" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </span>
                <span v-else>{{ editingKanban ? 'Atualizar' : 'Criar' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// State
const kanbans = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const editingKanban = ref(null)
const saving = ref(false)
const form = ref({
  title: '',
  description: '',
  columns: [
    { id: Date.now() + 1, title: 'Para fazer' },
    { id: Date.now() + 2, title: 'Fazendo' },
    { id: Date.now() + 3, title: 'Concluído' }
  ]
})

// Gerenciar colunas
const addColumn = () => {
  if (form.value.columns.length < 6) {
    form.value.columns.push({
      id: Date.now(),
      title: ''
    })
  } else {
    alert('Máximo de 6 colunas permitido.')
  }
}

const removeColumn = (columnId) => {
  if (form.value.columns.length > 1) {
    form.value.columns = form.value.columns.filter(col => col.id !== columnId)
  }
}

// Load kanbans
const loadKanbans = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('kanbans')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    kanbans.value = data || []
  } catch (error) {
    console.error('Error loading kanbans:', error)
  } finally {
    loading.value = false
  }
}

// Navigate to kanban
const navigateToKanban = (id) => {
  navigateTo(`/kanbans/${id}`)
}

// Edit kanban
const editKanban = (kanban) => {
  editingKanban.value = kanban
  form.value = {
    title: kanban.title,
    description: kanban.description || ''
  }
  showCreateModal.value = true
}

// Delete kanban
const deleteKanban = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este kanban?')) return

  try {
    const { error } = await supabase
      .from('kanbans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id)

    if (error) throw error
    await loadKanbans()
  } catch (error) {
    console.error('Error deleting kanban:', error)
    alert('Erro ao excluir kanban. Tente novamente.')
  }
}

// Save kanban
const saveKanban = async () => {
  try {
    saving.value = true

    // Validar colunas
    const validColumns = form.value.columns.filter(col => col.title.trim())
    if (validColumns.length === 0) {
      alert('É necessário pelo menos uma coluna com título.')
      return
    }

    if (editingKanban.value) {
      // Update existing kanban (sem alterar colunas no edit)
      const { error } = await supabase
        .from('kanbans')
        .update({
          title: form.value.title,
          description: form.value.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingKanban.value.id)
        .eq('user_id', user.value.id)

      if (error) throw error
    } else {
      // Create new kanban
      const { data: kanbanData, error: kanbanError } = await supabase
        .from('kanbans')
        .insert({
          title: form.value.title,
          description: form.value.description,
          user_id: user.value.id
        })
        .select()
        .single()

      if (kanbanError) throw kanbanError

      // Create columns
      const columnsToInsert = validColumns.map((col, index) => ({
        kanban_id: kanbanData.id,
        title: col.title.trim(),
        position: index
      }))

      const { error: columnsError } = await supabase
        .from('kanban_columns')
        .insert(columnsToInsert)

      if (columnsError) throw columnsError
    }

    closeModal()
    await loadKanbans()
  } catch (error) {
    console.error('Error saving kanban:', error)
    alert('Erro ao salvar kanban. Tente novamente.')
  } finally {
    saving.value = false
  }
}

// Close modal
const closeModal = () => {
  showCreateModal.value = false
  editingKanban.value = null
  form.value = {
    title: '',
    description: '',
    columns: [
      { id: Date.now() + 1, title: 'Para fazer' },
      { id: Date.now() + 2, title: 'Fazendo' },
      { id: Date.now() + 3, title: 'Concluído' }
    ]
  }
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Load on mount
onMounted(() => {
  loadKanbans()
})

// Meta tags
useHead({
  title: 'Kanbans - Artemis',
  meta: [
    { name: 'description', content: 'Gerencie seus quadros kanban' }
  ]
})
</script>