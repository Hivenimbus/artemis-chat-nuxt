<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
    <!-- Elementos de fundo decorativos -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      <div class="absolute top-40 left-1/2 w-80 h-80 bg-blue-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
    </div>

    <div class="relative z-10">
      <!-- Header -->
      <div class="bg-white/95 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold bg-gradient-to-r from-purple-900 to-indigo-600 bg-clip-text text-transparent">
                  Painel Superadmin
                </h1>
                <p class="text-sm text-gray-600">Gerenciamento de Empresas</p>
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <!-- Botão Criar Empresa (Apenas na aba Empresas) -->
              <button
                v-if="activeTab === 'companies'"
                @click="openCreateModal"
                :disabled="loading"
                class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Nova Empresa
              </button>

              <!-- Botão de atualização -->
              <button
                @click="refreshEmpresas"
                :disabled="loading"
                class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                <svg
                  class="h-4 w-4 mr-2"
                  :class="{ 'animate-spin': loading }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ loading ? 'Atualizando...' : 'Atualizar' }}
              </button>

              <!-- Botão de retorno -->
              <NuxtLink
                to="/atendimentos"
                class="inline-flex items-center px-5 py-2.5 border-2 border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md"
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
          <div class="stat-card group bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default">
            <div class="flex items-center">
              <div class="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl group-hover:from-indigo-200 group-hover:to-indigo-100 transition-colors duration-300">
                <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Usuários</p>
                <p class="text-2xl font-extrabold text-indigo-600 mt-0.5">{{ totalUsers }}</p>
              </div>
            </div>
          </div>

          <div class="stat-card group bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default">
            <div class="flex items-center">
              <div class="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl group-hover:from-blue-200 group-hover:to-blue-100 transition-colors duration-300">
                <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Empresas</p>
                <p class="text-2xl font-extrabold text-blue-600 mt-0.5">{{ empresas.length }}</p>
              </div>
            </div>
          </div>

          <div class="stat-card group bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default">
            <div class="flex items-center">
              <div class="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl group-hover:from-emerald-200 group-hover:to-emerald-100 transition-colors duration-300">
                <svg class="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresas OK</p>
                <p class="text-2xl font-extrabold text-emerald-600 mt-0.5">{{ empresasPorStatus.normal }}</p>
              </div>
            </div>
          </div>

          <div class="stat-card group bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default">
            <div class="flex items-center">
              <div class="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl group-hover:from-amber-200 group-hover:to-amber-100 transition-colors duration-300">
                <svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Atenção</p>
                <p class="text-2xl font-extrabold text-amber-600 mt-0.5">{{ empresasPorStatus.atencao + empresasPorStatus.urgente }}</p>
              </div>
            </div>
          </div>

          <div class="stat-card group bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default">
            <div class="flex items-center">
              <div class="p-3 bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl group-hover:from-rose-200 group-hover:to-rose-100 transition-colors duration-300">
                <svg class="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencidas</p>
                <p class="text-2xl font-extrabold text-rose-600 mt-0.5">{{ empresasPorStatus.vencido }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="mb-8">
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-1.5 inline-flex shadow-lg border border-white/20">
            <button
              @click="activeTab = 'users'"
              :class="[
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80',
                'inline-flex items-center px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300'
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
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80',
                'inline-flex items-center px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300'
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
          <div class="text-center animate-fade-in">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-xl mb-4">
              <svg class="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="text-white text-lg font-medium">Carregando dados...</p>
            <p class="text-white/60 text-sm mt-1">Aguarde um momento</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white/95 backdrop-blur-sm border border-rose-200 rounded-2xl p-8 mb-6 shadow-lg animate-fade-in">
          <div class="flex items-start">
            <div class="flex-shrink-0 p-3 bg-rose-100 rounded-xl">
              <svg class="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-bold text-rose-800">Erro ao carregar dados</h3>
              <p class="mt-1 text-sm text-rose-700">{{ error }}</p>
              <button
                @click="refreshEmpresas"
                class="mt-4 inline-flex items-center px-4 py-2 bg-rose-100 text-rose-700 font-semibold rounded-xl hover:bg-rose-200 transition-colors duration-200"
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
        <div v-else-if="empresas.length === 0" class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-16 text-center border border-white/20 animate-fade-in">
          <div class="mx-auto h-24 w-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <svg class="h-12 w-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">Nenhuma empresa encontrada</h3>
          <p class="text-gray-500 mb-8 max-w-md mx-auto">Não há empresas cadastradas no sistema. Comece criando sua primeira empresa.</p>
          <button 
            @click="openCreateModal"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Criar Primeira Empresa
          </button>
        </div>

        <!-- USERS TAB CONTENT -->
        <div v-else-if="activeTab === 'users'" class="space-y-6 animate-fade-in">
          <!-- Search Bar with Results Count -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="relative flex-1 max-w-xl">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="block w-full pl-11 pr-10 py-3.5 border-0 rounded-2xl leading-5 bg-white/95 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm shadow-lg transition duration-200 ease-in-out"
                placeholder="Buscar usuários por nome, email, função ou empresa..."
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="text-sm text-white/80 font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
              <span class="text-white font-bold">{{ filteredUsers.length }}</span> usuário(s) encontrado(s)
            </div>
          </div>

          <!-- Users Table -->
          <div v-if="filteredUsers.length > 0" class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Função
                    </th>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(user, index) in filteredUsers" :key="user.id" 
                      :class="[index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50']"
                      class="hover:bg-indigo-50/50 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-11 w-11">
                          <div class="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                            {{ user.nome?.charAt(0).toUpperCase() || '?' }}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-semibold text-gray-900">
                            {{ user.nome }}
                          </div>
                          <div class="text-sm text-gray-500">
                            {{ user.email }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-3 py-1 inline-flex text-xs font-bold rounded-full shadow-sm"
                        :class="{
                          'bg-gradient-to-r from-rose-500 to-pink-500 text-white': user.role === 'superadmin',
                          'bg-gradient-to-r from-blue-500 to-indigo-500 text-white': user.role === 'admin',
                          'bg-gray-200 text-gray-700': user.role !== 'superadmin' && user.role !== 'admin'
                        }">
                        {{ user.role === 'superadmin' ? 'Superadmin' : (user.role === 'admin' ? 'Admin' : 'Usuário') }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col">
                        <span class="text-sm text-gray-900 font-semibold">{{ user.empresaNome }}</span>
                        <span class="text-xs flex items-center mt-1 font-medium" :class="{
                          'text-emerald-600': user.empresaStatus === 'normal',
                          'text-amber-600': user.empresaStatus === 'atencao' || user.empresaStatus === 'urgente',
                          'text-rose-600': user.empresaStatus === 'vencido'
                        }">
                          <span class="w-2 h-2 rounded-full mr-1.5 animate-pulse" :class="{
                              'bg-emerald-500': user.empresaStatus === 'normal',
                              'bg-amber-500': user.empresaStatus === 'atencao' || user.empresaStatus === 'urgente',
                              'bg-rose-500': user.empresaStatus === 'vencido'
                          }"></span>
                          {{ user.empresaStatus === 'normal' ? 'Ativa' : (user.empresaStatus === 'vencido' ? 'Vencida' : 'Atenção') }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        @click="handleEditEmpresaClick(user.empresaId)" 
                        class="inline-flex items-center text-indigo-700 hover:text-white bg-indigo-100 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-all duration-200 text-xs font-bold shadow-sm hover:shadow-md"
                      >
                        <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- No Search Results -->
          <div v-else class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <div class="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p class="text-gray-500 mb-6">Não encontramos nenhum usuário correspondente à sua busca.</p>
            <button 
              @click="searchQuery = ''"
              class="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Limpar busca
            </button>
          </div>
        </div>

        <!-- COMPANIES TAB CONTENT -->
        <div v-else-if="activeTab === 'companies'" class="space-y-6 animate-fade-in">
          <!-- Search Bar with Results Count -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="relative flex-1 max-w-xl">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                v-model="companySearchQuery"
                type="text"
                class="block w-full pl-11 pr-10 py-3.5 border-0 rounded-2xl leading-5 bg-white/95 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm shadow-lg transition duration-200 ease-in-out"
                placeholder="Buscar empresas por nome..."
              />
              <button
                v-if="companySearchQuery"
                @click="companySearchQuery = ''"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="text-sm text-white/80 font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
              <span class="text-white font-bold">{{ filteredEmpresas.length }}</span> empresa(s) encontrada(s)
            </div>
          </div>

          <!-- Companies List -->
          <div v-if="filteredEmpresas.length > 0" class="empresas-list">
            <EmpresaListItem
              v-for="empresa in filteredEmpresas"
              :key="empresa.id"
              :empresa="empresa"
              @edit="openEditModal"
            />
          </div>

          <!-- No Search Results for Companies -->
          <div v-else class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <div class="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
            <p class="text-gray-500 mb-6">Não encontramos nenhuma empresa correspondente à sua busca.</p>
            <button 
              @click="companySearchQuery = ''"
              class="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
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
  </div>
</template>

<script setup>
// Verificar se o usuário é superadmin
const { isSuperAdmin } = useUser()

// Usar composable de empresas
const {
  loading,
  error,
  empresas,
  getEmpresas,
  createEmpresa
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

// Search State
const searchQuery = ref('')
const companySearchQuery = ref('')

// Flatten all users from companies
const allUsers = computed(() => {
  if (!empresas.value) return []
  
  return empresas.value.flatMap(empresa => {
    return (empresa.usuarios || []).map(usuario => ({
      ...usuario,
      empresaId: empresa.id,
      empresaNome: empresa.nome,
      empresaVencimento: empresa.vencimento,
      empresaStatus: empresa.statusVencimento
    }))
  })
})

// Filter users based on search
const filteredUsers = computed(() => {
  if (!searchQuery.value) return allUsers.value
  
  const query = searchQuery.value.toLowerCase()
  return allUsers.value.filter(user => 
    user.nome?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query) ||
    user.empresaNome?.toLowerCase().includes(query) ||
    user.role?.toLowerCase().includes(query)
  )
})

// Total de usuários do sistema
const totalUsers = computed(() => allUsers.value.length)

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

// Estado do modal
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedEmpresa = ref(null)

// Método para atualizar empresas
const refreshEmpresas = async () => {
  try {
    await getEmpresas()
  } catch (err) {
    console.error('Erro ao atualizar empresas:', err)
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

const handleEditEmpresaClick = (empresaId) => {
  const empresa = empresas.value.find(e => e.id === empresaId)
  if (empresa) {
    openEditModal(empresa)
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedEmpresa.value = null
}

const handleSaveEmpresa = async (empresaData) => {
  try {
    loading.value = true

    const response = await $fetch(`/api/empresas/${empresaData.id}`, {
      method: 'PUT',
      body: empresaData
    })

    if (response.success) {
      // Atualizar a lista de empresas
      await refreshEmpresas()
      // Fechar modal
      closeEditModal()

      // Mostrar mensagem de sucesso (opcional)
      console.log('Empresa atualizada com sucesso!')
    }
  } catch (err) {
    console.error('Erro ao salvar empresa:', err)
    // Aqui você pode mostrar uma notificação de erro
  } finally {
    loading.value = false
  }
}

// Middleware de proteção da página
definePageMeta({
  layout: 'auth',
  middleware: 'superadmin'
})

// Meta tags para SEO
useHead({
  title: 'Painel Superadmin - Empresas',
  meta: [
    { name: 'description', content: 'Painel de administração de empresas do sistema' }
  ]
})
</script>

<style scoped>
/* Animações customizadas */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

/* Stats Card Animation */
.stat-card {
  animation: fade-in 0.5s ease-out;
}

.stat-card:nth-child(1) { animation-delay: 0.05s; }
.stat-card:nth-child(2) { animation-delay: 0.1s; }
.stat-card:nth-child(3) { animation-delay: 0.15s; }
.stat-card:nth-child(4) { animation-delay: 0.2s; }
.stat-card:nth-child(5) { animation-delay: 0.25s; }

/* Empresas List Styles */
.empresas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>