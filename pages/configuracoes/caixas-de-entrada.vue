<template>
  <div class="h-full bg-gray-50">
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Cabeçalho -->
      <div class="mb-4 sm:mb-6 flex-shrink-0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Caixas de Entrada</h1>
            <p class="mt-1 text-sm text-gray-500">Gerencie as caixas de entrada do WhatsApp</p>
          </div>
          <button
            @click="openCreateModal"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Nova Caixa de Entrada
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
                placeholder="Buscar caixas de entrada..."
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
            {{ filteredInboxes.length }} {{ filteredInboxes.length === 1 ? 'caixa' : 'caixas' }}
          </div>
        </div>
      </div>

      <!-- Lista de caixas de entrada -->
      <div class="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading && inboxes.length === 0" class="flex-1 flex items-center justify-center p-12">
          <div class="text-center">
            <svg class="animate-spin mx-auto h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-sm text-gray-500">Carregando caixas de entrada...</p>
          </div>
        </div>
        
        <!-- Content -->
        <div v-else class="flex-1 overflow-y-auto custom-scrollbar-container">
          <div class="p-4 space-y-3">
            <div
              v-for="inbox in filteredInboxes"
              :key="inbox.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                  <!-- Ícone do WhatsApp -->
                  <div class="flex-shrink-0 mt-1">
                    <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <svg class="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                  </div>

                  <!-- Informações -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <h3 class="text-base font-semibold text-gray-900">{{ inbox.name }}</h3>
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        :class="getStatusClass(inbox.status)"
                      >
                        {{ getStatusText(inbox.status) }}
                      </span>
                    </div>
                    <p v-if="inbox.description" class="mt-1 text-sm text-gray-500">
                      {{ inbox.description }}
                    </p>
                    <div class="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                      <span v-if="inbox.whatsapp_phone" class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        {{ formatPhone(inbox.whatsapp_phone) }}
                      </span>
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Criada em {{ formatDate(inbox.created_at) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Ações -->
                <div class="flex items-center space-x-1 flex-shrink-0 ml-4">
                  <button
                    v-if="inbox.status === 'disconnected'"
                    @click="showQRCode(inbox)"
                    :disabled="loading"
                    class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Conectar WhatsApp"
                  >
                    <svg v-if="!loading" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                    </svg>
                    <svg v-else class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </button>
                  <button
                    v-if="inbox.status === 'connected'"
                    @click="confirmDisconnect(inbox)"
                    class="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Desconectar WhatsApp"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
                    </svg>
                  </button>
                  <button
                    @click="openEditModal(inbox)"
                    class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(inbox)"
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

            <!-- Mensagem quando não há caixas de entrada -->
            <div v-if="filteredInboxes.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma caixa de entrada encontrada</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ searchTerm ? 'Tente buscar por outro termo' : 'Comece criando uma nova caixa de entrada' }}
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
              {{ isEditing ? 'Editar Caixa de Entrada' : 'Nova Caixa de Entrada' }}
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
              Nome da Caixa de Entrada *
            </label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ex: Suporte, Vendas, Atendimento"
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
              placeholder="Adicione uma descrição para esta caixa de entrada..."
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
            @click="saveInbox"
            :disabled="loading"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </span>
            <span v-else>
              {{ isEditing ? 'Salvar Alterações' : 'Criar' }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de QR Code -->
    <div
      v-if="showQRModal"
      class="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeQRModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <!-- Cabeçalho -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Conectar WhatsApp
            </h3>
            <button
              @click="closeQRModal"
              class="text-gray-400 hover:text-gray-500"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Corpo -->
        <div class="px-6 py-6">
          <div class="text-center">
            <h4 class="text-base font-medium text-gray-900 mb-2">
              {{ selectedInbox?.name }}
            </h4>
            <p class="text-sm text-gray-500 mb-6">
              Escaneie o QR Code com seu WhatsApp para conectar
            </p>

            <!-- QR Code -->
            <div class="flex justify-center mb-6">
              <div class="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <div v-if="qrCodeData" class="w-64 h-64">
                  <!-- QR Code Real em Base64 -->
                  <img 
                    :src="`data:image/png;base64,${qrCodeData}`" 
                    alt="WhatsApp QR Code"
                    class="w-full h-full"
                  />
                </div>
                <div v-else class="w-64 h-64 bg-gray-50 flex items-center justify-center">
                  <!-- Loading spinner -->
                  <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Instruções -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h5 class="text-sm font-medium text-blue-900 mb-2">Como conectar:</h5>
              <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
                <li>Toque em <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Aponte seu celular para esta tela para capturar o código</li>
              </ol>
            </div>
          </div>
        </div>

        <!-- Rodapé -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            @click="closeQRModal"
            class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Fechar
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
              <h3 class="text-lg font-medium text-gray-900">Excluir Caixa de Entrada</h3>
              <p class="mt-2 text-sm text-gray-500">
                Tem certeza que deseja excluir a caixa de entrada <strong>"{{ inboxToDelete?.name }}"</strong>?
                Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
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
            @click="deleteInbox"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Desconexão -->
    <div
      v-if="showDisconnectModal"
      class="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeDisconnectModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="px-6 py-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-lg font-medium text-gray-900">Desconectar WhatsApp</h3>
              <p class="mt-2 text-sm text-gray-500">
                Tem certeza que deseja desconectar o WhatsApp da caixa de entrada <strong>"{{ inboxToDisconnect?.name }}"</strong>?
              </p>
              <p v-if="inboxToDisconnect?.whatsapp_phone" class="mt-2 text-sm text-gray-500">
                O número <strong>{{ formatPhone(inboxToDisconnect?.whatsapp_phone) }}</strong> será desvinculado e você precisará escanear o QR Code novamente para reconectar.
              </p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            @click="closeDisconnectModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            @click="disconnectInbox"
            class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Desconectar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInboxes } from '~/composables/useInboxes'

// Middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

// Composable
const {
  fetchInboxes,
  createInbox,
  updateInbox,
  deleteInbox: deleteInboxFromDB,
  connectInbox: connectInboxToWhatsApp,
  disconnectInbox: disconnectInboxFromWhatsApp,
  checkInboxStatus,
  subscribeToInboxChanges
} = useInboxes()

// Estado
const searchTerm = ref('')
const showModal = ref(false)
const showQRModal = ref(false)
const showDeleteModal = ref(false)
const showDisconnectModal = ref(false)
const isEditing = ref(false)
const selectedInbox = ref(null)
const inboxToDelete = ref(null)
const inboxToDisconnect = ref(null)
const loading = ref(false)
const qrCodeData = ref(null)

// Dados do formulário
const formData = ref({
  name: '',
  description: ''
})

const errors = ref({
  name: ''
})

// Dados das caixas de entrada (carregados do Supabase)
const inboxes = ref([])

// Computed
const filteredInboxes = computed(() => {
  if (!searchTerm.value) return inboxes.value
  
  const term = searchTerm.value.toLowerCase()
  return inboxes.value.filter(inbox => 
    inbox.name.toLowerCase().includes(term) ||
    (inbox.description && inbox.description.toLowerCase().includes(term)) ||
    (inbox.phoneNumber && inbox.phoneNumber.includes(term))
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

const formatPhone = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
}

const getStatusClass = (status) => {
  return status === 'connected' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  return status === 'connected' ? 'Conectado' : 'Desconectado'
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

const openEditModal = (inbox) => {
  isEditing.value = true
  formData.value = {
    id: inbox.id,
    name: inbox.name,
    description: inbox.description || ''
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

const validateForm = () => {
  let isValid = true
  errors.value = {
    name: ''
  }

  if (!formData.value.name.trim()) {
    errors.value.name = 'O nome é obrigatório'
    isValid = false
  }

  return isValid
}

const saveInbox = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    if (isEditing.value) {
      // Editar caixa de entrada existente
      await updateInbox(formData.value.id, {
        name: formData.value.name,
        description: formData.value.description
      })
      
      // Recarregar lista
      await loadInboxes()
      closeModal()
    } else {
      // Criar nova caixa de entrada
      const newInbox = await createInbox({
        name: formData.value.name,
        description: formData.value.description
      })
      
      // Recarregar lista
      await loadInboxes()
      closeModal()
      
      // Mostrar QR Code automaticamente após criar
      setTimeout(() => {
        showQRCode(newInbox)
      }, 300)
    }
  } catch (error) {
    console.error('Erro ao salvar caixa de entrada:', error)
    alert('Erro ao salvar caixa de entrada. Tente novamente.')
  } finally {
    loading.value = false
  }
}

const showQRCode = async (inbox) => {
  loading.value = true
  try {
    // Conectar ao WhatsApp e obter QR Code
    const result = await connectInboxToWhatsApp(
      inbox.id,
      inbox.name,
      inbox.whatsapp_phone
    )
    
    selectedInbox.value = result
    qrCodeData.value = result.qr_code
    showQRModal.value = true
    
    // Recarregar lista para atualizar status
    await loadInboxes()
  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error)
    alert('Erro ao gerar QR Code. Verifique sua conexão e tente novamente.')
  } finally {
    loading.value = false
  }
}

const closeQRModal = () => {
  showQRModal.value = false
  selectedInbox.value = null
  qrCodeData.value = null
}

const confirmDelete = (inbox) => {
  inboxToDelete.value = inbox
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  inboxToDelete.value = null
}

const deleteInbox = async () => {
  if (!inboxToDelete.value) return
  
  loading.value = true
  try {
    await deleteInboxFromDB(inboxToDelete.value.id)
    
    // Recarregar lista
    await loadInboxes()
    closeDeleteModal()
  } catch (error) {
    console.error('Erro ao excluir caixa de entrada:', error)
    alert('Erro ao excluir caixa de entrada. Tente novamente.')
  } finally {
    loading.value = false
  }
}

const confirmDisconnect = (inbox) => {
  inboxToDisconnect.value = inbox
  showDisconnectModal.value = true
}

const closeDisconnectModal = () => {
  showDisconnectModal.value = false
  inboxToDisconnect.value = null
}

const disconnectInbox = async () => {
  if (!inboxToDisconnect.value) return
  
  loading.value = true
  try {
    await disconnectInboxFromWhatsApp(inboxToDisconnect.value.id)
    
    // Recarregar lista
    await loadInboxes()
    closeDisconnectModal()
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error)
    alert('Erro ao desconectar WhatsApp. Tente novamente.')
  } finally {
    loading.value = false
  }
}

// Carregar caixas de entrada
const loadInboxes = async () => {
  loading.value = true
  try {
    inboxes.value = await fetchInboxes()
  } catch (error) {
    console.error('Erro ao carregar caixas de entrada:', error)
    // Não mostrar alerta se o erro for de autenticação
    if (error.message !== 'Usuário não autenticado') {
      alert('Erro ao carregar caixas de entrada.')
    }
  } finally {
    loading.value = false
  }
}

// Carregar ao montar componente usando asyncData
const supabase = useSupabaseClient()
const user = useSupabaseUser()
let channel = null

// Usar onMounted para garantir que a sessão esteja carregada
onMounted(async () => {
  // Aguardar a sessão estar completamente pronta
  await nextTick()
  
  // Verificar se o usuário está autenticado
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    // Carregar caixas de entrada
    await loadInboxes()
    
    // Subscrever a mudanças em tempo real
    channel = subscribeToInboxChanges(() => {
      loadInboxes()
    })
  } else {
    // Se não houver sessão, redirecionar para login
    await navigateTo('/')
  }
})

onUnmounted(() => {
  if (channel) {
    channel.unsubscribe()
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
