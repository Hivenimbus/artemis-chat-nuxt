<template>
  <div class="h-full bg-gray-50">
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Cabeçalho -->
      <div class="mb-4 sm:mb-6 flex-shrink-0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Etiquetas</h1>
            <p class="mt-1 text-sm text-gray-500">Gerencie as etiquetas do sistema</p>
          </div>
          <button
            @click="openCreateModal"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Nova Etiqueta
          </button>
        </div>
      </div>

      <!-- Barra de pesquisa e filtros -->
      <div class="bg-white shadow rounded-lg mb-4 p-4 flex-shrink-0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
          <div class="flex-1">
            <div class="relative">
              <input
                type="text"
                v-model="searchTerm"
                placeholder="Buscar etiquetas..."
                class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="text-sm text-gray-500">
            {{ filteredTags.length }} {{ filteredTags.length === 1 ? 'etiqueta' : 'etiquetas' }}
          </div>
        </div>
      </div>

      <!-- Lista de etiquetas -->
      <div class="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-500">Carregando etiquetas...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Erro ao carregar etiquetas</h3>
            <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
            <div class="mt-6">
              <button
                @click="loadTags"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de etiquetas -->
        <div v-else class="flex-1 overflow-y-auto custom-scrollbar-container">
          <div class="p-4 space-y-3">
            <div
              v-for="tag in filteredTags"
              :key="tag.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                  <!-- Cor da etiqueta -->
                  <div class="flex-shrink-0 mt-1">
                    <div
                      class="w-8 h-8 rounded-full border-2 border-gray-200"
                      :style="{ backgroundColor: tag.color }"
                    ></div>
                  </div>

                  <!-- Informações -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <h3 class="text-base font-semibold text-gray-900">{{ tag.name }}</h3>
                      <span
                        class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium"
                        :style="{ 
                          backgroundColor: tag.color + '20', 
                          color: tag.color 
                        }"
                      >
                        {{ tag.name }}
                      </span>
                    </div>
                    <p v-if="tag.description" class="mt-1 text-sm text-gray-500">
                      {{ tag.description }}
                    </p>
                    <div class="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Criada em {{ formatDate(tag.createdAt) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Ações -->
                <div class="flex items-center space-x-1 flex-shrink-0 ml-4">
                  <button
                    @click="openEditModal(tag)"
                    class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(tag)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Mensagem quando não há etiquetas -->
            <div v-if="filteredTags.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma etiqueta encontrada</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ searchTerm ? 'Tente buscar por outro termo' : 'Comece criando uma nova etiqueta' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Criar/Editar -->
    <div
      v-if="showModal"
      class="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <!-- Cabeçalho do Modal -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ isEditing ? 'Editar Etiqueta' : 'Nova Etiqueta' }}
            </h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-500"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Corpo do Modal -->
        <div class="px-6 py-4 space-y-4">
          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nome da Etiqueta *
            </label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ex: VIP, Urgente, Follow-up"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.name }"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
          </div>

          <!-- Descrição -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              placeholder="Adicione uma descrição para esta etiqueta..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            ></textarea>
          </div>

          <!-- Cor -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cor *
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in availableColors"
                :key="color"
                type="button"
                @click="formData.color = color"
                class="w-10 h-10 rounded-full transition-all hover:scale-110 flex-shrink-0"
                :class="formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''"
                :style="`background-color: ${color}; border: 2px solid ${formData.color === color ? '#111827' : '#E5E7EB'}`"
                :title="color"
              ></button>
            </div>
            <p v-if="errors.color" class="mt-1 text-sm text-red-600">{{ errors.color }}</p>
          </div>

          <!-- Preview -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pré-visualização
            </label>
            <div class="flex items-center space-x-2">
              <span
                v-if="formData.name"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :style="{ 
                  backgroundColor: formData.color + '20', 
                  color: formData.color 
                }"
              >
                {{ formData.name }}
              </span>
              <span v-else class="text-sm text-gray-400">
                Digite um nome para ver a pré-visualização
              </span>
            </div>
          </div>
        </div>

        <!-- Rodapé do Modal -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            @click="saveTag"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {{ isEditing ? 'Salvar Alterações' : 'Criar Etiqueta' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="px-6 py-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-lg font-medium text-gray-900">Excluir Etiqueta</h3>
              <p class="mt-2 text-sm text-gray-500">
                Tem certeza que deseja excluir a etiqueta <strong>"{{ tagToDelete?.name }}"</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            @click="closeDeleteModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            @click="deleteTag"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Definir middleware de autenticação
definePageMeta({
  middleware: 'admin'
})

// Cliente Supabase
const { userData } = useUser()

// Estado
const searchTerm = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const tagToDelete = ref(null)
const loading = ref(true)
const error = ref('')

// Cores disponíveis para as etiquetas
const availableColors = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
]

// Dados do formulário
const formData = ref({
  name: '',
  description: '',
  color: '#3B82F6'
})

const errors = ref({
  name: '',
  color: ''
})

// Dados das etiquetas (carregados da API)
const tags = ref([])

// Função para carregar etiquetas da API
const loadTags = async () => {
  try {
    loading.value = true
    error.value = ''

    const { data } = await $fetch('/api/etiquetas')

    // Formatar dados para compatibilidade com a interface existente
    tags.value = data.map(tag => ({
      id: tag.id,
      name: tag.nome,
      description: tag.descricao,
      color: tag.cor,
      createdAt: tag.createdAt,
      usageCount: tag.usageCount || 0
    }))

  } catch (err) {
    console.error('Erro ao carregar etiquetas:', err)
    error.value = 'Erro ao carregar etiquetas: ' + (err.message || 'Tente novamente.')
  } finally {
    loading.value = false
  }
}

// Computed
const filteredTags = computed(() => {
  if (!searchTerm.value) return tags.value
  
  const term = searchTerm.value.toLowerCase()
  return tags.value.filter(tag => 
    tag.name.toLowerCase().includes(term) ||
    (tag.description && tag.description.toLowerCase().includes(term))
  )
})

// Métodos
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const openCreateModal = () => {
  isEditing.value = false
  formData.value = {
    name: '',
    description: '',
    color: '#3B82F6'
  }
  errors.value = {
    name: '',
    color: ''
  }
  showModal.value = true
}

const openEditModal = (tag) => {
  isEditing.value = true
  formData.value = {
    id: tag.id,
    name: tag.name,
    description: tag.description || '',
    color: tag.color
  }
  errors.value = {
    name: '',
    color: ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formData.value = {
    name: '',
    description: '',
    color: '#3B82F6'
  }
  errors.value = {
    name: '',
    color: ''
  }
}

const validateForm = () => {
  let isValid = true
  errors.value = {
    name: '',
    color: ''
  }

  if (!formData.value.name.trim()) {
    errors.value.name = 'O nome é obrigatório'
    isValid = false
  }

  if (!formData.value.color) {
    errors.value.color = 'Selecione uma cor'
    isValid = false
  }

  return isValid
}

const saveTag = async () => {
  if (!validateForm()) return

  try {
    if (isEditing.value) {
      // Editar etiqueta existente via API
      const { data } = await $fetch(`/api/etiquetas/${formData.value.id}`, {
        method: 'PUT',
        body: {
          nome: formData.value.name,
          descricao: formData.value.description,
          cor: formData.value.color
        }
      })

      // Atualizar etiqueta localmente
      const index = tags.value.findIndex(t => t.id === formData.value.id)
      if (index !== -1) {
        tags.value[index] = {
          ...tags.value[index],
          name: data.nome,
          description: data.descricao,
          color: data.cor,
          updatedAt: data.updatedAt
        }
      }
    } else {
      // Criar nova etiqueta via API
      const { data } = await $fetch('/api/etiquetas', {
        method: 'POST',
        body: {
          nome: formData.value.name,
          descricao: formData.value.description,
          cor: formData.value.color
        }
      })

      // Adicionar nova etiqueta localmente
      const newTag = {
        id: data.id,
        name: data.nome,
        description: data.descricao,
        color: data.cor,
        createdAt: data.createdAt,
        usageCount: data.usageCount || 0
      }
      tags.value.unshift(newTag)
    }

    closeModal()
  } catch (error) {
    console.error('Erro ao salvar etiqueta:', error)
    alert('Erro ao salvar etiqueta: ' + (error.message || 'Tente novamente.'))
  }
}

const confirmDelete = (tag) => {
  tagToDelete.value = tag
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  tagToDelete.value = null
}

const deleteTag = async () => {
  if (!tagToDelete.value) return

  try {
    await $fetch(`/api/etiquetas/${tagToDelete.value.id}`, {
      method: 'DELETE'
    })

    // Remover etiqueta localmente
    const index = tags.value.findIndex(t => t.id === tagToDelete.value.id)
    if (index !== -1) {
      tags.value.splice(index, 1)
    }

    closeDeleteModal()
  } catch (error) {
    console.error('Erro ao excluir etiqueta:', error)
    alert('Erro ao excluir etiqueta: ' + (error.message || 'Tente novamente.'))
  }
}

// Controle para evitar múltiplas chamadas
const dataLoaded = ref(false)

// Carregar dados quando o componente for montado e userData estiver disponível
watchEffect(() => {
  // Apenas carrega quando os dados do usuário estiverem disponíveis e ainda não foi carregado
  if (userData.value && !dataLoaded.value) {
    dataLoaded.value = true
    loadTags()
  }
})
</script>

<style scoped>
.custom-scrollbar-container {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar-container::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar-container::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}

.custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
