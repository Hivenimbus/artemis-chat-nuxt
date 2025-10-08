<template>
  <div class="h-full bg-gray-50">
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Cabeçalho -->
      <div class="mb-4 sm:mb-6 flex-shrink-0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Equipes</h1>
            <p class="mt-1 text-sm text-gray-500">Gerencie as equipes de atendimento e atribua agentes</p>
          </div>
          <button
            @click="openCreateModal"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Nova Equipe
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
                placeholder="Buscar equipes..."
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
            {{ filteredTeams.length }} {{ filteredTeams.length === 1 ? 'equipe' : 'equipes' }}
          </div>
        </div>
      </div>

      <!-- Lista de equipes -->
      <div class="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto custom-scrollbar-container">
          <div class="p-4 space-y-3">
            <div
              v-for="team in filteredTeams"
              :key="team.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                  <!-- Ícone da equipe -->
                  <div class="flex-shrink-0 mt-1">
                    <div class="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                    </div>
                  </div>

                  <!-- Informações -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <h3 class="text-base font-semibold text-gray-900">{{ team.name }}</h3>
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        :class="getTeamSizeClass(team)"
                      >
                        {{ getTeamSizeText(team) }}
                      </span>
                    </div>
                    <p v-if="team.description" class="mt-1 text-sm text-gray-500">
                      {{ team.description }}
                    </p>
                    <div class="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                        {{ getTeamAgents(team.id).length }} {{ getTeamAgents(team.id).length === 1 ? 'agente' : 'agentes' }}
                      </span>
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Criada em {{ formatDate(team.createdAt) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Ações -->
                <div class="flex items-center space-x-1 flex-shrink-0 ml-4">
                  <button
                    @click="openManageAgentsModal(team)"
                    class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Gerenciar Agentes"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  </button>
                  <button
                    @click="openEditModal(team)"
                    class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(team)"
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

            <!-- Mensagem quando não há equipes -->
            <div v-if="filteredTeams.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma equipe encontrada</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ searchTerm || filterSize ? 'Tente ajustar os filtros' : 'Comece criando uma nova equipe' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Criar/Editar Equipe -->
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
              {{ isEditing ? 'Editar Equipe' : 'Nova Equipe' }}
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
              Nome da Equipe *
            </label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ex: Equipe de Suporte"
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
              placeholder="Descreva as responsabilidades da equipe..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            ></textarea>
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
            @click="saveTeam"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {{ isEditing ? 'Salvar Alterações' : 'Criar Equipe' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Gerenciar Agentes -->
    <div
      v-if="showManageAgentsModal"
      class="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeManageAgentsModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <!-- Cabeçalho -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Gerenciar Agentes - {{ selectedTeam?.name }}
            </h3>
            <button
              @click="closeManageAgentsModal"
              class="text-gray-400 hover:text-gray-500"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Corpo -->
        <div class="px-6 py-4 space-y-4">
          <!-- Lista de agentes com checkboxes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Selecionar Agentes
            </label>
            <div class="max-h-80 overflow-y-auto border border-gray-200 rounded-lg space-y-1 p-2 custom-scrollbar-container">
              <div
                v-for="agent in agents"
                :key="agent.id"
                class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    :checked="isAgentInTeam(agent.id)"
                    @change="toggleAgentInTeam(agent.id)"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ agent.name }}</p>
                    <p class="text-xs text-gray-500">{{ agent.email }}</p>
                  </div>
                </div>
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="agent.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'"
                >
                  {{ agent.role === 'admin' ? 'Admin' : 'Agente' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Resumo -->
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-sm text-gray-600">
              <span class="font-medium">{{ getTeamAgents(selectedTeam?.id).length }}</span>
              {{ getTeamAgents(selectedTeam?.id).length === 1 ? 'agente selecionado' : 'agentes selecionados' }}
            </p>
          </div>
        </div>

        <!-- Rodapé -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            @click="closeManageAgentsModal"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Concluído
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
              <h3 class="text-lg font-medium text-gray-900">Excluir Equipe</h3>
              <p class="mt-2 text-sm text-gray-500">
                Tem certeza que deseja excluir a equipe <strong>"{{ teamToDelete?.name }}"</strong>?
                Esta ação não pode ser desfeita e os agentes serão removidos da equipe.
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
            @click="deleteTeam"
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
const showModal = ref(false)
const showManageAgentsModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedTeam = ref(null)
const teamToDelete = ref(null)

// Dados do formulário
const formData = ref({
  name: '',
  description: ''
})

const errors = ref({
  name: ''
})


// Dados mockados de agentes (reutilizado da página de agentes)
const agents = ref([
  { id: 1, name: 'Ana Carolina Santos', email: 'ana.santos@artemis.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Carlos Eduardo Pereira', email: 'carlos.pereira@artemis.com', role: 'agent', status: 'active' },
  { id: 3, name: 'Mariana Silva Oliveira', email: 'mariana.oliveira@artemis.com', role: 'agent', status: 'inactive' },
  { id: 4, name: 'Roberto Ferreira Lima', email: 'roberto.lima@artemis.com', role: 'admin', status: 'active' },
  { id: 5, name: 'Juliana Mendes Costa', email: 'juliana.costa@artemis.com', role: 'agent', status: 'active' },
  { id: 6, name: 'Pedro Henrique Souza', email: 'pedro.souza@artemis.com', role: 'agent', status: 'active' },
  { id: 7, name: 'Fernanda Costa Silva', email: 'fernanda.silva@artemis.com', role: 'agent', status: 'active' },
  { id: 8, name: 'Lucas Oliveira Santos', email: 'lucas.santos@artemis.com', role: 'admin', status: 'active' }
])

// Dados mockados de equipes
const teams = ref([
  {
    id: 1,
    name: 'Suporte Técnico',
    description: 'Equipe responsável pelo suporte técnico e resolução de problemas complexos',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-10-01')
  },
  {
    id: 2,
    name: 'Vendas',
    description: 'Equipe de vendas focada em novos clientes e conversão',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-09-28')
  },
  {
    id: 3,
    name: 'Atendimento Premium',
    description: 'Equipe dedicada ao atendimento de clientes premium e enterprise',
    createdAt: new Date('2024-03-05'),
    updatedAt: null
  },
  {
    id: 4,
    name: 'Financeiro',
    description: 'Equipe responsável por questões financeiras e cobranças',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-10-05')
  },
  {
    id: 5,
    name: 'Treinamento',
    description: 'Equipe focada em treinamento e capacitação de usuários',
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-09-30')
  }
])

// Relacionamento equipe-agentes (mock)
const teamAgents = ref([
  { teamId: 1, agentId: 2 },
  { teamId: 1, agentId: 5 },
  { teamId: 1, agentId: 7 },
  { teamId: 2, agentId: 3 },
  { teamId: 2, agentId: 6 },
  { teamId: 3, agentId: 1 },
  { teamId: 3, agentId: 4 },
  { teamId: 3, agentId: 8 },
  { teamId: 4, agentId: 1 },
  { teamId: 4, agentId: 4 }
])

// Computed
const filteredTeams = computed(() => {
  let result = teams.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(team =>
      team.name.toLowerCase().includes(term) ||
      (team.description && team.description.toLowerCase().includes(term))
    )
  }

  return result
})

// Métodos
const getInitials = (name) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getTeamAgents = (teamId) => {
  if (!teamId) return []
  const agentIds = teamAgents.value
    .filter(ta => ta.teamId === teamId)
    .map(ta => ta.agentId)

  return agents.value.filter(agent => agentIds.includes(agent.id))
}

const getTeamSizeText = (team) => {
  const count = getTeamAgents(team.id).length
  if (count === 0) return 'Vazia'
  if (count === 1) return '1 agente'
  return `${count} agentes`
}

const getTeamSizeClass = (team) => {
  const count = getTeamAgents(team.id).length
  if (count === 0) return 'bg-gray-100 text-gray-800'
  if (count <= 3) return 'bg-blue-100 text-blue-800'
  return 'bg-green-100 text-green-800'
}

const openCreateModal = () => {
  isEditing.value = false
  formData.value = {
    name: '',
    description: ''
  }
  errors.value = {
    name: ''
  }
  showModal.value = true
}

const openEditModal = (team) => {
  isEditing.value = true
  formData.value = {
    id: team.id,
    name: team.name,
    description: team.description || ''
  }
  errors.value = {
    name: ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formData.value = {
    name: '',
    description: ''
  }
  errors.value = {
    name: ''
  }
}

const openManageAgentsModal = (team) => {
  selectedTeam.value = team
  showManageAgentsModal.value = true
}

const isAgentInTeam = (agentId) => {
  if (!selectedTeam.value) return false
  return teamAgents.value.some(ta =>
    ta.teamId === selectedTeam.value.id && ta.agentId === agentId
  )
}

const toggleAgentInTeam = (agentId) => {
  if (!selectedTeam.value) return

  const exists = isAgentInTeam(agentId)

  if (exists) {
    // Remover agente da equipe
    const index = teamAgents.value.findIndex(ta =>
      ta.teamId === selectedTeam.value.id && ta.agentId === agentId
    )
    if (index !== -1) {
      teamAgents.value.splice(index, 1)
    }
  } else {
    // Adicionar agente à equipe
    teamAgents.value.push({
      teamId: selectedTeam.value.id,
      agentId: agentId
    })
  }
}

const closeManageAgentsModal = () => {
  showManageAgentsModal.value = false
  selectedTeam.value = null
}

const validateForm = () => {
  let isValid = true
  errors.value = {
    name: ''
  }

  if (!formData.value.name.trim()) {
    errors.value.name = 'O nome da equipe é obrigatório'
    isValid = false
  }

  return isValid
}

const saveTeam = () => {
  if (!validateForm()) return

  if (isEditing.value) {
    // Editar equipe existente
    const index = teams.value.findIndex(t => t.id === formData.value.id)
    if (index !== -1) {
      teams.value[index] = {
        ...teams.value[index],
        name: formData.value.name,
        description: formData.value.description,
        updatedAt: new Date()
      }
    }
    closeModal()
  } else {
    // Criar nova equipe
    const newTeam = {
      id: Math.max(...teams.value.map(t => t.id)) + 1,
      name: formData.value.name,
      description: formData.value.description,
      createdAt: new Date(),
      updatedAt: null
    }
    teams.value.push(newTeam)
    closeModal()
  }
}


const confirmDelete = (team) => {
  teamToDelete.value = team
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  teamToDelete.value = null
}

const deleteTeam = () => {
  if (teamToDelete.value) {
    // Remover equipe
    const teamIndex = teams.value.findIndex(t => t.id === teamToDelete.value.id)
    if (teamIndex !== -1) {
      teams.value.splice(teamIndex, 1)
    }

    // Remover relacionamentos com agentes
    teamAgents.value = teamAgents.value.filter(ta => ta.teamId !== teamToDelete.value.id)
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