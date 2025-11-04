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
            <p class="text-xs text-gray-500">
              {{ formatPhone(selectedContact.phone) }}
              <span v-if="inboxStatus" class="ml-2 inline-flex items-center">
                <span
                  class="inline-block w-2 h-2 rounded-full mr-1"
                  :class="inboxStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'"
                ></span>
                {{ inboxStatus === 'connected' ? 'Online' : 'Offline' }}
              </span>
            </p>
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
                        :key="systemTag.id || systemTag"
                        class="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          :checked="isTagSelected(systemTag)"
                          @change="toggleTag(systemTag.nome || systemTag)"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span
                          class="ml-2 text-sm px-2 py-1 rounded-full border text-xs font-medium"
                          :class="systemTag.cor ? '' : 'bg-gray-100 text-gray-700'"
                          :style="systemTag.cor ? {
                            backgroundColor: systemTag.cor + '20',
                            color: systemTag.cor,
                            borderColor: systemTag.cor
                          } : {}"
                        >
                          {{ systemTag.nome || systemTag }}
                        </span>
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
      <div ref="messagesContainer" class="flex-1 min-h-0 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        <!-- Loading state -->
        <div v-if="loadingMessages" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Empty state quando não há mensagens -->
        <div v-else-if="messages.length === 0" class="flex justify-center py-8">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"/>
            </svg>
            <p class="text-gray-500">Nenhuma mensagem trocada ainda</p>
            <p class="text-sm text-gray-400 mt-1">Envie a primeira mensagem para iniciar a conversa</p>
          </div>
        </div>

        <!-- Lista de mensagens usando MessageBubble -->
        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </div>

      <!-- Input de mensagem -->
      <div class="bg-white border-t border-gray-200 px-6 py-4">
        <div class="space-y-3">
          <!-- Upload de arquivo em progresso -->
          <div v-if="uploadingFile" class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span class="text-sm text-blue-600">Enviando arquivo...</span>
            <button
              @click="cancelUpload"
              class="text-blue-600 hover:text-blue-800"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Campo de mensagem maior com suporte a mídia -->
          <div class="flex items-end space-x-3">
            <!-- Botão de anexar arquivo -->
            <div class="relative">
              <input
                ref="fileInput"
                type="file"
                @change="handleFileSelect"
                accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                class="hidden"
              />
              <button
                @click="$refs.fileInput.click()"
                :disabled="uploadingFile"
                class="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Anexar arquivo"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                </svg>
              </button>
            </div>

            <!-- Área de texto com preview do arquivo -->
            <div class="flex-1">
              <!-- Preview do arquivo selecionado -->
              <div v-if="selectedFile" class="mb-2 p-2 bg-gray-50 rounded-lg flex items-center space-x-2">
                <div class="flex-shrink-0">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 truncate">{{ selectedFile.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button
                  @click="removeSelectedFile"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <textarea
                v-model="newMessage"
                @keydown.enter.prevent="handleEnterKey"
                @keydown="handleKeyDown"
                placeholder="Digite sua mensagem..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                rows="2"
                :disabled="!canSendMessages || uploadingFile"
              ></textarea>
            </div>

            <!-- Botão de enviar -->
            <button
              @click="sendMessage"
              :disabled="!canSend || uploadingFile"
              class="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Enviar mensagem (Ctrl+Enter)"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>

          <!-- Indicador de digitando -->
          <div v-if="isTyping" class="text-xs text-gray-500 italic">
            <div class="flex items-center space-x-1">
              <span>Digitando</span>
              <div class="flex space-x-1">
                <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
              </div>
            </div>
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Conteúdo da sidebar -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-6 space-y-6">
              <!-- Exportar conversa -->
              <div>
                <button
                  @click="$emit('export-chat')"
                  class="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div class="flex items-center space-x-3">
                    <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div>
                      <p class="font-medium text-gray-900">Exportar conversa</p>
                      <p class="text-sm text-gray-500">Baixar histórico em PDF</p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Transferir atendimento -->
              <div>
                <button
                  @click="$emit('transfer-chat')"
                  class="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div class="flex items-center space-x-3">
                    <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                    <div>
                      <p class="font-medium text-gray-900">Transferir atendimento</p>
                      <p class="text-sm text-gray-500">Mover para outro atendente</p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Bloquear contato -->
              <div>
                <button
                  @click="$emit('block-contact')"
                  class="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                >
                  <div class="flex items-center space-x-3">
                    <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                    </svg>
                    <div>
                      <p class="font-medium text-red-900">Bloquear contato</p>
                      <p class="text-sm text-red-500">Impedir novas mensagens</p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Excluir conversa -->
              <div>
                <button
                  @click="$emit('delete-chat')"
                  class="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                >
                  <div class="flex items-center space-x-3">
                    <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <div>
                      <p class="font-medium text-red-900">Excluir conversa</p>
                      <p class="text-sm text-red-500">Apagar todo o histórico</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps({
  selectedContact: {
    type: Object,
    default: null
  },
  systemTags: {
    type: Array,
    default: () => []
  },
  caixasEntradaMap: {
    type: Object,
    default: () => ({})
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

// Estado do componente
const messages = ref([])
const loadingMessages = ref(false)
const newMessage = ref('')
const messagesContainer = ref(null)
const fileInput = ref(null)
const selectedFile = ref(null)
const uploadingFile = ref(false)
const isTyping = ref(false)
const sendError = ref(null)
const sendErrorTimeout = ref(null)

// UI State
const showTagDropdown = ref(false)
const showKebabSidebar = ref(false)
const showAddTagInput = ref(false)
const newTag = ref('')

// Computed
const canSend = computed(() => {
  return (newMessage.value.trim() || selectedFile.value) && !uploadingFile.value
})

const canSendMessages = computed(() => {
  return props.selectedContact && props.caixasEntradaMap[props.selectedContact.caixa_entrada]
})

const inboxStatus = computed(() => {
  if (!props.selectedContact || !props.caixasEntradaMap) return null
  const inbox = Object.values(props.caixasEntradaMap).find(
    inbox => inbox.name === props.caixasEntradaMap[props.selectedContact.caixa_entrada]
  )
  return inbox?.status || null
})

// Métodos
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatPhone = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const toggleTagDropdown = () => {
  showTagDropdown.value = !showTagDropdown.value
  showKebabSidebar.value = false
}

const closeTagDropdown = () => {
  showTagDropdown.value = false
}

const toggleKebabSidebar = () => {
  showKebabSidebar.value = !showKebabSidebar.value
  showTagDropdown.value = false
}

const closeKebabSidebar = () => {
  showKebabSidebar.value = false
}

const isTagSelected = (tag) => {
  if (!props.selectedContact?.tags) return false
  const tagName = tag.nome || tag
  return props.selectedContact.tags.some(contactTag => {
    const contactTagName = typeof contactTag === 'object' ? contactTag.nome : contactTag
    return contactTagName === tagName
  })
}

const toggleTag = (tagName) => {
  emit('toggle-tag', tagName)
}

const addNewSystemTag = () => {
  if (newTag.value.trim()) {
    emit('add-tag', newTag.value.trim())
    newTag.value = ''
    showAddTagInput.value = false
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
  // Reset input para permitir selecionar o mesmo arquivo novamente
  event.target.value = ''
}

const removeSelectedFile = () => {
  selectedFile.value = null
}

const cancelUpload = () => {
  uploadingFile.value = false
  selectedFile.value = null
}

const handleEnterKey = (event) => {
  if (!event.shiftKey) {
    sendMessage()
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && event.shiftKey) {
    // Permitir nova linha com Shift+Enter
    return
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const sendMessage = async () => {
  if (!canSend.value || !canSendMessages.value) return

  const messageText = newMessage.value.trim()
  const file = selectedFile.value

  if (!messageText && !file) return

  uploadingFile.value = true

  try {
    let mediaUrl = null
    let mediaType = null

    // Se há arquivo, fazer upload primeiro
    if (file) {
      // TODO: Implementar upload de arquivo
      console.log('Upload de arquivo:', file)
    }

    // Enviar mensagem
    await emit('send-message', messageText || 'Mídia', mediaUrl, mediaType)

    // Limpar campos
    newMessage.value = ''
    selectedFile.value = null

    // Scroll para baixo
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
  } finally {
    uploadingFile.value = false
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const loadMessages = async () => {
  if (!props.selectedContact?.id) {
    messages.value = []
    return
  }

  loadingMessages.value = true
  try {
    // TODO: Implementar carregamento de mensagens da API
    // const response = await $fetch(`/api/atendimentos/${props.selectedContact.id}/mensagens`)
    // messages.value = response.data || []

    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error)
    messages.value = []
  } finally {
    loadingMessages.value = false
  }
}

// Watchers
watch(() => props.selectedContact?.id, () => {
  loadMessages()
})

onMounted(() => {
  loadMessages()
})

// Simulação de mensagens recebidas (remover quando implementar webhook real)
const simulateNewMessage = () => {
  if (!props.selectedContact?.id) return

  const newMsg = {
    id: Date.now().toString(),
    text: 'Esta é uma mensagem de teste do webhook!',
    sender: 'contact',
    timestamp: new Date().toISOString(),
    message_type: 'text'
  }

  messages.value.push(newMsg)
  nextTick(() => scrollToBottom())
}

// Adicionar listener para novas mensagens (opcional)
const eventSource = ref(null)

const startRealtimeUpdates = () => {
  if (!props.selectedContact?.id) return

  // TODO: Implementar Server-Sent Events ou WebSocket
  // eventSource.value = new EventSource(`/api/atendimentos/${props.selectedContact.id}/events`)
  // eventSource.value.onmessage = (event) => {
  //   const data = JSON.parse(event.data)
  //   if (data.type === 'new_message') {
  //     messages.value.push(data.message)
  //     nextTick(() => scrollToBottom())
  //   }
  // }
}

const stopRealtimeUpdates = () => {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
}

watch(() => props.selectedContact?.id, () => {
  stopRealtimeUpdates()
  if (props.selectedContact?.id) {
    startRealtimeUpdates()
  }
}, { immediate: true })

onUnmounted(() => {
  stopRealtimeUpdates()
})
</script>

<style scoped>
/* Animações customizadas */
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.animate-bounce {
  animation: typing 1.4s infinite ease-in-out;
}

/* Scroll suave */
.overflow-y-auto {
  scroll-behavior: smooth;
}

/* Focus outline customizado */
textarea:focus,
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Transições suaves */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>