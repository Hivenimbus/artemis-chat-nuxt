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
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
            <!-- Filtro de empresa apenas para superadmin -->
            <select
              v-if="userData?.role === 'superadmin'"
              v-model="filterEmpresa"
              class="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todas as empresas</option>
              <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
                {{ empresa.nome }}
              </option>
            </select>

            <!-- Badge da empresa atual para usuários comuns -->
            <div v-else-if="currentUserEmpresa" class="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
              <svg class="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span class="text-sm text-gray-700">{{ currentUserEmpresa.nome }}</span>
            </div>
          </div>
          <div class="text-sm text-gray-500">
            {{ filteredTeams.length }} {{ filteredTeams.length === 1 ? 'equipe' : 'equipes' }}
          </div>
        </div>
      </div>

      <!-- Lista de equipes -->
      <div class="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-500">Carregando equipes...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Erro ao carregar equipes</h3>
            <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
            <div class="mt-6">
              <button
                @click="loadData"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de equipes -->
        <div v-else class="flex-1 overflow-y-auto custom-scrollbar-container">
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
                    <div class="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        {{ team.empresa_nome }}
                      </span>
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Criada em {{ formatDate(team.created_at) }}
                      </span>
                      <span class="flex items-center" title="Caixas de entrada atribuídas">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                        {{ team.inbox_ids?.length || 0 }} inboxes
                      </span>
                    </div>
                    <!-- Visualização de agentes -->
                    <div v-if="getTeamAgents(team.id).length > 0" class="mt-2 flex items-center space-x-2">
                      <div class="flex -space-x-2">
                        <div
                          v-for="(agent, index) in getTeamAgents(team.id).slice(0, 3)"
                          :key="agent.id"
                          class="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xs font-medium text-white border-2 border-white shadow-sm"
                          :title="agent.name"
                        >
                          {{ getInitials(agent.name) }}
                        </div>
                        <div
                          v-if="getTeamAgents(team.id).length > 3"
                          class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white shadow-sm"
                          :title="`${getTeamAgents(team.id).length - 3} agentes adicionais`"
                        >
                          +{{ getTeamAgents(team.id).length - 3 }}
                        </div>
                      </div>
                      <span class="text-xs text-gray-500">
                        {{ getTeamAgents(team.id).length === 1 ? '1 agente' : `${getTeamAgents(team.id).length} agentes` }}
                      </span>
                    </div>
                    <div v-else class="mt-2 flex items-center space-x-2 text-gray-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      <span class="text-xs">Sem agentes</span>
                    </div>
                  </div>
                </div>

                <!-- Ações -->
                <div class="flex items-center space-x-1 flex-shrink-0 ml-4">
                  <button
                    @click="openManageAgentsModal(team)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Gerenciar Agentes"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  </button>
                  <button
                    @click="openEditModal(team)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                {{ searchTerm || filterEmpresa ? 'Tente ajustar os filtros' : 'Comece criando uma nova equipe' }}
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
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        <!-- Cabeçalho do Modal -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ isEditing ? 'Editar Equipe' : 'Nova Equipe' }}
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ isEditing ? 'Atualize as informações da equipe' : 'Crie uma nova equipe de atendimento' }}
                </p>
              </div>
            </div>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/50 transition-all duration-200"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Corpo do Modal -->
        <div class="px-6 py-5 space-y-4">
          <!-- Nome -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
              </svg>
              Nome da Equipe *
            </label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ex: Equipe de Suporte"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
              :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': errors.name }"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ errors.name }}
            </p>
          </div>

          <!-- Empresa (somente leitura) -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Empresa
            </label>
            <div class="flex items-center px-4 py-2.5 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
              <svg class="h-4 w-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span class="text-sm text-gray-900 font-medium">
                {{ currentUserEmpresa?.nome || 'Carregando...' }}
              </span>
            </div>
            <p class="text-xs text-gray-500 italic">
              A equipe será vinculada automaticamente à sua empresa
            </p>
          </div>

          <!-- Descrição -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Descrição (opcional)
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              placeholder="Descreva as responsabilidades da equipe..."
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-colors duration-200"
            ></textarea>
          </div>

          <!-- Atribuição de Caixas de Entrada -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
              Caixas de Entrada Atribuídas
            </label>
            <div class="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50/50">
              <div v-if="allInboxes.length === 0" class="text-sm text-gray-500 italic text-center py-2">
                Nenhuma caixa de entrada disponível
              </div>
              <div v-for="inbox in allInboxes" :key="inbox.id" class="flex items-center py-1.5 px-2 hover:bg-gray-100 rounded transition-colors duration-150">
                <input
                  type="checkbox"
                  :id="'inbox-' + inbox.id"
                  :value="inbox.id"
                  v-model="formData.inbox_ids"
                  class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                />
                <label :for="'inbox-' + inbox.id" class="ml-2.5 block text-sm text-gray-900 cursor-pointer flex-1">
                  {{ inbox.name }}
                </label>
              </div>
            </div>
            <p class="text-xs text-gray-500 italic">
              Os agentes desta equipe herdarão o acesso a estas caixas de entrada.
            </p>
          </div>
        </div>

        <!-- Rodapé do Modal -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            @click="saveTeam"
            class="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[80vh] flex flex-col">
        <!-- Cabeçalho -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  Gerenciar Agentes
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ selectedTeam?.name }} - Selecione os agentes para esta equipe
                </p>
              </div>
            </div>
            <button
              @click="closeManageAgentsModal"
              class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/50 transition-all duration-200"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Corpo -->
        <div class="flex-1 px-6 py-5 space-y-4 overflow-hidden flex flex-col">
          <!-- Campo de busca -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Buscar Agentes
            </label>
            <div class="relative">
              <input
                type="text"
                v-model="agentSearchTerm"
                placeholder="Digite o nome ou email do agente..."
                class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Lista de agentes -->
          <div class="flex-1 overflow-hidden flex flex-col space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              Agentes Disponíveis
            </label>

            <div class="flex-1 overflow-y-auto border border-gray-200 rounded-lg space-y-1 p-2 custom-scrollbar-container bg-gray-50/50">
              <div
                v-for="agent in filteredAgents"
                :key="agent.id"
                class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                @click="toggleAgentInTeam(agent.id)"
              >
                <div class="flex items-center space-x-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    :checked="isAgentInTeam(agent.id)"
                    @change="toggleAgentInTeam(agent.id)"
                    @click.stop
                    class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ agent.name }}</p>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                        :class="agent.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'"
                      >
                        {{ agent.role === 'admin' ? 'Admin' : 'Agente' }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 truncate">{{ agent.email }}</p>
                    <p class="text-xs text-gray-400 flex items-center mt-1">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      {{ agent.empresa_nome }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <div
                    v-if="isAgentInTeam(agent.id)"
                    class="w-2 h-2 bg-green-500 rounded-full"
                    title="Já está na equipe"
                  ></div>
                  <div
                    v-else
                    class="w-2 h-2 bg-gray-300 rounded-full"
                    title="Não está na equipe"
                  ></div>
                </div>
              </div>

              <!-- Mensagem quando não há agentes encontrados -->
              <div v-if="filteredAgents.length === 0" class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <p class="mt-2 text-sm text-gray-500">Nenhum agente encontrado</p>
                <p class="text-xs text-gray-400 mt-1">Tente ajustar os termos da busca</p>
              </div>
            </div>
          </div>

          <!-- Resumo -->
          <div class="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 border border-red-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm text-gray-700">
                  <span class="font-semibold">{{ getTeamAgents(selectedTeam?.id).length }}</span>
                  {{ getTeamAgents(selectedTeam?.id).length === 1 ? 'agente selecionado' : 'agentes selecionados' }}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                {{ filteredAgents.length }} {{ filteredAgents.length === 1 ? 'disponível' : 'disponíveis' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Rodapé -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
          <button
            @click="closeManageAgentsModal"
            class="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        <!-- Cabeçalho de Alerta -->
        <div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-xl">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Excluir Equipe</h3>
              <p class="text-xs text-gray-500 mt-0.5">Esta ação não pode ser desfeita</p>
            </div>
          </div>
        </div>

        <!-- Corpo do Modal -->
        <div class="px-6 py-5">
          <div class="space-y-4">
            <div class="bg-red-50 border border-red-100 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-800">
                    Tem certeza que deseja excluir a equipe <strong>"{{ teamToDelete?.name }}"</strong>?
                  </p>
                  <p class="text-sm text-red-700 mt-2">
                    Todos os agentes serão removidos desta equipe e a ação não poderá ser desfeita.
                  </p>
                </div>
              </div>
            </div>

            <!-- Informações adicionais -->
            <div v-if="teamToDelete && getTeamAgents(teamToDelete.id).length > 0" class="space-y-2">
              <p class="text-sm font-medium text-gray-700">Impactos da exclusão:</p>
              <div class="flex items-center space-x-2 text-sm text-gray-600">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <span>{{ getTeamAgents(teamToDelete.id).length }} {{ getTeamAgents(teamToDelete.id).length === 1 ? 'agente será' : 'agentes serão' }} removido(s) da equipe</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rodapé -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end space-x-3">
          <button
            @click="closeDeleteModal"
            class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            @click="deleteTeam"
            class="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 border border-transparent rounded-lg hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span class="flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              <span>Excluir Equipe</span>
            </span>
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
const showModal = ref(false)
const showManageAgentsModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedTeam = ref(null)
const teamToDelete = ref(null)
const agentSearchTerm = ref('')
const loading = ref(true)
const error = ref('')
const filterEmpresa = ref('')

// Dados do formulário
const formData = ref({
  name: '',
  description: '',
  empresa_id: '',
  inbox_ids: []
})

const errors = ref({
  name: '',
  empresa_id: ''
})

// Dados
const teams = ref([])
const agents = ref([])
const empresas = ref([])
const teamAgents = ref([])
const currentUserEmpresa = ref(null)
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

// Função para carregar dados via API
const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    // Carregar inboxes primeiro
    await loadInboxesData()

    // Carregar empresa do usuário logado
    if (userData.value?.empresa_id) {
      currentUserEmpresa.value = { id: userData.value.empresa_id, nome: userData.value.empresa_nome || '' }
    }

    // Carregar equipes via API
    const response = await $fetch('/api/equipes')
    const teamsData = response.data || []

    // Carregar agentes via API
    const agentesResponse = await $fetch('/api/agentes')
    const agentsData = agentesResponse.data || []

    // Montar teamAgents a partir das equipes
    teamAgents.value = []
    teams.value = teamsData.map((team) => {
      // Team agents from the included relation
      const agentIds = team.agentes?.map((a) => a.agente_id) || []
      agentIds.forEach((agentId) => {
        teamAgents.value.push({ id: crypto.randomUUID(), equipe_id: team.id, agente_id: agentId, created_at: new Date().toISOString() })
      })
      return {
        id: team.id, name: team.nome, description: team.descricao,
        empresa_id: team.empresas?.id, empresa_nome: team.empresas?.nome || 'Sem empresa',
        created_at: team.created_at, updated_at: team.updated_at,
        inbox_ids: team.inbox_teams?.map((it) => it.inbox_id) || []
      }
    })

    agents.value = agentsData.map((agent) => ({
      id: agent.id, name: agent.name || 'Sem nome', email: agent.email,
      role: agent.role, empresa_id: agent.empresa?.id,
      empresa_nome: agent.empresa?.nome || 'Sem empresa'
    }))

    empresas.value = currentUserEmpresa.value ? [currentUserEmpresa.value] : []

  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    error.value = 'Erro ao carregar dados. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Computed
const filteredTeams = computed(() => {
  let result = teams.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(team =>
      team.name.toLowerCase().includes(term) ||
      (team.description && team.description.toLowerCase().includes(term)) ||
      team.empresa_nome.toLowerCase().includes(term)
    )
  }

  if (filterEmpresa.value) {
    result = result.filter(team => team.empresa_id === filterEmpresa.value)
  }

  return result
})

const filteredAgents = computed(() => {
  let result = agents.value

  if (agentSearchTerm.value) {
    const term = agentSearchTerm.value.toLowerCase()
    result = result.filter(agent =>
      agent.name.toLowerCase().includes(term) ||
      agent.email.toLowerCase().includes(term)
    )
  }

  // Filtrar agentes da mesma empresa da equipe selecionada
  if (selectedTeam.value && selectedTeam.value.empresa_id) {
    result = result.filter(agent => agent.empresa_id === selectedTeam.value.empresa_id)
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
    .filter(ta => ta.equipe_id === teamId)
    .map(ta => ta.agente_id)

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
    description: '',
    empresa_id: currentUserEmpresa.value?.id || '',
    inbox_ids: []
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
    description: team.description || '',
    empresa_id: team.empresa_id, // Manter empresa original na edição
    inbox_ids: [...(team.inbox_ids || [])]
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
    description: '',
    empresa_id: currentUserEmpresa.value?.id || '',
    inbox_ids: []
  }
  errors.value = {
    name: ''
  }
}

const openManageAgentsModal = (team) => {
  selectedTeam.value = team
  agentSearchTerm.value = '' // Limpar busca ao abrir modal
  showManageAgentsModal.value = true
}

const isAgentInTeam = (agentId) => {
  if (!selectedTeam.value) return false
  return teamAgents.value.some(ta =>
    ta.equipe_id === selectedTeam.value.id && ta.agente_id === agentId
  )
}

const toggleAgentInTeam = async (agentId) => {
  if (!selectedTeam.value) return

  try {
    const exists = isAgentInTeam(agentId)

    if (exists) {
      // Remover agente da equipe via API
      await $fetch(`/api/equipes/${selectedTeam.value.id}`, {
        method: 'PUT',
        body: { removeAgente: agentId }
      })

      // Atualizar dados locais
      const index = teamAgents.value.findIndex((ta) =>
        ta.equipe_id === selectedTeam.value.id && ta.agente_id === agentId
      )
      if (index !== -1) teamAgents.value.splice(index, 1)
    } else {
      // Adicionar agente à equipe via API
      await $fetch(`/api/equipes/${selectedTeam.value.id}`, {
        method: 'PUT',
        body: { addAgente: agentId }
      })

      // Atualizar dados locais
      teamAgents.value.push({
        id: crypto.randomUUID(),
        equipe_id: selectedTeam.value.id,
        agente_id: agentId,
        created_at: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('Erro ao gerenciar agente na equipe:', err)
    showToast('Erro ao gerenciar agente na equipe. Tente novamente.', 'error')
  }
}

const closeManageAgentsModal = async () => {
  showManageAgentsModal.value = false
  selectedTeam.value = null
  // Recarregar dados para atualizar contadores
  await loadData()
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

  // Validar se o usuário tem empresa vinculada
  if (!currentUserEmpresa.value) {
    showToast('Você precisa estar vinculado a uma empresa para criar equipes.', 'warning')
    isValid = false
  }

  return isValid
}

const saveTeam = async () => {
  if (!validateForm()) return

  try {
    // Validar se o usuário está autenticado
    if (!userData.value?.id) {
      throw new Error('Usuário não autenticado ou dados inválidos')
    }

    console.log('Salvando equipe com usuário:', userData.value.id)

    // Garantir que estamos usando a empresa do usuário logado
    const empresaId = currentUserEmpresa.value?.id
    if (!empresaId) {
      throw new Error('Usuário não possui empresa vinculada')
    }

    if (isEditing.value) {
      // Editar equipe existente via API
      await $fetch(`/api/equipes/${formData.value.id}`, {
        method: 'PUT',
        body: {
          nome: formData.value.name,
          descricao: formData.value.description,
          inbox_ids: formData.value.inbox_ids
        }
      })
    } else {
      // Criar nova equipe via API
      await $fetch('/api/equipes', {
        method: 'POST',
        body: {
          nome: formData.value.name,
          descricao: formData.value.description,
          empresa_id: empresaId,
          inbox_ids: formData.value.inbox_ids
        }
      })
    }

    closeModal()
    await loadData()
  } catch (error) {
    console.error('Erro ao salvar equipe:', error)
    showToast('Erro ao salvar equipe. Tente novamente.', 'error')
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

const deleteTeam = async () => {
  if (!teamToDelete.value) return

  try {
    // Excluir equipe via API
    await $fetch(`/api/equipes/${teamToDelete.value.id}`, {
      method: 'DELETE'
    })

    closeDeleteModal()
    await loadData()
  } catch (error) {
    console.error('Erro ao excluir equipe:', error)
    showToast('Erro ao excluir equipe. Tente novamente.', 'error')
  }
}

// Controle para evitar múltiplas chamadas
const dataLoaded = ref(false)

// Carregar dados quando o componente for montado e userData estiver disponível
watchEffect(() => {
  // Apenas carrega quando os dados do usuário estiverem disponíveis e ainda não foi carregado
  if (userData.value && !dataLoaded.value) {
    dataLoaded.value = true
    loadData()
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

/* Utilitário para truncamento de texto */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animações de hover para cards */
.group:hover .group-hover\:shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.group:hover .group-hover\:border-red-300 {
  border-color: rgb(209 213 219);
}

/* Transições suaves para todos os elementos interativos */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Melhorias para o visual dos cards em diferentes tamanhos de tela */
@media (max-width: 640px) {
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1025px) {
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>