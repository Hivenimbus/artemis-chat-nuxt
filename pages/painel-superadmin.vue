<template>
  <div class="min-h-screen bg-gray-50">
    <div>
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  Painel Superadmin
                </h1>
                <p class="text-sm text-gray-500">Gerenciamento de Empresas</p>
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <!-- Botão Criar Empresa (Apenas na aba Empresas) -->
              <button
                v-if="activeTab === 'companies'"
                @click="openCreateModal"
                :disabled="loading"
                class="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200 disabled:opacity-50"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Nova Empresa
              </button>

              <!-- Botão de atualização -->
              <button
                @click="refreshData"
                :disabled="loading || usersLoading"
                class="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50"
              >
                <svg
                  class="h-4 w-4 mr-2"
                  :class="{ 'animate-spin': loading || usersLoading }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ (loading || usersLoading) ? 'Atualizando...' : 'Atualizar' }}
              </button>

              <!-- Botão de retorno -->
              <NuxtLink
                to="/atendimentos"
                class="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Voltar
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center">
              <div class="p-3 bg-indigo-50 rounded-lg">
                <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Usuários</p>
                <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ totalUsers }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center">
              <div class="p-3 bg-blue-50 rounded-lg">
                <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Empresas</p>
                <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ empresas.length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center">
              <div class="p-3 bg-emerald-50 rounded-lg">
                <svg class="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Empresas OK</p>
                <p class="text-2xl font-bold text-emerald-600 mt-0.5">{{ empresasPorStatus.normal }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center">
              <div class="p-3 bg-amber-50 rounded-lg">
                <svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Atenção</p>
                <p class="text-2xl font-bold text-amber-600 mt-0.5">{{ empresasPorStatus.atencao + empresasPorStatus.urgente }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center">
              <div class="p-3 bg-rose-50 rounded-lg">
                <svg class="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Vencidas</p>
                <p class="text-2xl font-bold text-rose-600 mt-0.5">{{ empresasPorStatus.vencido }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="mb-8">
          <div class="bg-white rounded-lg p-1 inline-flex shadow-sm border border-gray-200">
            <button
              @click="activeTab = 'users'"
              :class="[
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                'inline-flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200'
              ]"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              Usuários
            </button>
            <button
              @click="activeTab = 'companies'"
              :class="[
                activeTab === 'companies'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                'inline-flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200'
              ]"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Empresas
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && empresas.length === 0" class="flex justify-center items-center py-16">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-4">
              <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="text-gray-700 text-lg font-medium">Carregando dados...</p>
            <p class="text-gray-500 text-sm mt-1">Aguarde um momento</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white border border-rose-200 rounded-xl p-6 mb-6 shadow-sm">
          <div class="flex items-start">
            <div class="flex-shrink-0 p-2 bg-rose-50 rounded-lg">
              <svg class="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-rose-800">Erro ao carregar dados</h3>
              <p class="mt-1 text-sm text-rose-700">{{ error }}</p>
              <button
                @click="getEmpresas"
                class="mt-4 inline-flex items-center px-4 py-2 bg-rose-50 text-rose-700 font-medium rounded-lg hover:bg-rose-100 transition-colors duration-200"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Tentar novamente
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="empresas.length === 0" class="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div class="mx-auto h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <svg class="h-10 w-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
          <p class="text-gray-500 mb-6 max-w-md mx-auto">Não há empresas cadastradas no sistema. Comece criando sua primeira empresa.</p>
          <button 
            @click="openCreateModal"
            class="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-200"
          >
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Criar Primeira Empresa
          </button>
        </div>

        <!-- USERS TAB CONTENT -->
        <div v-else-if="activeTab === 'users'" class="space-y-6">
          <!-- Search Bar with Results Count -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="relative flex-1 max-w-xl">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-200"
                placeholder="Buscar usuários por nome, email, função ou empresa..."
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="text-sm text-gray-600 font-medium bg-gray-100 px-4 py-2 rounded-lg">
              <span class="text-gray-900 font-semibold">{{ filteredUsers.length }}</span> usuário(s) encontrado(s)
            </div>
          </div>

          <!-- Users Table -->
          <div v-if="filteredUsers.length > 0" class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Função
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(user, index) in filteredUsers" :key="user.id" 
                      class="hover:bg-gray-50 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                            {{ user.nome?.charAt(0).toUpperCase() || '?' }}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {{ user.nome }}
                          </div>
                          <div class="text-sm text-gray-500">
                            {{ user.email }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2.5 py-1 inline-flex text-xs font-medium rounded-full"
                        :class="{
                          'bg-rose-100 text-rose-700': user.role === 'superadmin',
                          'bg-indigo-100 text-indigo-700': user.role === 'admin',
                          'bg-gray-100 text-gray-700': user.role !== 'superadmin' && user.role !== 'admin'
                        }">
                        {{ user.role === 'superadmin' ? 'Superadmin' : (user.role === 'admin' ? 'Admin' : 'Usuário') }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2.5 py-1 inline-flex text-xs font-medium rounded-full"
                        :class="{
                          'bg-emerald-100 text-emerald-700': user.status === 'active',
                          'bg-amber-100 text-amber-700': user.status === 'pending',
                          'bg-gray-100 text-gray-600': user.status === 'inactive'
                        }">
                        {{ user.status === 'active' ? 'Ativo' : (user.status === 'pending' ? 'Pendente' : 'Inativo') }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div v-if="user.empresaNome" class="flex flex-col">
                        <span class="text-sm text-gray-900 font-medium">{{ user.empresaNome }}</span>
                        <span class="text-xs flex items-center mt-1" :class="{
                          'text-emerald-600': user.empresaStatus === 'normal',
                          'text-amber-600': user.empresaStatus === 'atencao' || user.empresaStatus === 'urgente',
                          'text-rose-600': user.empresaStatus === 'vencido'
                        }">
                          <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="{
                              'bg-emerald-500': user.empresaStatus === 'normal',
                              'bg-amber-500': user.empresaStatus === 'atencao' || user.empresaStatus === 'urgente',
                              'bg-rose-500': user.empresaStatus === 'vencido'
                          }"></span>
                          {{ user.empresaStatus === 'normal' ? 'Ativa' : (user.empresaStatus === 'vencido' ? 'Vencida' : 'Atenção') }}
                        </span>
                      </div>
                      <div v-else class="flex flex-col">
                        <span class="text-sm text-gray-400 italic">Sem empresa</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end space-x-2">
                        <button 
                          @click="openUserEditModal(user)" 
                          class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                          title="Editar Usuário"
                        >
                          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          @click="handleDeleteUser(user)" 
                          class="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200"
                          title="Excluir Usuário"
                        >
                          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- No Search Results -->
          <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-200">
            <div class="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p class="text-gray-500 mb-5">Não encontramos nenhum usuário correspondente à sua busca.</p>
            <button 
              @click="searchQuery = ''"
              class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Limpar busca
            </button>
          </div>
        </div>

        <!-- COMPANIES TAB CONTENT -->
        <div v-else-if="activeTab === 'companies'" class="space-y-6">
          <!-- Search Bar with Results Count -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="relative flex-1 max-w-xl">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                v-model="companySearchQuery"
                type="text"
                class="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-200"
                placeholder="Buscar empresas por nome..."
              />
              <button
                v-if="companySearchQuery"
                @click="companySearchQuery = ''"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="text-sm text-gray-600 font-medium bg-gray-100 px-4 py-2 rounded-lg">
              <span class="text-gray-900 font-semibold">{{ filteredEmpresas.length }}</span> empresa(s) encontrada(s)
            </div>
          </div>

          <!-- Companies Table -->
          <div v-if="filteredEmpresas.length > 0" class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Usuários
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(empresa, index) in filteredEmpresas" :key="empresa.id" 
                      class="hover:bg-gray-50 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {{ empresa.nome?.charAt(0).toUpperCase() || '?' }}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {{ empresa.nome }}
                          </div>
                          <div class="text-sm text-gray-500">
                            Criada em {{ formatarData(empresa.criadaEm) }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-sm text-gray-900">{{ formatarData(empresa.vencimento) }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span class="text-sm font-medium" :class="{
                          'text-rose-600': empresa.totalUsuarios >= empresa.maxUsuarios,
                          'text-amber-600': empresa.totalUsuarios >= empresa.maxUsuarios * 0.8 && empresa.totalUsuarios < empresa.maxUsuarios,
                          'text-gray-900': empresa.totalUsuarios < empresa.maxUsuarios * 0.8
                        }">{{ empresa.totalUsuarios }} / {{ empresa.maxUsuarios }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2.5 py-1 inline-flex text-xs font-medium rounded-full items-center"
                        :class="{
                          'bg-emerald-100 text-emerald-700': empresa.statusVencimento === 'normal',
                          'bg-amber-100 text-amber-700': empresa.statusVencimento === 'atencao',
                          'bg-orange-100 text-orange-700': empresa.statusVencimento === 'urgente',
                          'bg-rose-100 text-rose-700': empresa.statusVencimento === 'vencido'
                        }">
                        <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="{
                          'bg-emerald-500': empresa.statusVencimento === 'normal',
                          'bg-amber-500': empresa.statusVencimento === 'atencao',
                          'bg-orange-500': empresa.statusVencimento === 'urgente',
                          'bg-rose-500': empresa.statusVencimento === 'vencido'
                        }"></span>
                        {{ getTextoStatusVencimento(empresa.statusVencimento, empresa.diasParaVencimento) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end">
                        <button 
                          @click="openEditModal(empresa)" 
                          class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                          title="Editar Empresa"
                        >
                          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- No Search Results for Companies -->
          <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-200">
            <div class="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
            <p class="text-gray-500 mb-5">Não encontramos nenhuma empresa correspondente à sua busca.</p>
            <button 
              @click="companySearchQuery = ''"
              class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Limpar busca
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <EmpresaCreateModal
      v-if="showCreateModal"
      @save="handleCreateEmpresa"
      @close="closeCreateModal"
    />

    <!-- Edit Modal -->
    <EmpresaEditModal
      v-if="showEditModal"
      :empresa="selectedEmpresa"
      @save="handleSaveEmpresa"
      @close="closeEditModal"
    />

    <!-- User Edit Modal -->
    <UserEditModal
      v-if="showUserEditModal"
      :user="selectedUser"
      :empresas="empresas"
      @save="handleSaveUser"
      @close="closeUserEditModal"
    />
  </div>
</template>

<script setup>
// Verificar se o usuário é superadmin
const { isSuperAdmin } = useUser()
const { showToast } = useToast()
const { confirm } = useConfirm()

// Usar composable de empresas
const {
  loading,
  error,
  empresas,
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  formatarData,
  getTextoStatusVencimento
} = useEmpresas()

// Computar estatísticas por status
const empresasPorStatus = computed(() => {
  const stats = {
    normal: 0,
    atencao: 0,
    urgente: 0,
    vencido: 0
  }

  empresas.value.forEach(empresa => {
    stats[empresa.statusVencimento]++
  })

  return stats
})

// Users State
const usersList = ref([])
const usersLoading = ref(false)
const usersError = ref(null)

const getUsers = async () => {
  usersLoading.value = true
  usersError.value = null
  try {
    const response = await $fetch('/api/admin/users')
    if (response.success) {
      usersList.value = response.data
    }
  } catch (err) {
    console.error('Erro ao buscar usuários:', err)
    usersError.value = err.message || 'Erro ao carregar usuários'
  } finally {
    usersLoading.value = false
  }
}

// Search State
const searchQuery = ref('')
const companySearchQuery = ref('')

// Filter users based on search
const filteredUsers = computed(() => {
  if (!searchQuery.value) return usersList.value
  
  const query = searchQuery.value.toLowerCase()
  return usersList.value.filter(user => 
    user.nome?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query) ||
    user.empresaNome?.toLowerCase().includes(query) ||
    user.role?.toLowerCase().includes(query)
  )
})

// Total de usuários do sistema
const totalUsers = computed(() => usersList.value.length)

// Filter companies based on search
const filteredEmpresas = computed(() => {
  if (!companySearchQuery.value) return empresas.value
  
  const query = companySearchQuery.value.toLowerCase()
  return empresas.value.filter(empresa => 
    empresa.nome?.toLowerCase().includes(query)
  )
})

// Active Tab State
const activeTab = ref('users') // 'users' or 'companies'

// Initial fetch
onMounted(() => {
  // Carregar dados iniciais
  getEmpresas() // Mantemos para as estatísticas de empresas
  getUsers()
})

// Estado do modal
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedEmpresa = ref(null)

// User Edit State
const showUserEditModal = ref(false)
const selectedUser = ref(null)

// Método para atualizar dados
const refreshData = async () => {
  try {
    await Promise.all([
      getEmpresas(),
      getUsers()
    ])
  } catch (err) {
    console.error('Erro ao atualizar dados:', err)
  }
}

// Métodos do modal de criação
const openCreateModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const handleCreateEmpresa = async (empresaData) => {
  try {
    await createEmpresa(empresaData)
    // Fechar modal
    closeCreateModal()
    // Mostrar mensagem de sucesso (opcional)
    console.log('Empresa criada com sucesso!')
  } catch (err) {
    console.error('Erro ao criar empresa:', err)
    // Aqui você pode mostrar uma notificação de erro
  }
}

// Métodos do modal de edição
const openEditModal = (empresa) => {
  selectedEmpresa.value = empresa
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedEmpresa.value = null
}

const handleSaveEmpresa = async (empresaData) => {
  try {
    const response = await updateEmpresa(empresaData.id, empresaData)

    if (response.success) {
      // Fechar modal
      closeEditModal()
      // Mostrar mensagem de sucesso (opcional)
      console.log('Empresa atualizada com sucesso!')
    }
  } catch (err) {
    console.error('Erro ao salvar empresa:', err)
    // O erro já é tratado no composable (armazenado em error.value)
  }
}

// Métodos de Usuário
const openUserEditModal = (user) => {
  selectedUser.value = user
  showUserEditModal.value = true
}

const closeUserEditModal = () => {
  showUserEditModal.value = false
  selectedUser.value = null
}

const handleSaveUser = async (userData) => {
  try {
    const response = await $fetch(`/api/admin/users/${userData.id}`, {
      method: 'PUT',
      body: userData
    })

    if (response.success) {
      await getUsers()
      closeUserEditModal()
      showToast('Usuário salvo com sucesso!', 'success')
    }
  } catch (err) {
    console.error('Erro ao salvar usuário:', err)
    showToast(err.statusMessage || 'Erro ao salvar usuário', 'error')
  }
}

const handleDeleteUser = async (user) => {
  const confirmed = await confirm({
    message: `Tem certeza que deseja excluir o usuário "${user.nome}"? Esta ação não pode ser desfeita.`,
    title: 'Excluir Usuário',
    type: 'danger',
    confirmText: 'Excluir'
  })
  
  if (!confirmed) return

  try {
    const response = await $fetch(`/api/admin/users/${user.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      await getUsers()
      showToast('Usuário excluído com sucesso!', 'success')
    }
  } catch (err) {
    console.error('Erro ao excluir usuário:', err)
    showToast(err.statusMessage || 'Erro ao excluir usuário', 'error')
  }
}

// Middleware de proteção da página
definePageMeta({
  layout: 'auth',
  middleware: 'superadmin'
})

// Meta tags para SEO
useHead({
  title: 'Painel Superadmin',
  meta: [
    { name: 'description', content: 'Painel de administração de empresas do sistema' }
  ]
})
</script>

<style scoped>
/* Estilos mínimos para transições suaves */
</style>