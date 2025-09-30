<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- Header principal com navbar de caixas de entrada -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center">
        <h1 class="text-xl font-bold text-gray-900">Atendimentos</h1>

        <!-- Dropdown de Caixa de Entrada -->
        <div class="relative">
          <button
            @click="toggleCaixaEntradaDropdown"
            class="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 ml-4"
            title="Selecionar caixa de entrada"
          >
            <!-- Ícone de caixa de entrada -->
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <span>{{ selectedCaixaEntrada }}</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showCaixaEntradaDropdown"
            v-click-outside="closeCaixaEntradaDropdown"
            class="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div class="p-3">
              <p class="text-sm font-medium text-gray-900 mb-3">Selecionar Caixa de Entrada</p>

              <!-- Barra de Pesquisa -->
              <div class="mb-3">
                <input
                  v-model="searchCaixaEntrada"
                  type="text"
                  placeholder="Pesquisar caixa de entrada..."
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <!-- Lista de Caixas de Entrada -->
              <div class="max-h-60 overflow-y-auto">
                <div class="space-y-1">
                  <button
                    v-for="caixa in filteredCaixaEntradaOptions"
                    :key="caixa.value"
                    @click="selectCaixaEntrada(caixa.value)"
                    :class="[
                      'w-full px-3 py-2 text-left text-sm rounded-md transition-colors duration-200 flex items-center justify-between',
                      selectedCaixaEntrada === caixa.value
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    ]"
                  >
                    <span>{{ caixa.label }}</span>
                    <span v-if="caixa.count > 0" class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {{ caixa.count }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo principal -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Seção esquerda - Lista de contatos -->
    <div class="w-full md:w-2/6 lg:w-2/6 bg-white border-r border-gray-200 scrollbar-permanent">
        <!-- Cabeçalho da lista de contatos -->
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Conversas</h2>
          </div>

          <!-- Barra de pesquisa -->
          <div class="flex space-x-2">
            <div class="relative flex-1">
              <input
                type="text"
                v-model="searchTerm"
                placeholder="Buscar contatos..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
            <button
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
              title="Filtrar contatos"
            >
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
            </button>
          </div>

          <!-- Navbar de Status -->
          <div class="mt-3">
            <div class="bg-gray-100 p-1 rounded-lg">
              <nav class="flex space-x-1" aria-label="Status dos atendimentos">
                <button
                  v-for="status in statusOptions"
                  :key="status.value"
                  @click="selectedStatus = status.value"
                  :class="[
                    'flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors duration-200 flex items-center justify-center',
                    selectedStatus === status.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  ]"
                >
                  <span v-if="status.count !== undefined">
                    {{ status.label }} ({{ status.count }})
                  </span>
                  <span v-else>
                    {{ status.label }}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <!-- Lista de contatos -->
        <div class="space-y-3 p-3">
          <div
            v-for="contact in filteredContacts"
            :key="contact.id"
            @click="selectContact(contact)"
            :class="[
              'p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 hover:shadow-md cursor-pointer transition-all duration-200',
              selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-500 shadow-sm' : ''
            ]"
          >
            <div class="flex items-start space-x-3">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div class="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {{ getInitials(contact.name) }}
                </div>
              </div>

              <!-- Informações do contato -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ contact.name }}
                  </h3>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(contact.lastMessageTime) }}
                  </span>
                </div>

                <p class="text-sm text-gray-600 mt-1">
                  {{ formatPhone(contact.phone) }}
                </p>

                <!-- Última mensagem -->
                <p class="text-sm text-gray-500 mt-1 truncate">
                  {{ contact.lastMessage }}
                </p>

                <!-- Tags -->
                <div class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="tag in contact.tags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="getTagColor(tag)"
                  >
                    {{ tag }}
                  </span>
                </div>

                </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção direita - Área de chat -->
      <div class="flex-1 bg-gray-100 flex flex-col">
        <!-- Placeholder quando nenhum contato está selecionado -->
        <div v-if="!selectedContact" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="mx-auto h-24 w-24 bg-gray-300 rounded-full flex items-center justify-center mb-4">
              <svg class="h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Selecione um contato</h3>
            <p class="text-gray-500">Escolha um contato da lista para iniciar a conversa</p>
          </div>
        </div>

        <!-- Chat quando um contato está selecionado -->
        <div v-else class="flex-1 flex flex-col h-full">
          <!-- Cabeçalho do chat -->
          <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div class="flex items-center">
              <div class="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {{ getInitials(selectedContact.name) }}
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-gray-900">{{ selectedContact.name }}</h3>
                <p class="text-xs text-gray-500">{{ formatPhone(selectedContact.phone) }}</p>
              </div>
              <div class="ml-auto flex items-center space-x-2">
                <!-- Botão de Tag -->
                <div class="relative">
                  <button
                    @click="toggleTagDropdown"
                    class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    title="Adicionar tags"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                  </button>

                  <!-- Dropdown de Tags -->
                  <div
                    v-if="showTagDropdown"
                    v-click-outside="closeTagDropdown"
                    class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  >
                    <div class="p-3">
                      <p class="text-sm font-medium text-gray-900 mb-3">Gerenciar Tags</p>

                      <!-- Tags do sistema -->
                      <div class="max-h-40 overflow-y-auto mb-3">
                        <div class="space-y-2">
                          <label
                            v-for="systemTag in systemTags"
                            :key="systemTag"
                            class="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              :checked="selectedContact?.tags?.includes(systemTag) || false"
                              @change="toggleTag(systemTag)"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span class="ml-2 text-sm text-gray-700">{{ systemTag }}</span>
                          </label>
                        </div>
                      </div>

                      <!-- Botão Adicionar Tag -->
                      <div class="pt-2">
                        <button
                          @click="showAddTagInput = !showAddTagInput"
                          class="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-200"
                        >
                          + Adicionar Tag
                        </button>

                        <!-- Input para nova tag (aparece quando clicado) -->
                        <div v-if="showAddTagInput" class="mt-2 flex">
                          <input
                            v-model="newTag"
                            type="text"
                            placeholder="Nome da tag..."
                            class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            @keyup.enter="addNewSystemTag"
                          />
                          <button
                            @click="addNewSystemTag"
                            class="px-2 py-1 bg-indigo-600 text-white text-sm rounded-r-md hover:bg-indigo-700"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Botão de Status -->
                <div class="relative">
                  <button
                    @click="toggleStatusDropdown"
                    class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    title="Alterar status"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </button>

                  <!-- Dropdown de Status -->
                  <div
                    v-if="showStatusDropdown"
                    v-click-outside="closeStatusDropdown"
                    class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  >
                    <div class="p-3">
                      <p class="text-sm font-medium text-gray-900 mb-3">Alterar Status</p>

                      <!-- Opções de status -->
                      <div class="space-y-1">
                        <button
                          v-for="status in [
                            { value: 'aguardando', label: 'Aguardando' },
                            { value: 'ativo', label: 'Ativo' },
                            { value: 'concluido', label: 'Concluído' }
                          ]"
                          :key="status.value"
                          @click="updateStatus(status.value)"
                          :disabled="selectedContact?.status === status.value"
                          :class="[
                            'w-full px-2 py-1 text-left text-xs rounded transition-colors duration-200',
                            selectedContact?.status === status.value
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          ]"
                        >
                          {{ status.label }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Área de mensagens -->
          <div class="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto" style="max-height: calc(100vh - 280px);" id="chat-messages">
            <div
              v-for="message in selectedContact.messages"
              :key="message.id"
              :class="[
                'flex',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                :class="[
                  'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                ]"
              >
                <p class="text-sm">{{ message.text }}</p>
                <p class="text-xs mt-1" :class="message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'">
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Input de mensagem -->
          <div class="bg-white border-t border-gray-200 px-6 py-4">
            <div class="space-y-3">
              <!-- Campo de mensagem maior -->
              <div class="flex items-end space-x-3">
                <textarea
                  v-model="newMessage"
                  @keydown.enter.prevent="handleEnterKey"
                  placeholder="Digite sua mensagem..."
                  class="flex-1 px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  rows="3"
                ></textarea>
                <button
                  @click="sendMessage"
                  class="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </button>
              </div>

              <!-- Botões de ação abaixo -->
              <div class="flex justify-start space-x-4">
                <button class="text-gray-400 hover:text-gray-600 flex items-center space-x-2 text-sm">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                  </svg>
                  <span>Anexar arquivo</span>
                </button>
                <button class="text-gray-400 hover:text-gray-600 flex items-center space-x-2 text-sm">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Emoji</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Dados mockados para demonstração
const contacts = ref([
  {
    id: 1,
    name: 'João Silva',
    phone: '11999999999',
    lastMessage: 'Olá, preciso de ajuda com meu pedido',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos atrás
    tags: ['Prioridade', 'VIP'],
    unreadCount: 2,
    status: 'ativo',
    caixa_entrada: 'Suporte',
    messages: [
      { id: 1, text: 'Olá, preciso de ajuda com meu pedido', sender: 'contact', timestamp: new Date(Date.now() - 25 * 60 * 1000) },
      { id: 2, text: 'Olá João! Como posso ajudar?', sender: 'user', timestamp: new Date(Date.now() - 24 * 60 * 1000) },
      { id: 3, text: 'Meu pedido #1234 está atrasado', sender: 'contact', timestamp: new Date(Date.now() - 23 * 60 * 1000) },
      { id: 4, text: 'Vou verificar seu pedido agora mesmo', sender: 'user', timestamp: new Date(Date.now() - 22 * 60 * 1000) },
      { id: 5, text: 'Obrigado pelo atendimento rápido', sender: 'contact', timestamp: new Date(Date.now() - 21 * 60 * 1000) },
      { id: 6, text: 'Verifiquei seu pedido e ele já foi despachado', sender: 'user', timestamp: new Date(Date.now() - 20 * 60 * 1000) },
      { id: 7, text: 'Que bom! Quando ele deve chegar?', sender: 'contact', timestamp: new Date(Date.now() - 19 * 60 * 1000) },
      { id: 8, text: 'A previsão de entrega é até sexta-feira', sender: 'user', timestamp: new Date(Date.now() - 18 * 60 * 1000) },
      { id: 9, text: 'Perfeito, obrigado pela informação', sender: 'contact', timestamp: new Date(Date.now() - 17 * 60 * 1000) },
      { id: 10, text: 'De nada! Se precisar de mais algo, é só chamar', sender: 'user', timestamp: new Date(Date.now() - 16 * 60 * 1000) },
      { id: 11, text: 'Só mais uma dúvida, o pedido vem com nota fiscal?', sender: 'contact', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
      { id: 12, text: 'Sim, todos os nossos pedidos vêm com nota fiscal eletrônica', sender: 'user', timestamp: new Date(Date.now() - 14 * 60 * 1000) },
      { id: 13, text: 'Excelente, isso é muito importante para mim', sender: 'contact', timestamp: new Date(Date.now() - 13 * 60 * 1000) },
      { id: 14, text: 'A nota fiscal será enviada para seu e-mail cadastrado', sender: 'user', timestamp: new Date(Date.now() - 12 * 60 * 1000) },
      { id: 15, text: 'Perfeito, já anotei isso. Obrigado mais uma vez!', sender: 'contact', timestamp: new Date(Date.now() - 11 * 60 * 1000) },
      { id: 16, text: 'Foi um prazer ajudar! Estou à disposição', sender: 'user', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
      { id: 17, text: 'Tenha um ótimo dia!', sender: 'contact', timestamp: new Date(Date.now() - 9 * 60 * 1000) },
      { id: 18, text: 'Você também! Até logo!', sender: 'user', timestamp: new Date(Date.now() - 8 * 60 * 1000) },
      { id: 19, text: 'Oi, só para confirmar, meu pedido já saiu para entrega?', sender: 'contact', timestamp: new Date(Date.now() - 7 * 60 * 1000) },
      { id: 20, text: 'Sim! Seu pedido já foi despachado hoje de manhã.', sender: 'user', timestamp: new Date(Date.now() - 6 * 60 * 1000) },
      { id: 21, text: 'Que ótimo! Você tem o código de rastreamento?', sender: 'contact', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
      { id: 22, text: 'Claro! O código é: BR123456789BR', sender: 'user', timestamp: new Date(Date.now() - 4 * 60 * 1000) },
      { id: 23, text: 'Perfeito, já vou rastrear no site dos Correios.', sender: 'contact', timestamp: new Date(Date.now() - 3 * 60 * 1000) },
      { id: 24, text: 'Ótima ideia! Qualquer dúvida é só me chamar.', sender: 'user', timestamp: new Date(Date.now() - 2 * 60 * 1000) },
      { id: 25, text: 'Obrigado pela ajuda! Vocês são incríveis!', sender: 'contact', timestamp: new Date(Date.now() - 1 * 60 * 1000) },
      { id: 26, text: 'Foi um prazer ajudar! Volte sempre!', sender: 'user', timestamp: new Date() }
    ]
  },
  {
    id: 2,
    name: 'Maria Santos',
    phone: '21988888888',
    lastMessage: 'Obrigado pela ajuda!',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
    tags: ['Resolvido'],
    unreadCount: 0,
    status: 'concluido',
    caixa_entrada: 'Suporte',
    messages: [
      { id: 1, text: 'Preciso de ajuda com meu produto', sender: 'contact', timestamp: new Date(Date.now() - 60 * 60 * 1000) },
      { id: 2, text: 'Claro, qual o problema?', sender: 'user', timestamp: new Date(Date.now() - 55 * 60 * 1000) },
      { id: 3, text: 'Já resolveu, obrigado pela ajuda!', sender: 'contact', timestamp: new Date(Date.now() - 30 * 60 * 1000) }
    ]
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    phone: '31977777777',
    lastMessage: 'Quando meu produto será entregue?',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    tags: ['Entrega', 'Urgente'],
    unreadCount: 1,
    status: 'aguardando',
    caixa_entrada: 'Suporte',
    messages: [
      { id: 1, text: 'Quando meu produto será entregue?', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 4,
    name: 'Ana Costa',
    phone: '11966666666',
    lastMessage: 'Quero fazer um pedido',
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    tags: ['Novo Cliente'],
    unreadCount: 0,
    status: 'ativo',
    caixa_entrada: 'Vendas',
    messages: [
      { id: 1, text: 'Quero fazer um pedido', sender: 'contact', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { id: 2, text: 'Claro! O que você gostaria de pedir?', sender: 'user', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 5,
    name: 'Carlos Mendes',
    phone: '11955555555',
    lastMessage: 'Produto chegou com defeito',
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
    tags: ['Reclamação', 'Troca'],
    unreadCount: 1,
    status: 'aguardando',
    caixa_entrada: 'Suporte',
    messages: [
      { id: 1, text: 'Produto chegou com defeito', sender: 'contact', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 6,
    name: 'Fernanda Souza',
    phone: '21944444444',
    lastMessage: 'Obrigado pelo atendimento rápido',
    lastMessageTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
    tags: ['Elogio', 'Resolvido'],
    unreadCount: 0,
    status: 'concluido',
    caixa_entrada: 'Suporte',
    messages: [
      { id: 1, text: 'Preciso de ajuda com meu pedido', sender: 'contact', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
      { id: 2, text: 'Vou verificar seu pedido agora mesmo', sender: 'user', timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000) },
      { id: 3, text: 'Obrigado pelo atendimento rápido', sender: 'contact', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 7,
    name: 'Ricardo Alves',
    phone: '31933333333',
    lastMessage: 'Quero cancelar meu pedido',
    lastMessageTime: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
    tags: ['Cancelamento', 'Urgente'],
    unreadCount: 2,
    status: 'ativo',
    caixa_entrada: 'Urgente',
    messages: [
      { id: 1, text: 'Quero cancelar meu pedido', sender: 'contact', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 8,
    name: 'Juliana Lima',
    phone: '11922222222',
    lastMessage: 'Gostaria de fazer uma sugestão',
    lastMessageTime: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 horas atrás
    tags: ['Sugestão', 'Feedback'],
    unreadCount: 0,
    status: 'concluido',
    caixa_entrada: 'Suporte',
    messages: [
      { id: 1, text: 'Gostaria de fazer uma sugestão', sender: 'contact', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000) },
      { id: 2, text: 'Claro! Adoraria ouvir sua sugestão', sender: 'user', timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 9,
    name: 'Roberto Silva',
    phone: '21911111111',
    lastMessage: 'Quando vai ter promoção novamente?',
    lastMessageTime: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 horas atrás
    tags: ['Dúvida', 'Promoção'],
    unreadCount: 0,
    status: 'aguardando',
    caixa_entrada: 'Prospecção',
    messages: [
      { id: 1, text: 'Quando vai ter promoção novamente?', sender: 'contact', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000) },
      { id: 2, text: 'Temos promoções mensais, fique de olho!', sender: 'user', timestamp: new Date(Date.now() - 35 * 60 * 60 * 1000) }
    ]
  }
])

const selectedContact = ref(null)
const searchTerm = ref('')
const newMessage = ref('')
const selectedStatus = ref('todos')
const selectedCaixaEntrada = ref('Suporte')
const showTagDropdown = ref(false)
const showStatusDropdown = ref(false)
const showAddTagInput = ref(false)
const newTag = ref('')

// Estado do dropdown de caixa de entrada
const showCaixaEntradaDropdown = ref(false)
const searchCaixaEntrada = ref('')

// Opções de caixas de entrada
const caixasEntradaOptions = computed(() => {
  const caixaCounts = {
    Suporte: contacts.value.filter(c => c.caixa_entrada === 'Suporte').length,
    Vendas: contacts.value.filter(c => c.caixa_entrada === 'Vendas').length,
    Urgente: contacts.value.filter(c => c.caixa_entrada === 'Urgente').length,
    Prospecção: contacts.value.filter(c => c.caixa_entrada === 'Prospecção').length,
    Financeiro: 0,
    Marketing: 0,
    Produtos: 0,
    Logística: 0,
    RH: 0,
    TI: 0,
    Legal: 0,
    Parcerias: 0,
    Sugestões: 0,
    Reclamações: 0,
    Elogios: 0,
    'Contas a Pagar': 0,
    'Contas a Receber': 0,
    'Compras': 0,
    'Estoque': 0,
    'Qualidade': 0,
    'Treinamento': 0,
    'Segurança': 0,
    'Almoxarifado': 0,
    'Manutenção': 0,
    'Atendimento Prioritário': 0
  }

  return [
    { label: 'Suporte', value: 'Suporte', count: caixaCounts.Suporte },
    { label: 'Vendas', value: 'Vendas', count: caixaCounts.Vendas },
    { label: 'Urgente', value: 'Urgente', count: caixaCounts.Urgente },
    { label: 'Prospecção', value: 'Prospecção', count: caixaCounts.Prospecção },
    { label: 'Financeiro', value: 'Financeiro', count: caixaCounts.Financeiro },
    { label: 'Marketing', value: 'Marketing', count: caixaCounts.Marketing },
    { label: 'Produtos', value: 'Produtos', count: caixaCounts.Produtos },
    { label: 'Logística', value: 'Logística', count: caixaCounts.Logística },
    { label: 'RH', value: 'RH', count: caixaCounts.RH },
    { label: 'TI', value: 'TI', count: caixaCounts.TI },
    { label: 'Legal', value: 'Legal', count: caixaCounts.Legal },
    { label: 'Parcerias', value: 'Parcerias', count: caixaCounts.Parcerias },
    { label: 'Sugestões', value: 'Sugestões', count: caixaCounts.Sugestões },
    { label: 'Reclamações', value: 'Reclamações', count: caixaCounts.Reclamações },
    { label: 'Elogios', value: 'Elogios', count: caixaCounts.Elogios },
    { label: 'Contas a Pagar', value: 'Contas a Pagar', count: caixaCounts['Contas a Pagar'] },
    { label: 'Contas a Receber', value: 'Contas a Receber', count: caixaCounts['Contas a Receber'] },
    { label: 'Compras', value: 'Compras', count: caixaCounts.Compras },
    { label: 'Estoque', value: 'Estoque', count: caixaCounts.Estoque },
    { label: 'Qualidade', value: 'Qualidade', count: caixaCounts.Qualidade },
    { label: 'Treinamento', value: 'Treinamento', count: caixaCounts.Treinamento },
    { label: 'Segurança', value: 'Segurança', count: caixaCounts.Segurança },
    { label: 'Almoxarifado', value: 'Almoxarifado', count: caixaCounts.Almoxarifado },
    { label: 'Manutenção', value: 'Manutenção', count: caixaCounts.Manutenção },
    { label: 'Atendimento Prioritário', value: 'Atendimento Prioritário', count: caixaCounts['Atendimento Prioritário'] }
  ]
})

// Computed para filtrar caixas de entrada no dropdown
const filteredCaixaEntradaOptions = computed(() => {
  if (!searchCaixaEntrada.value) {
    return caixasEntradaOptions.value
  }

  const search = searchCaixaEntrada.value.toLowerCase()
  return caixasEntradaOptions.value.filter(caixa =>
    caixa.label.toLowerCase().includes(search)
  )
})

// Tags do sistema disponíveis
const systemTags = ref([
  'Prioridade',
  'VIP',
  'Resolvido',
  'Entrega',
  'Urgente',
  'Novo Cliente',
  'Reclamação',
  'Elogio',
  'Dúvida',
  'Sugestão',
  'Cancelamento',
  'Promoção',
  'Feedback',
  'Troca'
])

// Opções de status com contagens
const statusOptions = computed(() => {
  const statusCounts = {
    todos: contacts.value.length,
    aguardando: contacts.value.filter(c => c.status === 'aguardando').length,
    ativo: contacts.value.filter(c => c.status === 'ativo').length,
    concluido: contacts.value.filter(c => c.status === 'concluido').length
  }

  return [
    { label: 'Todos', value: 'todos', count: statusCounts.todos },
    { label: 'Aguardando', value: 'aguardando', count: statusCounts.aguardando },
    { label: 'Ativo', value: 'ativo', count: statusCounts.ativo },
    { label: 'Concluído', value: 'concluido', count: statusCounts.concluido }
  ]
})

// Controle de scrollbars
onMounted(() => {
  initScrollbars()
})

const initScrollbars = () => {
  const scrollElements = document.querySelectorAll('.scrollbar-permanent')

  scrollElements.forEach(element => {
    let scrollTimeout
    let isHoveringScrollbar = false

    const showScrollbar = () => {
      element.classList.add('scrollbar-visible')
      clearTimeout(scrollTimeout)
    }

    const hideScrollbar = () => {
      scrollTimeout = setTimeout(() => {
        if (!isHoveringScrollbar) {
          element.classList.remove('scrollbar-visible')
        }
      }, 1000)
    }

    const checkScrollbarHover = (event) => {
      const rect = element.getBoundingClientRect()
      const scrollbarZone = rect.right - 20 // Zona de 20px da direita

      if (event.clientX >= scrollbarZone) {
        isHoveringScrollbar = true
        showScrollbar()
      } else {
        isHoveringScrollbar = false
        hideScrollbar()
      }
    }

    // Mostrar no hover no elemento inteiro
    element.addEventListener('mouseenter', showScrollbar)
    element.addEventListener('mouseleave', hideScrollbar)

    // Detectar hover específico na área da scrollbar
    element.addEventListener('mousemove', checkScrollbarHover)

    // Mostrar durante o scroll
    element.addEventListener('scroll', () => {
      showScrollbar()
      hideScrollbar()
    })

    // Esconder quando o mouse sai do elemento
    element.addEventListener('mouseleave', () => {
      isHoveringScrollbar = false
      hideScrollbar()
    })
  })
}

// Filtrar contatos baseado no termo de pesquisa, caixa de entrada e status
const filteredContacts = computed(() => {
  let filtered = contacts.value

  // Filtrar por caixa de entrada
  filtered = filtered.filter(contact => contact.caixa_entrada === selectedCaixaEntrada.value)

  // Filtrar por status
  if (selectedStatus.value !== 'todos') {
    filtered = filtered.filter(contact => contact.status === selectedStatus.value)
  }

  // Filtrar por termo de pesquisa
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(contact =>
      contact.name.toLowerCase().includes(search) ||
      contact.phone.includes(search) ||
      contact.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }

  return filtered
})

// Selecionar contato
const selectContact = (contact) => {
  selectedContact.value = contact
  // Resetar contador de mensagens não lidas
  contact.unreadCount = 0
}

// Manipular tecla Enter
const handleEnterKey = (event) => {
  if (event.altKey || event.shiftKey) {
    // Alt+Enter ou Shift+Enter cria uma nova linha
    const textarea = event.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = newMessage.value

    newMessage.value = text.substring(0, start) + '\n' + text.substring(end)

    // Move cursor para após a quebra de linha
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1
    })

    // Previne o comportamento padrão para evitar envio da mensagem
    event.preventDefault()
  } else {
    // Enter normal envia a mensagem
    sendMessage()
  }
}

// Enviar mensagem
const sendMessage = () => {
  if (!newMessage.value.trim() || !selectedContact.value) return

  const message = {
    id: Date.now(),
    text: newMessage.value,
    sender: 'user',
    timestamp: new Date()
  }

  selectedContact.value.messages.push(message)
  selectedContact.value.lastMessage = message.text
  selectedContact.value.lastMessageTime = message.timestamp

  newMessage.value = ''
}

// Obter iniciais do nome
const getInitials = (name) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

// Formatar telefone
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

// Formatar tempo relativo
const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}m`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days}d`

  return date.toLocaleDateString('pt-BR')
}

// Obter cor da tag
const getTagColor = (tag) => {
  const colors = {
    'Prioridade': 'bg-red-100 text-red-800',
    'VIP': 'bg-purple-100 text-purple-800',
    'Resolvido': 'bg-green-100 text-green-800',
    'Entrega': 'bg-blue-100 text-blue-800',
    'Urgente': 'bg-orange-100 text-orange-800',
    'Novo Cliente': 'bg-indigo-100 text-indigo-800'
  }

  return colors[tag] || 'bg-gray-100 text-gray-800'
}

// Funções de gerenciamento de tags
const toggleTag = (tag) => {
  if (!selectedContact.value) return

  const tagIndex = selectedContact.value.tags.indexOf(tag)
  if (tagIndex > -1) {
    // Remover tag se já estiver selecionada
    selectedContact.value.tags.splice(tagIndex, 1)
  } else {
    // Adicionar tag se não estiver selecionada
    selectedContact.value.tags.push(tag)
  }
}

const addNewSystemTag = () => {
  if (!newTag.value.trim()) return

  const tagName = newTag.value.trim()

  // Adicionar às tags do sistema se não existir
  if (!systemTags.value.includes(tagName)) {
    systemTags.value.push(tagName)
  }

  // Adicionar ao contato selecionado
  if (selectedContact.value && !selectedContact.value.tags.includes(tagName)) {
    selectedContact.value.tags.push(tagName)
  }

  newTag.value = ''
  showAddTagInput.value = false
}

// Funções de gerenciamento de status
const updateStatus = (newStatus) => {
  if (!selectedContact.value) return

  selectedContact.value.status = newStatus
  showStatusDropdown.value = false
}

// Funções para fechar dropdowns
const closeTagDropdown = () => {
  showTagDropdown.value = false
}

const closeStatusDropdown = () => {
  showStatusDropdown.value = false
}

const closeCaixaEntradaDropdown = () => {
  showCaixaEntradaDropdown.value = false
}

// Funções para toggle dropdowns com comportamento mutualmente exclusivo
const toggleTagDropdown = () => {
  if (showStatusDropdown.value) {
    showStatusDropdown.value = false
  }
  showTagDropdown.value = !showTagDropdown.value
}

const toggleStatusDropdown = () => {
  if (showTagDropdown.value) {
    showTagDropdown.value = false
  }
  showStatusDropdown.value = !showStatusDropdown.value
}

const toggleCaixaEntradaDropdown = () => {
  if (showStatusDropdown.value) {
    showStatusDropdown.value = false
  }
  if (showTagDropdown.value) {
    showTagDropdown.value = false
  }
  showCaixaEntradaDropdown.value = !showCaixaEntradaDropdown.value
}

const selectCaixaEntrada = (value) => {
  selectedCaixaEntrada.value = value
  showCaixaEntradaDropdown.value = false
  searchCaixaEntrada.value = '' // Limpar pesquisa após seleção
}

const getStatusLabel = (status) => {
  const labels = {
    'aguardando': 'Aguardando',
    'ativo': 'Ativo',
    'concluido': 'Concluído'
  }

  return labels[status] || status
}

// Meta tags da página
useHead({
  title: 'Atendimentos - Artemis',
  meta: [
    { name: 'description', content: 'Painel de atendimentos e chat com clientes' }
  ]
})
</script>

<style scoped>
/* Scrollbar permanente com visibilidade controlada */
.scrollbar-permanent {
  scrollbar-gutter: stable;
  overflow-y: auto;
  -ms-overflow-style: none;  /* IE e Edge */
  scrollbar-width: none;     /* Firefox */
}

.scrollbar-permanent::-webkit-scrollbar {
  width: 8px;
  background: transparent;
}

.scrollbar-permanent::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.scrollbar-permanent::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.3s ease;
}

.scrollbar-permanent.scrollbar-visible::-webkit-scrollbar-thumb {
  background: #9ca3af;
  opacity: 1;
}

.scrollbar-permanent.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Para Firefox */
.scrollbar-permanent {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s ease;
}

.scrollbar-permanent.scrollbar-visible {
  scrollbar-color: #9ca3af transparent;
}

/* Garantir que o container sempre reserve espaço */
.scrollbar-permanent {
  overflow-y: scroll !important;
}

/* Chat messages scrollbar específica */
#chat-messages {
  scrollbar-gutter: stable;
  overflow-y: scroll !important;
}

#chat-messages::-webkit-scrollbar {
  width: 8px;
}

#chat-messages::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

#chat-messages::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

#chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Para Firefox */
#chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #6b7280 #f3f4f6;
}
</style>