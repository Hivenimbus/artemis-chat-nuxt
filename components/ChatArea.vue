<template>
  <div class="flex-1 bg-gray-100 flex flex-col relative">
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

            <!-- Botão de Resolver -->
            <div class="relative">
              <button
                @click="$emit('resolve-chat')"
                class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Resolver atendimento"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
            </div>

            <!-- Botão Kebab (Mais opções) -->
            <div class="relative">
              <button
                @click="toggleKebabSidebar"
                class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Mais opções"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Área de mensagens -->
      <div class="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto" style="max-height: calc(100vh - 280px);" id="chat-messages">
        <!-- Loading state -->
        <div v-if="loadingMessages" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Empty state quando não há mensagens -->
        <div v-else-if="messages.length === 0" class="flex justify-center py-8">
          <p class="text-gray-500 text-center">Nenhuma mensagem trocada ainda</p>
        </div>

        <!-- Lista de mensagens -->
        <div
          v-for="message in messages"
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
              <svg class="h-5 w-5 send-icon-rotated" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              <span>Áudio</span>
            </button>
            <button class="text-gray-400 hover:text-gray-600 flex items-center space-x-2 text-sm">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              <span>Inteligência Artificial</span>
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

      <!-- Sidebar lateral de opções -->
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="showKebabSidebar"
          class="absolute top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col"
        >
          <!-- Header da sidebar -->
          <div class="px-6 py-5.5 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 class="text-lg font-medium text-gray-900">Opções da Conversa</h3>
            <button
              @click="closeKebabSidebar"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Fechar"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Conteúdo da sidebar -->
          <div class="flex-1 overflow-y-auto p-4">
            <!-- Informações do contato -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-500 uppercase mb-3">Informações</h4>
              <div class="space-y-3">
                <div class="flex items-center space-x-3">
                  <div class="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {{ getInitials(selectedContact.name) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ selectedContact.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatPhone(selectedContact.phone) }}</p>
                  </div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500">Status</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ getStatusLabel(selectedContact.status) }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500">Caixa de Entrada</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ selectedContact.caixa_entrada }}</p>
                </div>
              </div>
            </div>

            <!-- Ações -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-500 uppercase mb-3">Ações</h4>
              <div class="space-y-2">
                <button
                  @click="$emit('export-chat')"
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3 transition-colors duration-200 border border-gray-200"
                >
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Exportar conversa</span>
                </button>
                
                <button
                  @click="$emit('transfer-chat')"
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3 transition-colors duration-200 border border-gray-200"
                >
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                  <span>Transferir atendimento</span>
                </button>
                
                <button
                  @click="$emit('block-contact')"
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3 transition-colors duration-200 border border-gray-200"
                >
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  <span>Bloquear contato</span>
                </button>
              </div>
            </div>

            <!-- Zona de perigo -->
            <div>
              <button
                @click="$emit('delete-chat')"
                class="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-3 transition-colors duration-200 border border-red-200"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                <span>Excluir conversa</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'

const props = defineProps({
  selectedContact: {
    type: Object,
    default: null
  },
  systemTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'send-message',
  'toggle-tag',
  'add-tag',
  'resolve-chat',
  'export-chat',
  'transfer-chat',
  'block-contact',
  'delete-chat'
])

const newMessage = ref('')
const showTagDropdown = ref(false)
const showKebabSidebar = ref(false)
const showAddTagInput = ref(false)

// Estados para mensagens
const messages = ref([])
const loadingMessages = ref(false)
const newTag = ref('')

// Carregar mensagens do atendimento
const loadMessages = async (contactId) => {
  if (!contactId) {
    messages.value = []
    return
  }

  loadingMessages.value = true
  try {
    const response = await $fetch(`/api/atendimentos/${contactId}/mensagens`)
    if (response?.success && response?.data?.mensagens) {
      messages.value = response.data.mensagens
    } else {
      messages.value = []
    }
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error)
    messages.value = []
  } finally {
    loadingMessages.value = false
  }
}

// Rolar para a parte inferior do chat
const scrollToBottom = () => {
  const chatMessages = document.getElementById('chat-messages')
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

// Watch para carregar mensagens quando o contato selecionado mudar
watch(() => props.selectedContact?.id, (newContactId) => {
  if (newContactId) {
    loadMessages(newContactId)
  } else {
    messages.value = []
  }
}, { immediate: true })

// Watch para rolar quando as mensagens mudarem
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { immediate: true })

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
  if (!newMessage.value.trim() || !props.selectedContact) return

  const messageText = newMessage.value.trim()

  // Adicionar mensagem otimista localmente
  const tempMessage = {
    id: Date.now().toString(), // ID temporário
    text: messageText,
    sender: 'user',
    timestamp: new Date(),
    lida: true,
    usuario_name: 'Você'
  }

  messages.value.push(tempMessage)

  emit('send-message', messageText)
  newMessage.value = ''

  // Rolar para ver a nova mensagem
  nextTick(() => {
    scrollToBottom()
  })
}

// Funções de gerenciamento de tags
const toggleTag = (tag) => {
  emit('toggle-tag', tag)
}

const addNewSystemTag = () => {
  if (!newTag.value.trim()) return

  emit('add-tag', newTag.value.trim())
  newTag.value = ''
  showAddTagInput.value = false
}

// Funções para fechar dropdowns e sidebar
const closeTagDropdown = () => {
  showTagDropdown.value = false
}

const closeKebabSidebar = () => {
  showKebabSidebar.value = false
}

// Funções para toggle dropdowns e sidebar com comportamento mutualmente exclusivo
const toggleTagDropdown = () => {
  if (showKebabSidebar.value) {
    showKebabSidebar.value = false
  }
  showTagDropdown.value = !showTagDropdown.value
}

const toggleKebabSidebar = () => {
  if (showTagDropdown.value) {
    showTagDropdown.value = false
  }
  showKebabSidebar.value = !showKebabSidebar.value
}

// Funções utilitárias
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

const formatTime = (date) => {
  if (!date) return 'sem data'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'data inválida'

  const now = new Date()
  const diff = now - dateObj
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}m`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days}d`

  return dateObj.toLocaleDateString('pt-BR')
}

const getStatusLabel = (status) => {
  const labels = {
    'aguardando': 'Aguardando',
    'ativo': 'Ativo',
    'concluido': 'Concluído'
  }

  return labels[status] || status
}
</script>

<style scoped>
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

/* Ícone de enviar rotacionado para apontar para direita */
.send-icon-rotated {
  transform: rotate(90deg);
}
</style>
