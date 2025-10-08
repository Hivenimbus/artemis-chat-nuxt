<template>
  <div class="h-full bg-gray-50">
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Cabeçalho -->
      <div class="mb-4 sm:mb-6 flex-shrink-0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Agentes</h1>
            <p class="mt-1 text-sm text-gray-500">Gerencie os agentes de atendimento da plataforma</p>
          </div>
          <button
            @click="openCreateModal"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Novo Agente
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
                placeholder="Buscar agentes..."
                class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todas as funções</option>
              <option value="agent">Agentes</option>
              <option value="admin">Administradores</option>
            </select>
            <select
              v-model="filterStatus"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
          <div class="text-sm text-gray-500">
            {{ filteredAgents.length }} {{ filteredAgents.length === 1 ? 'agente' : 'agentes' }}
          </div>
        </div>
      </div>

      <!-- Lista de agentes -->
      <div class="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto custom-scrollbar-container">
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
                    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
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
                    class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
              <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum agente encontrado</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ searchTerm || filterRole || filterStatus ? 'Tente ajustar os filtros' : 'Comece criando um novo agente' }}
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
              {{ isEditing ? 'Editar Agente' : 'Novo Agente' }}
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.role }"
            >
              <option value="">Selecione uma função</option>
              <option value="agent">Agente</option>
              <option value="admin">Administrador</option>
            </select>
            <p v-if="errors.role" class="mt-1 text-sm text-red-600">{{ errors.role }}</p>
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
            @click="saveAgent"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {{ isEditing ? 'Salvar Alterações' : 'Criar Agente' }}
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
              <h3 class="text-lg font-medium text-gray-900">Excluir Agente</h3>
              <p class="mt-2 text-sm text-gray-500">
                Tem certeza que deseja excluir o agente <strong>"{{ agentToDelete?.name }}"</strong>?
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
// Estado
const searchTerm = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const agentToDelete = ref(null)

// Dados do formulário
const formData = ref({
  name: '',
  email: '',
  role: ''
})

const errors = ref({
  name: '',
  email: '',
  role: ''
})

// Dados mockados de agentes
const agents = ref([
  {
    id: 1,
    name: 'Ana Carolina Santos',
    email: 'ana.santos@artemis.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-10-06T14:30:00')
  },
  {
    id: 2,
    name: 'Carlos Eduardo Pereira',
    email: 'carlos.pereira@artemis.com',
    role: 'agent',
    status: 'active',
    createdAt: new Date('2024-02-10'),
    lastLogin: new Date('2024-10-07T09:15:00')
  },
  {
    id: 3,
    name: 'Mariana Silva Oliveira',
    email: 'mariana.oliveira@artemis.com',
    role: 'agent',
    status: 'inactive',
    createdAt: new Date('2024-03-05'),
    lastLogin: new Date('2024-09-28T16:45:00')
  },
  {
    id: 4,
    name: 'Roberto Ferreira Lima',
    email: 'roberto.lima@artemis.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-03-20'),
    lastLogin: new Date('2024-10-07T08:00:00')
  },
  {
    id: 5,
    name: 'Juliana Mendes Costa',
    email: 'juliana.costa@artemis.com',
    role: 'agent',
    status: 'active',
    createdAt: new Date('2024-04-12'),
    lastLogin: new Date('2024-10-06T11:20:00')
  }
])

// Computed
const filteredAgents = computed(() => {
  let result = agents.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(agent =>
      agent.name.toLowerCase().includes(term) ||
      agent.email.toLowerCase().includes(term)
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
  return role === 'admin'
    ? 'bg-purple-100 text-purple-800'
    : 'bg-blue-100 text-blue-800'
}

const getRoleText = (role) => {
  return role === 'admin' ? 'Administrador' : 'Agente'
}

const getStatusClass = (status) => {
  return status === 'active'
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  return status === 'active' ? 'Ativo' : 'Inativo'
}

const openCreateModal = () => {
  isEditing.value = false
  formData.value = {
    name: '',
    email: '',
    role: ''
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
    role: agent.role
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
    role: ''
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

const saveAgent = () => {
  if (!validateForm()) return

  if (isEditing.value) {
    // Editar agente existente
    const index = agents.value.findIndex(a => a.id === formData.value.id)
    if (index !== -1) {
      agents.value[index] = {
        ...agents.value[index],
        name: formData.value.name,
        email: formData.value.email,
        role: formData.value.role
      }
    }
    closeModal()
  } else {
    // Criar novo agente
    const newAgent = {
      id: Math.max(...agents.value.map(a => a.id)) + 1,
      name: formData.value.name,
      email: formData.value.email,
      role: formData.value.role,
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    }
    agents.value.push(newAgent)
    closeModal()
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

const deleteAgent = () => {
  if (agentToDelete.value) {
    const index = agents.value.findIndex(a => a.id === agentToDelete.value.id)
    if (index !== -1) {
      agents.value.splice(index, 1)
    }
  }
  closeDeleteModal()
}
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