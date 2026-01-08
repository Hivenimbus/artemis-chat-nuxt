<template>
  <div class="h-full bg-gray-50">
    <!-- Conteúdo principal -->
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Filtros e Ações -->
      <div class="bg-white shadow rounded-lg mb-4 sm:mb-6 flex-shrink-0 flex flex-col h-full">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div class="flex-1 max-w-lg">
                  <div class="relative">
                    <input
                      type="text"
                      v-model="searchTerm"
                      placeholder="Buscar contatos..."
                      class="w-full pl-10 pr-4 py-2 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="relative">
                  <button
                    @click="showTagFilter = !showTagFilter"
                    :class="[
                      'p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors',
                      showTagFilter || selectedTags.length > 0
                        ? 'text-indigo-600 border-indigo-300 bg-indigo-50'
                        : 'text-gray-400 hover:text-gray-600 border-gray-300 hover:bg-gray-50'
                    ]"
                    title="Filtrar por tags"
                  >
                    <div class="relative">
                      <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                      </svg>
                      <!-- Badge indicando contagem de filtros -->
                      <span v-if="selectedTags.length > 0" class="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                        {{ selectedTags.length }}
                      </span>
                    </div>
                  </button>

                  <!-- Dropdown de Tags -->
                  <div
                    v-if="showTagFilter"
                    class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20"
                  >
                    <div class="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
                      <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtrar por Tags</span>
                      <button 
                        v-if="selectedTags.length > 0"
                        @click="selectedTags = []"
                        class="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Limpar
                      </button>
                    </div>
                    
                    <div class="max-h-60 overflow-y-auto px-1">
                      <div v-if="availableTags.length === 0" class="px-4 py-3 text-sm text-gray-500 text-center">
                        Nenhuma etiqueta disponível
                      </div>
                      
                      <label
                        v-for="tag in availableTags"
                        :key="tag.id"
                        class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md m-1"
                      >
                        <input
                          type="checkbox"
                          :value="tag.id"
                          v-model="selectedTags"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span 
                          class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          :class="tag.color.startsWith('#') ? '' : tag.color"
                          :style="tag.color.startsWith('#') ? { backgroundColor: tag.color + '20', color: tag.color } : {}"
                        >
                          {{ tag.name }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-0 sm:mt-0">
              <button
                @click="openCreateModal"
                class="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="-ml-1 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <span class="hidden sm:inline">Novo Contato</span>
                <span class="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de Contatos em Cards -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Container da lista com scroll customizado -->
          <div class="flex-1 p-2 sm:p-4 custom-scrollbar-container rounded-b-lg">
            <!-- Estado de Loading -->
            <div v-if="loading" class="flex items-center justify-center py-12">
              <div class="flex flex-col items-center space-y-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span class="text-sm text-gray-500">Carregando contatos...</span>
              </div>
            </div>

            <!-- Estado de Erro -->
            <div v-else-if="error" class="flex items-center justify-center py-12">
              <div class="flex flex-col items-center space-y-4 text-center">
                <svg class="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Erro ao carregar contatos</h3>
                  <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
                </div>
                <button
                  @click="loadContatos"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Tentar novamente
                </button>
              </div>
            </div>

            <!-- Lista de Contatos -->
            <div v-else-if="contacts.length > 0" class="space-y-2 sm:space-y-3">
              <div
                v-for="contact in paginatedContacts"
                :key="contact.id"
                class="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mr-2 sm:mr-0 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-center justify-between">
                  <!-- Informações do Contato -->
                  <div class="flex items-start sm:items-center flex-1 min-w-0 pr-2">
                    <div class="flex-shrink-0">
                      <div v-if="contact.profilePictureUrl" class="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden">
                        <img :src="contact.profilePictureUrl" alt="Foto de perfil" class="h-full w-full object-cover" />
                      </div>
                      <div v-else class="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                        {{ getInitials(contact.name) }}
                      </div>
                    </div>

                    <div class="ml-3 sm:ml-4 flex-1 min-w-0">
                      <h3 class="text-sm sm:text-base font-semibold text-gray-900 truncate mb-1 sm:mb-2">{{ contact.name }}</h3>
                      <div class="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                        <span class="flex items-center truncate">
                          <svg class="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                          <span class="truncate">{{ contact.email }}</span>
                        </span>
                        <span class="flex items-center">
                          <svg class="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                          </svg>
                          {{ formatPhone(contact.phone) }}
                        </span>
                        <NuxtLink
                          :to="`/contato/${contact.id}`"
                          class="text-blue-600 hover:text-blue-900 text-xs sm:text-sm font-medium transition-colors"
                        >
                          ver mais
                        </NuxtLink>
                      </div>
                      <div class="mt-2">
                        <TagEditor
                          :tags="contact.tags"
                          :available-tags="availableTags"
                          :editing="editingContactTags === contact.id"
                          @toggle-edit="toggleTagsEdit(contact.id)"
                          @update-tags="updateContactTags(contact.id, $event)"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Ações -->
                  <div class="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <NuxtLink :to="`/atendimentos?contact=${contact.id}`" class="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors">
                      <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </NuxtLink>
                    <button
                      @click="confirmDeleteContact(contact)"
                      class="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir contato"
                    >
                      <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                    <button
                      @click="toggleContactExpansion(contact.id)"
                      class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <svg
                        :class="[
                          'h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200',
                          expandedContacts.includes(contact.id) ? 'rotate-180' : ''
                        ]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Formulário de Edição (Expansível) -->
                <div
                  :class="[
                    'form-expansion-container',
                    expandedContacts.includes(contact.id) ? 'expanded' : 'collapsed'
                  ]"
                >
                  <form @submit.prevent="updateContact(contact.id)" class="space-y-4">
                    <!-- Primeiro Grid: Nome e Sobrenome -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Nome -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Nome
                        </label>
                        <input
                          v-model="contact.name"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <!-- Sobrenome -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Sobrenome
                        </label>
                        <input
                          v-model="contact.lastName"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <!-- Segundo Grid: Email e Telefone -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Email -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          v-model="contact.email"
                          type="email"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <!-- Telefone -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          v-model="contact.phone"
                          type="tel"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <!-- Terceiro Grid: Cidade e País -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Cidade -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Cidade
                        </label>
                        <input
                          v-model="contact.city"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <!-- País -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          País
                        </label>
                        <input
                          v-model="contact.country"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <!-- Quarto Grid: Empresa e Endereço -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Empresa -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Empresa
                        </label>
                        <input
                          v-model="contact.company"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <!-- Endereço -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Endereço
                        </label>
                        <input
                          v-model="contact.address"
                          type="text"
                          placeholder="Rua, número, complemento..."
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <!-- Quinto Grid: Biografia (largura completa) -->
                    <div class="form-field">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Biografia
                      </label>
                      <textarea
                        v-model="contact.biography"
                        rows="3"
                        placeholder="Informações adicionais sobre o contato..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      ></textarea>
                    </div>

                    <!-- Botão de Atualizar -->
                    <div class="form-field flex justify-end">
                      <button
                        type="submit"
                        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Atualizar Contato
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Estado Vazio -->
            <div v-else class="flex items-center justify-center py-12">
              <div class="flex flex-col items-center space-y-4 text-center">
                <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Nenhum contato encontrado</h3>
                  <p class="mt-1 text-sm text-gray-500">
                    {{ searchTerm ? 'Tente uma busca diferente' : 'Comece criando seu primeiro contato' }}
                  </p>
                </div>
                <button
                  v-if="!searchTerm"
                  @click="openCreateModal"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  Novo Contato
                </button>
              </div>
            </div>
          </div>

          <!-- Paginação (fora do container de scroll) -->
          <div class="border-t border-gray-200 bg-white px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 flex-shrink-0 rounded-b-lg">
            <!-- Informações de contatos exibidos -->
            <div class="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              <span v-if="totalItems > 0">
                Mostrando {{ startItem }}-{{ endItem }} de {{ totalItems }} contatos
              </span>
              <span v-else>
                Nenhum contato encontrado
              </span>
            </div>

            <!-- Controles de paginação -->
            <div class="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
              <!-- Botão Anterior -->
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <svg class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                <span class="hidden sm:inline">Anterior</span>
                <span class="sm:hidden">◀</span>
              </button>

              <!-- Números das páginas -->
              <div class="flex items-center space-x-1">
                <button
                  v-for="page in Math.min(totalPages, 5)"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md',
                    currentPage === page
                      ? 'bg-indigo-600 text-white border border-indigo-600'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>

                <!-- Indicador de páginas extras -->
                <span v-if="totalPages > 5" class="text-gray-500 text-xs sm:text-sm px-1 sm:px-2">...</span>
              </div>

              <!-- Botão Próximo -->
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <span class="hidden sm:inline">Próximo</span>
                <span class="sm:hidden">▶</span>
                <svg class="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Criação de Contato -->
    <ContactCreateModal
      v-if="showCreateModal"
      @save="handleCreateContact"
      @close="showCreateModal = false"
    />

    <!-- Modal de Confirmação de Exclusão -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 backdrop-blur-[2px] bg-opacity-20 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
            <p class="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        <div class="mb-6">
          <p class="text-gray-700">
            Tem certeza que deseja excluir o contato
            <span class="font-semibold text-gray-900">"{{ contactToDelete?.name }}"</span>?
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Todas as informações e histórico deste contato serão permanentemente removidos.
          </p>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="cancelDelete"
            :disabled="deleteLoading"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            @click="executeDeleteContact"
            :disabled="deleteLoading"
            class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg v-if="deleteLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ deleteLoading ? 'Excluindo...' : 'Excluir Contato' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Composables
const { fetchContatos, updateContato, deleteContato, fetchEtiquetas } = useContatos()
const { showToast } = useToast()

// Estado de dados
const contacts = ref([])
const searchTerm = ref('')
const selectedTags = ref([])
const showTagFilter = ref(false)
const availableTags = ref([])

// Estado de exclusão
const showDeleteModal = ref(false)
const contactToDelete = ref(null)
const deleteLoading = ref(false)

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)

// Estado de expansão dos cards
const expandedContacts = ref([])

// Estado do modal de criação
const showCreateModal = ref(false)

// Estado de edição de tags nos cards
const editingContactTags = ref(null)

// Estado de loading
const loading = ref(false)
const error = ref(null)

// Computados
const filteredContacts = computed(() => {
  // A filtragem agora é feita no backend via API
  return contacts.value
})

const paginatedContacts = computed(() => {
  // Paginação agora é feita no backend via API
  return contacts.value
})

const startItem = computed(() => {
  return totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return end > totalItems.value ? totalItems.value : end
})

const vipContactsCount = computed(() =>
  contacts.value.filter(c => c.tags.includes('VIP')).length
)

// Métodos de busca e carregamento
const loadContatos = async () => {
  try {
    loading.value = true
    error.value = null

    const result = await fetchContatos({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchTerm.value,
      tags: selectedTags.value
    })

    contacts.value = result.contatos
    totalItems.value = result.pagination.totalItems
    totalPages.value = result.pagination.totalPages

  } catch (err) {
    console.error('Erro ao carregar contatos:', err)
    error.value = err.message || 'Erro ao carregar contatos'
  } finally {
    loading.value = false
  }
}

const loadEtiquetas = async () => {
  try {
    availableTags.value = await fetchEtiquetas()
  } catch (err) {
    console.error('Erro ao carregar etiquetas:', err)
    // Usar tags padrão em caso de erro
    availableTags.value = ['VIP', 'Cliente', 'Novo Lead', 'Empresa']
  }
}

// Métodos utilitários
const getInitials = (name) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

const formatDate = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `Há ${days} dias`

  return new Date(date).toLocaleDateString('pt-BR')
}

const getTagColor = (tag) => {
  const colors = {
    'VIP': 'bg-purple-100 text-purple-800',
    'Cliente': 'bg-blue-100 text-blue-800',
    'Novo Lead': 'bg-green-100 text-green-800',
    'Inativo': 'bg-red-100 text-red-800',
    'Empresa': 'bg-indigo-100 text-indigo-800'
  }
  return colors[tag] || 'bg-gray-100 text-gray-800'
}

// Métodos de expansão de cards
const toggleContactExpansion = (contactId) => {
  const index = expandedContacts.value.indexOf(contactId)
  if (index > -1) {
    expandedContacts.value.splice(index, 1)
  } else {
    expandedContacts.value.push(contactId)
  }
}

// Método de atualização de contato
const updateContact = async (contactId) => {
  try {
    // Encontrar o contato no array
    const contactIndex = contacts.value.findIndex(c => c.id === contactId)

    if (contactIndex === -1) {
      throw new Error('Contato não encontrado')
    }

    const contactData = contacts.value[contactIndex]

    // Normalizar tags: extrair apenas os nomes para enviar à API
    const normalizedTags = (contactData.tags || []).map(tag => {
      if (typeof tag === 'object' && tag.name) {
        return tag.name
      }
      return tag
    })

    // Preparar dados para API
    const updateData = {
      nome: contactData.name,
      sobrenome: contactData.lastName,
      email: contactData.email,
      telefone: contactData.phone,
      cidade: contactData.city,
      pais: contactData.country,
      biografia: contactData.biography,
      empresa: contactData.company,
      endereco: contactData.address,
      tags: normalizedTags
    }

    // Chamar API de atualização
    const updatedContact = await updateContato(contactId, updateData)

    // Atualizar contato no array local
    contacts.value[contactIndex] = updatedContact

    // Mostrar toast de sucesso
    showToast(`Contato "${updatedContact.name}" atualizado com sucesso!`, 'success')

    // Colapsar o card após atualizar
    const expandedIndex = expandedContacts.value.indexOf(contactId)
    if (expandedIndex > -1) {
      expandedContacts.value.splice(expandedIndex, 1)
    }

  } catch (err) {
    console.error('Erro ao atualizar contato:', err)
    error.value = err.message || 'Erro ao atualizar contato'
  }
}

// Método de criação de contato
const handleCreateContact = (newContact) => {
  // Adicionar ao início da lista
  contacts.value.unshift(newContact)
  totalItems.value++
}

// Método para abrir modal de criação
const openCreateModal = () => {
  // Abrir modal
  showCreateModal.value = true
}

// Métodos de edição de tags
const toggleTagsEdit = async (contactId) => {
  if (editingContactTags.value === contactId) {
    editingContactTags.value = null
  } else {
    editingContactTags.value = contactId
  }
}

const updateContactTags = async (contactId, newTags) => {
  try {
    // Encontrar o contato no array
    const contactIndex = contacts.value.findIndex(c => c.id === contactId)

    if (contactIndex === -1) {
      throw new Error('Contato não encontrado')
    }

    const contactData = contacts.value[contactIndex]

    // Normalizar tags: extrair apenas os nomes para enviar à API
    const normalizedTags = newTags.map(tag => {
      if (typeof tag === 'object' && tag.name) {
        return tag.name
      }
      return tag
    })

    // Preparar dados para API (apenas tags)
    const updateData = {
      nome: contactData.name,
      sobrenome: contactData.lastName,
      email: contactData.email,
      telefone: contactData.phone,
      cidade: contactData.city,
      pais: contactData.country,
      biografia: contactData.biography,
      empresa: contactData.company,
      endereco: contactData.address,
      tags: normalizedTags
    }

    // Chamar API de atualização
    const updatedContact = await updateContato(contactId, updateData)

    // Atualizar contato no array local
    contacts.value[contactIndex] = updatedContact

    // Sair do modo de edição
    editingContactTags.value = null

  } catch (err) {
    console.error('Erro ao atualizar tags do contato:', err)
    error.value = err.message || 'Erro ao atualizar tags'
  }
}

// Métodos de exclusão
const confirmDeleteContact = (contact) => {
  contactToDelete.value = contact
  showDeleteModal.value = true
}

const cancelDelete = () => {
  contactToDelete.value = null
  showDeleteModal.value = false
}

const executeDeleteContact = async () => {
  if (!contactToDelete.value) return

  try {
    deleteLoading.value = true
    error.value = null

    await deleteContato(contactToDelete.value.id)

    // Remover contato do array local
    const index = contacts.value.findIndex(c => c.id === contactToDelete.value.id)
    if (index > -1) {
      contacts.value.splice(index, 1)
      totalItems.value--
    }

    // Mostrar toast de sucesso
    showToast(`Contato "${contactToDelete.value.name}" excluído com sucesso!`, 'success')

    // Fechar modal
    showDeleteModal.value = false
    contactToDelete.value = null

  } catch (err) {
    console.error('Erro ao excluir contato:', err)
    error.value = err.message || 'Erro ao excluir contato'
  } finally {
    deleteLoading.value = false
  }
}

// Métodos de paginação
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Watchers
watch(searchTerm, () => {
  currentPage.value = 1
}, { debounce: 300 })

watch(selectedTags, () => {
  currentPage.value = 1
  loadContatos()
}, { deep: true })

watch([currentPage, searchTerm], () => {
  loadContatos()
})

// Carregar dados iniciais
onMounted(async () => {
  await Promise.all([
    loadEtiquetas(),
    loadContatos()
  ])
})

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

// Meta tags da página
useHead({
  title: 'Contatos - Artemis',
  meta: [
    { name: 'description', content: 'Gerencie sua lista de contatos' }
  ]
})
</script>

<style scoped>
/* Custom scrollbar que só aparece ao passar o mouse */
.custom-scrollbar-container {
  scrollbar-color: transparent transparent;
  overflow: overlay;
  overflow-y: auto;
  transition: scrollbar-color 0.3s ease;
  margin-right: 0;
  padding-right: 0;
  -webkit-overflow-scrolling: touch; /* Melhora a experiência de scroll em iOS */
}

/* Chrome, Safari e Edge */
.custom-scrollbar-container::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}

.custom-scrollbar-container::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-container::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

/* Ao passar o mouse, mostra a scrollbar */
.custom-scrollbar-container:hover {
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar-container:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
}

/* Scrollbar mais visível quando ativamente em uso */
.custom-scrollbar-container:hover::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.7);
}

/* Melhorias para dispositivos móveis */
@media (max-width: 640px) {
  /* Evita zoom horizontal em iOS */
  .custom-scrollbar-container {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  /* Melhora a performance de scroll */
  .custom-scrollbar-container {
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
  }
}

/* Animação fluida de expansão de formulário */
.form-expansion-container {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: max-height, opacity, transform;
  border-top: 1px solid transparent;
  margin-top: 0;
  padding-top: 0;
}

.form-expansion-container.expanded {
  max-height: 600px;
  opacity: 1;
  transform: translateY(0);
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
  padding-top: 1rem;
}

.form-expansion-container.collapsed {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
  border-top: 1px solid transparent;
  margin-top: 0;
  padding-top: 0;
}

/* Animações stagger para campos do formulário */
.form-expansion-container.expanded .form-field {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.form-expansion-container.expanded .form-field:nth-child(1) { animation-delay: 0.05s; }
.form-expansion-container.expanded .form-field:nth-child(2) { animation-delay: 0.1s; }
.form-expansion-container.expanded .form-field:nth-child(3) { animation-delay: 0.15s; }
.form-expansion-container.expanded .form-field:nth-child(4) { animation-delay: 0.2s; }
.form-expansion-container.expanded .form-field:nth-child(5) { animation-delay: 0.25s; }
.form-expansion-container.expanded .form-field:nth-child(6) { animation-delay: 0.3s; }
.form-expansion-container.expanded .form-field:nth-child(7) { animation-delay: 0.35s; }
.form-expansion-container.expanded .form-field:nth-child(8) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Melhorias de performance e micro-interações */
.form-expansion-container input,
.form-expansion-container textarea {
  transition: all 0.2s ease;
  will-change: border-color, box-shadow;
}

.form-expansion-container input:focus,
.form-expansion-container textarea:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.form-expansion-container button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
}

.form-expansion-container button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.form-expansion-container button:active {
  transform: translateY(0);
}

/* Animação para o botão de expandir/colapsar */
.transition-transform {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Melhorias para mobile */
@media (max-width: 640px) {
  .form-expansion-container.expanded {
    max-height: 800px;
  }

  .form-expansion-container input:focus,
  .form-expansion-container textarea:focus {
    transform: none;
  }
}

</style>