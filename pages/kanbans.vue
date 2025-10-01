<template>
  <div class="h-screen bg-gray-50 overflow-hidden">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
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
      <div v-else class="flex-1 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start">
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
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed z-50 inset-0 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeModal"></div>

          <!-- Modal panel -->
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form @submit.prevent="saveKanban">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="mb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    {{ editingKanban ? 'Editar Kanban' : 'Criar Novo Kanban' }}
                  </h3>
                </div>
                <div class="space-y-4">
                  <div>
                    <label for="title" class="block text-sm font-medium text-gray-700">
                      Título
                    </label>
                    <input
                      id="title"
                      v-model="form.title"
                      type="text"
                      required
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="Meu Kanban"
                    />
                  </div>
                  <div>
                    <label for="description" class="block text-sm font-medium text-gray-700">
                      Descrição (opcional)
                    </label>
                    <textarea
                      id="description"
                      v-model="form.description"
                      rows="3"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="Descrição do kanban..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  :disabled="saving"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <span v-if="saving">Salvando...</span>
                  <span v-else>{{ editingKanban ? 'Atualizar' : 'Criar' }}</span>
                </button>
                <button
                  type="button"
                  @click="closeModal"
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
  description: ''
})

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

    if (editingKanban.value) {
      // Update existing kanban
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
      const { error } = await supabase
        .from('kanbans')
        .insert({
          title: form.value.title,
          description: form.value.description,
          user_id: user.value.id
        })

      if (error) throw error
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
    description: ''
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