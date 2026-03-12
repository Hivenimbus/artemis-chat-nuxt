<template>
  <div class="h-full bg-gray-50">
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Cabeçalho -->
      <div class="mb-4 sm:mb-6 flex-shrink-0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Usuários</h1>
            <p class="mt-1 text-sm text-gray-500">Gerencie agentes e administradores da plataforma</p>
          </div>
          <button
            @click="openCreateModal"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Novo Usuário
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
                placeholder="Buscar usuários..."
                class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <select
              v-model="filterRole"
              class="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todas as funções</option>
              <option value="user">Agentes</option>
              <option value="admin">Administradores</option>
            </select>
            <select
              v-model="filterStatus"
              class="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
          <div class="text-sm text-gray-500">
            {{ filteredAgents.length }} {{ filteredAgents.length === 1 ? 'usuário' : 'usuários' }} (agentes e administradores)
          </div>
        </div>
      </div>

      <!-- Lista de agentes -->
      <div class="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-500">Carregando agentes...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Erro ao carregar agentes</h3>
            <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
            <div class="mt-6">
              <button
                @click="loadAgents"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de agentes -->
        <div v-else class="flex-1 overflow-y-auto custom-scrollbar-container">
          <div class="p-4 space-y-3">
            <div
              v-for="agent in filteredAgents"
              :key="agent.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                  <!-- Avatar do agente -->
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
                      {{ getInitials(agent.name) }}
                    </div>
                  </div>

                  <!-- Informações -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <h3 class="text-base font-semibold text-gray-900">{{ agent.name }}</h3>
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        :class="getRoleClass(agent.role)"
                      >
                        {{ getRoleText(agent.role) }}
                      </span>
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        :class="getStatusClass(agent.status)"
                      >
                        {{ getStatusText(agent.status) }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">
                      {{ agent.email }}
                    </p>
                    <div class="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        {{ agent.empresa_nome }}
                      </span>
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Criado em {{ formatDate(agent.createdAt) }}
                      </span>
                      <span v-if="agent.lastLogin" class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        Último acesso {{ formatDateTime(agent.lastLogin) }}
                      </span>
                      <span v-if="agent.role === 'user'" class="flex items-center" title="Caixas de entrada atribuídas">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                        {{ agent.inbox_ids?.length || 0 }} inboxes
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Ações -->
                <div class="flex items-center space-x-1 flex-shrink-0 ml-4">
                  <button
                    @click="toggleAgentStatus(agent)"
                    :class="[
                      'p-2 rounded-lg transition-colors',
                      agent.status === 'active'
                        ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    ]"
                    :title="agent.status === 'active' ? 'Desativar' : 'Ativar'"
                  >
                    <svg v-if="agent.status === 'active'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </button>
                  <button
                    @click="openEditModal(agent)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(agent)"
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

            <!-- Mensagem quando não há agentes -->
            <div v-if="filteredAgents.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ searchTerm || filterRole || filterStatus ? 'Tente ajustar os filtros' : 'Comece criando um novo usuário' }}
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
              {{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}
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
              Nome do Agente *
            </label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ex: João Silva"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.name }"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              v-model="formData.email"
              placeholder="exemplo@email.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.email }"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
          </div>

          <!-- Função -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Função *
            </label>
            <select
              v-model="formData.role"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.role }"
            >
              <option value="">Selecione uma função</option>
              <option value="user">Agente</option>
              <option value="admin">Administrador</option>
            </select>
            <p v-if="errors.role" class="mt-1 text-sm text-red-600">{{ errors.role }}</p>
          </div>

          <!-- Atribuição de Caixas de Entrada -->
          <div v-if="formData.role === 'user'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Caixas de Entrada Atribuídas
            </label>
            <div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              <div v-if="allInboxes.length === 0" class="text-sm text-gray-500 italic">
                Nenhuma caixa de entrada disponível
              </div>
              <div v-for="inbox in allInboxes" :key="inbox.id" class="flex items-center">
                <input
                  type="checkbox"
                  :id="'inbox-' + inbox.id"
                  :value="inbox.id"
                  v-model="formData.inbox_ids"
                  class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label :for="'inbox-' + inbox.id" class="ml-2 block text-sm text-gray-900 cursor-pointer">
                  {{ inbox.name }}
                </label>
              </div>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Selecione as caixas de entrada que este agente poderá acessar.
            </p>
          </div>
        </div>

        <!-- Rodapé do Modal -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancelar
          </button>
          <button
            @click="saveAgent"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {{ isEditing ? 'Salvar Alterações' : 'Criar Usuário' }}
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
              <h3 class="text-lg font-medium text-gray-900">Excluir Usuário</h3>
              <p class="mt-2 text-sm text-gray-500">
                Tem certeza que deseja excluir o usuário <strong>"{{ agentToDelete?.name }}"</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            @click="closeDeleteModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancelar
          </button>
          <button
            @click="deleteAgent"
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


const { userData } = useUser()
const { getInboxes } = useInboxes()
const { showToast } = useToast()

// Estado
const searchTerm = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const agentToDelete = ref(null)
const loading = ref(true)
const error = ref('')

// Dados do formulário
const formData = ref({
  name: '',
  email: '',
  role: '',
  inbox_ids: []
})

const errors = ref({
  name: '',
  email: '',
  role: ''
})

// Dados dos agentes
const agents = ref([])
// Todas as inboxes disponíveis para seleção
const allInboxes = ref([])

// Função para carregar inboxes
const loadInboxesData = async () => {
  try {
    const response = await getInboxes()
    allInboxes.value = response.data || []
  } catch (err) {
    console.error('Erro ao carregar inboxes:', err)
  }
}

// Função para carregar agentes via API
const loadAgents = async () => {
  try {
    loading.value = true
    error.value = ''

    // Carregar inboxes primeiro
    await loadInboxesData()
  
    // Carregar agentes via API
    const response = await $fetch('/api/agentes')
    const data = response.data || []

    // Formatar dados para compatibilidade com a interface existente
    agents.value = data.map((user) => ({
      id: user.id,
      name: user.name || 'Sem nome',
      email: user.email,
      role: user.role,
      empresa_id: user.empresa?.id,
      empresa_nome: user.empresa?.nome || 'Sem empresa',
      status: user.status || 'active',
      createdAt: user.created_at,
      lastLogin: null,
      inbox_ids: user.inboxAgents?.map((ia) => ia.inbox_id) || []
    }))

  } catch (err) {
    console.error('Erro ao carregar agentes:', err)
    error.value = 'Erro ao carregar agentes: ' + (err.message || 'Tente novamente.')
  } finally {
    loading.value = false
  }
}

// Computed
const filteredAgents = computed(() => {
  let result = agents.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(agent =>
      agent.name.toLowerCase().includes(term) ||
      agent.email.toLowerCase().includes(term) ||
      agent.empresa_nome.toLowerCase().includes(term)
    )
  }

  if (filterRole.value) {
    result = result.filter(agent => agent.role === filterRole.value)
  }

  if (filterStatus.value) {
    result = result.filter(agent => agent.status === filterStatus.value)
  }

  return result
})

// Métodos
const getInitials = (name) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getRoleClass = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800'
    case 'user':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getRoleText = (role) => {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'user':
      return 'Agente'
    default:
      return role
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'inactive': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'active': return 'Ativo'
    case 'pending': return 'Pendente'
    case 'inactive': return 'Inativo'
    default: return status
  }
}

const openCreateModal = () => {
  isEditing.value = false
  formData.value = {
    name: '',
    email: '',
    role: '',
    inbox_ids: []
  }
  errors.value = {
    name: '',
    email: '',
    role: ''
  }
  showModal.value = true
}

const openEditModal = (agent) => {
  isEditing.value = true
  formData.value = {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    role: agent.role,
    inbox_ids: [...(agent.inbox_ids || [])]
  }
  errors.value = {
    name: '',
    email: '',
    role: ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formData.value = {
    name: '',
    email: '',
    role: '',
    inbox_ids: []
  }
  errors.value = {
    name: '',
    email: '',
    role: ''
  }
}

const validateForm = () => {
  let isValid = true
  errors.value = {
    name: '',
    email: '',
    role: ''
  }

  if (!formData.value.name.trim()) {
    errors.value.name = 'O nome é obrigatório'
    isValid = false
  }

  if (!formData.value.email.trim()) {
    errors.value.email = 'O email é obrigatório'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = 'Email inválido'
    isValid = false
  }

  if (!formData.value.role) {
    errors.value.role = 'A função é obrigatória'
    isValid = false
  }

  return isValid
}

const saveAgent = async () => {
  if (!validateForm()) return

  try {
    if (isEditing.value) {
      // Editar agente existente via API
      await $fetch(`/api/agentes/${formData.value.id}`, {
        method: 'PUT',
        body: {
          name: formData.value.name,
          email: formData.value.email,
          role: formData.value.role,
          inbox_ids: formData.value.inbox_ids
        }
      })

      // Recarregar dados para atualizar a lista
      await loadAgents()
      closeModal()
      showToast('Usuário atualizado com sucesso!', 'success')
    } else {
      // Criar novo agente via API
      await $fetch('/api/agentes', {
        method: 'POST',
        body: {
          name: formData.value.name,
          email: formData.value.email,
          role: formData.value.role,
          inbox_ids: formData.value.inbox_ids
        }
      })

      // Recarregar dados para atualizar a lista
      await loadAgents()
      closeModal()
      showToast('Convite enviado com sucesso! O usuário receberá um email para definir a senha.', 'success')
    }
  } catch (error) {
    console.error('Erro ao salvar agente:', error)
    showToast('Erro ao salvar agente: ' + (error.data?.statusMessage || error.message || 'Tente novamente.'), 'error')
  }
}

const toggleAgentStatus = (agent) => {
  const index = agents.value.findIndex(a => a.id === agent.id)
  if (index !== -1) {
    agents.value[index] = {
      ...agents.value[index],
      status: agent.status === 'active' ? 'inactive' : 'active'
    }
  }
}

const confirmDelete = (agent) => {
  agentToDelete.value = agent
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  agentToDelete.value = null
}

const deleteAgent = async () => {
  if (!agentToDelete.value) return

  try {
    // Excluir o agente via API
    await $fetch(`/api/agentes/${agentToDelete.value.id}`, {
      method: 'DELETE'
    })

    // Recarregar dados para atualizar a lista
    await loadAgents()
    closeDeleteModal()
    showToast('Usuário excluído com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao excluir agente:', error)
    showToast('Erro ao excluir agente: ' + (error.data?.statusMessage || error.message || 'Tente novamente.'), 'error')
  }
}

// Controle para evitar múltiplas chamadas
const dataLoaded = ref(false)

// Carregar dados quando o componente for montado e userData estiver disponível
watchEffect(() => {
  // Apenas carrega quando os dados do usuário estiverem disponíveis e ainda não foi carregado
  if (userData.value && !dataLoaded.value) {
    dataLoaded.value = true
    loadAgents()
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