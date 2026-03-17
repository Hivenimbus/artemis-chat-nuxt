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
          <div v-if="selectedContact.profilePictureUrl" class="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
            <img :src="selectedContact.profilePictureUrl" alt="Foto de perfil" class="h-full w-full object-cover" />
          </div>
          <div v-else class="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
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
                        :key="systemTag.id || systemTag"
                        class="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          :checked="isTagSelected(systemTag)"
                          @change="toggleTag(systemTag.nome || systemTag)"
                          class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
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
                      class="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                    >
                      + Adicionar Tag
                    </button>

                    <!-- Input para nova tag (aparece quando clicado) -->
                    <div v-if="showAddTagInput" class="mt-2 flex">
                      <input
                        v-model="newTag"
                        type="text"
                        placeholder="Nome da tag..."
                        class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-red-500"
                        @keyup.enter="addNewSystemTag"
                      />
                      <button
                        @click="addNewSystemTag"
                        class="px-2 py-1 bg-red-600 text-white text-sm rounded-r-md hover:bg-red-700"
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
      <div class="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto relative" id="chat-messages" @scroll="handleChatScroll">
        <!-- Loading state -->
        <div v-if="loadingMessages" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-900 shadow-sm'
            ]"
          >
            <!-- Componente de mídia para mensagens com mídia -->
            <MediaPreview
              v-if="message.media_url || (message.media_type && message.media_type !== 'text')"
              :message="message"
              :show-file-name="false"
              :show-caption="true"
              @error="handleMediaError"
            />

            <!-- Mensagem de texto tradicional (quando NÃO há mídia) -->
            <div v-if="!message.media_url && (message.text || message.texto)">
              <p class="text-sm">{{ message.text || message.texto }}</p>
            </div>

            <!-- Timestamp da mensagem -->
            <p class="text-xs mt-1" :class="message.sender === 'user' ? 'text-red-200' : 'text-gray-500'">
              {{ formatTime(message.timestamp) }}
            </p>
          </div>
        </div>

        <!-- Botão scroll para o fim -->
        <Transition name="fade">
          <button
            v-if="showScrollButton"
            @click="scrollToBottom"
            class="sticky bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full p-2 hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Ir para o fim"
          >
            <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </Transition>
      </div>

      <!-- Input de mensagem -->
      <div class="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <!-- Aviso de WhatsApp desconectado -->
        <div v-if="isInboxDisconnected" class="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          <svg class="h-5 w-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <span>WhatsApp desconectado. Contate o administrador para reconectar a caixa de entrada.</span>
        </div>

        <div v-if="!isInboxDisconnected" class="space-y-3">
          <!-- Campo de mensagem maior -->
          <div class="flex items-end space-x-3">
            <!-- Textarea (esconder durante gravação ou envio) -->
            <textarea
              ref="messageTextarea"
              v-if="!isRecording && !uploadingFile"
              v-model="newMessage"
              @input="autoResizeTextarea"
              @keydown.enter.prevent="handleEnterKey"
              placeholder="Digite sua mensagem..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none overflow-y-auto"
              style="min-height: 40px; max-height: 150px;"
            ></textarea>

            <!-- Interface de gravação -->
            <div v-if="isRecording === true" class="flex-1 flex items-center space-x-4 px-4 py-4 border border-red-300 rounded-lg bg-red-50">
              <!-- Indicador de gravação -->
              <div class="flex items-center space-x-2">
                <div class="h-3 w-3 bg-red-600 rounded-full animate-pulse"></div>
                <span class="text-sm font-medium text-gray-700">{{ formatRecordingTime(recordingTime) }}</span>
              </div>

              <!-- Botão de pausar/continuar -->
              <button
                @click="isPaused ? resumeAudioRecording() : pauseAudioRecording()"
                class="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Pausar/Continuar"
              >
                <svg v-if="!isPaused" class="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                <svg v-else class="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>

              <!-- Botão de cancelar -->
              <button
                @click="cancelAudioRecording"
                class="p-2 hover:bg-red-200 rounded-full transition-colors"
                title="Cancelar"
              >
                <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>

            <!-- Interface de envio de áudio -->
            <div v-if="isRecording === 'sending' || isSendingAudio" class="flex-1 flex items-center justify-center space-x-3 px-4 py-4 border border-green-300 rounded-lg bg-green-50">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              <span class="text-sm font-medium text-gray-700">Enviando áudio...</span>
            </div>

            <!-- Botão de microfone (quando campo vazio e não está gravando) -->
            <button
              v-if="!newMessage.trim() && !selectedFile && !isRecording && !isSendingAudio"
              @click="startAudioRecording"
              class="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Gravar áudio"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            </button>

            <!-- Botão de enviar (quando há texto, arquivo selecionado, ou está gravando) -->
            <button
              v-if="newMessage.trim() || selectedFile || isRecording"
              @click="isRecording ? stopAudioRecording(true) : sendMessage()"
              :disabled="uploadingFile || isRecording === 'sending'"
              class="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
              :title="isRecording ? 'Enviar áudio' : 'Enviar mensagem'"
            >
              <svg class="h-5 w-5 send-icon-rotated" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>

          <!-- Preview do arquivo selecionado -->
          <div v-if="selectedFile" class="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-2">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg v-if="selectedFile.type.startsWith('image/')" class="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <svg v-else-if="selectedFile.type.startsWith('video/')" class="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <svg v-else class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ selectedFile.name }}</p>
                <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
            <button
              @click="clearSelectedFile"
              class="text-gray-400 hover:text-red-500"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Botões de ação abaixo -->
          <div class="flex justify-start space-x-4">
            <!-- Input file oculto -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              @change="handleFileSelect"
              class="hidden"
            />
            <button
              @click="openFileSelector"
              class="text-gray-400 hover:text-gray-600 flex items-center space-x-2 text-sm"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <span>Anexar arquivo</span>
            </button>
            <div class="relative">
              <button 
                @click="toggleAIOptions"
                class="text-gray-400 hover:text-gray-600 flex items-center space-x-2 text-sm transition-colors"
                :class="{ 'text-red-600': showAIOptions }"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <span>Inteligência Artificial</span>
              </button>
              
              <!-- Dropdown IA -->
              <div 
                v-if="showAIOptions"
                v-click-outside="closeAIOptions"
                class="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
              >
                <div class="py-1">
                  <button
                    v-for="option in aiOptions"
                    :key="option.id"
                    @click="handleAIOption(option)"
                    class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center space-x-3 transition-colors"
                  >
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="relative">
              <button
                @click="toggleEmojiPicker"
                class="text-gray-400 hover:text-gray-600 flex items-center space-x-2 text-sm"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Emoji</span>
              </button>

              <!-- Emoji Picker Dropdown -->
              <div
                v-if="showEmojiPicker"
                v-click-outside="closeEmojiPicker"
                class="absolute bottom-full left-0 mb-2 z-50 shadow-lg rounded-lg"
              >
                <NuxtEmojiPicker
                  :hide-search="false"
                  theme="light"
                  @select="onSelectEmoji"
                />
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
                  <div v-if="selectedContact.profilePictureUrl" class="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                    <img :src="selectedContact.profilePictureUrl" alt="Foto de perfil" class="h-full w-full object-cover" />
                  </div>
                  <div v-else class="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {{ getInitials(selectedContact.name) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div v-if="!isEditingContact" class="flex items-start justify-between group">
                      <div class="mr-2 truncate">
                        <p class="text-sm font-medium text-gray-900 truncate" :title="selectedContact.name">{{ selectedContact.name }}</p>
                        <p class="text-xs text-gray-500">{{ formatPhone(selectedContact.phone) }}</p>
                      </div>
                      <button 
                        @click="startEditingContact"
                        class="text-gray-400 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="Editar nome"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                    </div>
                    <div v-else class="space-y-2">
                      <input 
                        v-model="editedName"
                        type="text"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                        @keyup.enter="saveContactName"
                        @keyup.esc="cancelEditingContact"
                        ref="editNameInput"
                      />
                      <div class="flex space-x-2">
                        <button 
                          @click="saveContactName"
                          :disabled="savingContact || !editedName.trim()"
                          class="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {{ savingContact ? '...' : 'Salvar' }}
                        </button>
                        <button 
                          @click="cancelEditingContact"
                          class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500">Caixa de Entrada</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ getCaixaEntradaNome(selectedContact.caixa_entrada) }}</p>
                </div>

                <!-- Atribuído a -->
                <div class="bg-gray-50 p-3 rounded-lg mt-2">
                  <p class="text-xs text-gray-500">Atribuído a</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ selectedContact.responsavel_name || 'Não atribuído' }}</p>
                </div>

                <!-- Tags do contato -->
                <div v-if="selectedContact.tags && selectedContact.tags.length > 0" class="bg-gray-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500 mb-2">Tags</p>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(tag, index) in selectedContact.tags"
                      :key="typeof tag === 'object' ? tag.id : index"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                      :class="typeof getTagColor(tag) === 'string' ? getTagColor(tag) : ''"
                      :style="typeof getTagColor(tag) === 'object' ? getTagColor(tag) : {}"
                    >
                      {{ getTagName(tag) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ações -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-500 uppercase mb-3">Ações</h4>
              <div class="space-y-2">
                <button
                  @click="openTransferModal"
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3 transition-colors duration-200 border border-gray-200"
                >
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                  <span>Transferir atendimento</span>
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

      <!-- Modal de Transferência -->
      <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeTransferModal"></div>

        <div class="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
          <div class="absolute top-0 right-0 pt-4 pr-4">
            <button
              @click="closeTransferModal"
              type="button"
              class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span class="sr-only">Fechar</span>
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Transferir Atendimento
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 mb-4">
                  Selecione um agente ou equipe para transferir este atendimento.
                </p>

                <!-- Loading State -->
                <div v-if="loadingAgents" class="flex justify-center py-4">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>

                <!-- Lista de Agentes e Equipes -->
                <div v-else class="mt-4 max-h-60 overflow-y-auto space-y-4">
                  <!-- Equipes e seus membros -->
                  <div v-for="equipe in groupedAgents.teams" :key="equipe.id">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">
                      {{ equipe.nome }}
                    </h4>
                    <ul class="space-y-1">
                      <li v-for="agente in equipe.membros" :key="agente.id">
                        <button
                          @click="transferToAgent(agente)"
                          class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center justify-between group transition-colors"
                          :disabled="transferringChat"
                        >
                          <div class="flex items-center">
                            <div class="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-medium mr-3">
                              {{ getInitials(agente.name) }}
                            </div>
                            <div>
                              <p class="text-sm font-medium text-gray-900">{{ agente.name }}</p>
                              <p class="text-xs text-gray-500">{{ agente.email }}</p>
                            </div>
                          </div>
                          <svg class="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>

                  <!-- Agentes sem equipe -->
                  <div v-if="groupedAgents.others.length > 0">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">
                      Outros Agentes
                    </h4>
                    <ul class="space-y-1">
                      <li v-for="agente in groupedAgents.others" :key="agente.id">
                        <button
                          @click="transferToAgent(agente)"
                          class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center justify-between group transition-colors"
                          :disabled="transferringChat"
                        >
                          <div class="flex items-center">
                            <div class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium mr-3">
                              {{ getInitials(agente.name) }}
                            </div>
                            <div>
                              <p class="text-sm font-medium text-gray-900">{{ agente.name }}</p>
                              <p class="text-xs text-gray-500">{{ agente.email }}</p>
                            </div>
                          </div>
                          <svg class="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                  
                  <div v-if="groupedAgents.teams.length === 0 && groupedAgents.others.length === 0" class="text-center py-4 text-gray-500 text-sm">
                    Nenhum agente disponível para transferência.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Modal de Confirmação de Transferência -->
      <div v-if="showConfirmTransferModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="cancelTransfer"></div>

        <div class="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:max-w-md sm:w-full sm:p-6">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Confirmar Transferência
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Deseja realmente transferir o atendimento de <strong>{{ selectedContact?.name }}</strong> para <strong>{{ agentToTransfer?.name }}</strong>?
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              @click="confirmTransfer"
              :disabled="transferringChat"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ transferringChat ? 'Transferindo...' : 'Confirmar' }}
            </button>
            <button
              type="button"
              @click="cancelTransfer"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Preview IA -->
      <div v-if="showAIPreview" class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="!aiProcessing && cancelAI()"></div>

        <div class="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <svg class="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Sugestão da IA ({{ aiSelectedOption }})
            </h3>
            <button
              v-if="!aiProcessing"
              @click="cancelAI"
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span class="sr-only">Fechar</span>
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="aiProcessing" class="py-12 flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
            <p class="text-sm text-gray-500">A inteligência artificial está processando seu texto...</p>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Original</h4>
                <div class="text-sm text-gray-800 whitespace-pre-wrap">{{ aiOriginalText }}</div>
              </div>
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Sugestão</h4>
                <div class="text-sm text-red-900 whitespace-pre-wrap">{{ aiGeneratedText }}</div>
              </div>
            </div>

            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                @click="acceptAIResult"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              >
                Aceitar e Substituir
              </button>
              <button
                type="button"
                @click="cancelAI"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'

const { showToast } = useToast()

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
  },
  currentUserId: {
    type: String,
    default: null
  },
  inboxStatus: {
    type: String,
    default: 'connected'
  }
})

const isInboxDisconnected = computed(() => props.inboxStatus !== 'connected')

const emit = defineEmits([
  'send-message',
  'toggle-tag',
  'add-tag',
  'resolve-chat',
  'export-chat',
  'transfer-chat',
  'block-contact',
  'delete-chat',
  'update-contact'
])

const newMessage = ref('')
const showTagDropdown = ref(false)
const showScrollButton = ref(false)
const showKebabSidebar = ref(false)
const showAddTagInput = ref(false)

// Estados de edição de contato
const isEditingContact = ref(false)
const editedName = ref('')
const savingContact = ref(false)

// Estados para mensagens
const messages = ref([])
const loadingMessages = ref(false)
const newTag = ref('')

// Estados para upload de arquivo
const messageTextarea = ref(null)
const fileInput = ref(null)
const selectedFile = ref(null)
const uploadingFile = ref(false)
const isSendingAudio = ref(false)

// Estados para gravação de áudio
const isRecording = ref(false)
const isPaused = ref(false)
const recordingTime = ref(0)
const audioBlob = ref(null)
const mediaRecorder = ref(null)
const recordingInterval = ref(null)

// Estados para emoji picker
const showEmojiPicker = ref(false)

// Estados para IA
const showAIOptions = ref(false)
const showAIPreview = ref(false)
const aiProcessing = ref(false)
const aiOriginalText = ref('')
const aiGeneratedText = ref('')
const aiSelectedOption = ref('')

const aiOptions = [
  { id: 'corrigir', label: 'Corrigir ortografia' },
  { id: 'melhorar', label: 'Melhorar escrita' },
  { id: 'formal', label: 'Deixar formal' },
  { id: 'resumir', label: 'Resumir' },
  { id: 'expandir', label: 'Expandir' }
]

// Carregar mensagens do atendimento
const loadMessages = async (contactId, silent = false) => {
  if (!contactId) {
    messages.value = []
    return
  }

  if (!silent) loadingMessages.value = true
  try {
    const response = await $fetch(`/api/atendimentos/${contactId}/mensagens`)
    if (response?.success && response?.data?.mensagens) {
      // Se for atualização silenciosa (polling), verifica se houve mudanças
      if (silent) {
        const newMessages = response.data.mensagens
        const currentMessages = messages.value

        // Não sobrescrever enquanto há mensagem otimista em andamento
        if (currentMessages.some(m => m._optimistic)) return

        // Verifica se houve mudança na quantidade ou no último item
        const hasChanges = newMessages.length !== currentMessages.length ||
          (newMessages.length > 0 && currentMessages.length > 0 &&
           newMessages[newMessages.length - 1].id !== currentMessages[currentMessages.length - 1].id)

        // Se houver mudanças, atualiza
        if (hasChanges) {
          messages.value = newMessages
        }
      } else {
        messages.value = response.data.mensagens
        nextTick(() => {
          scrollToBottom()
          setTimeout(() => scrollToBottom(), 300)
        })
      }
    } else if (!silent) {
      messages.value = []
    }
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error)
    if (!silent) messages.value = []
  } finally {
    if (!silent) loadingMessages.value = false
  }
}

// Rolar para a parte inferior do chat
const scrollToBottom = () => {
  const chatMessages = document.getElementById('chat-messages')
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

const handleChatScroll = () => {
  const el = document.getElementById('chat-messages')
  if (!el) return
  showScrollButton.value = el.scrollHeight - el.scrollTop - el.clientHeight > 150
}

// Atualizar mensagens (para ser chamado pelo componente pai)
const refreshMessages = async () => {
  if (props.selectedContact?.id) {
    await loadMessages(props.selectedContact.id, true)
  }
}

// Expor funções para o componente pai
defineExpose({
  refreshMessages,
  scrollToBottom
})

// Watch para carregar mensagens quando o contato selecionado mudar
watch(() => props.selectedContact?.id, (newContactId) => {
  showScrollButton.value = false
  if (newContactId) {
    loadMessages(newContactId)
  } else {
    messages.value = []
  }
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

// Enviar mensagem (texto ou arquivo)
const sendMessage = async () => {
  if ((!newMessage.value.trim() && !selectedFile.value) || !props.selectedContact) return
  if (uploadingFile.value) return // Evitar múltiplos uploads simultâneos

  const messageText = newMessage.value.trim()
  const file = selectedFile.value

  try {
    uploadingFile.value = true

    // Adicionar mensagem otimista localmente
    const tempMessage = {
      id: Date.now().toString(), // ID temporário
      text: file ? `📎 ${file.name}` : messageText,
      sender: 'user',
      timestamp: new Date(),
      lida: true,
      usuario_name: 'Você',
      media_name: file?.name
    }

    messages.value.push(tempMessage)

    // Limpar inputs imediatamente (o spinner de imagem não depende mais de selectedFile)
    newMessage.value = ''
    clearSelectedFile()
    nextTick(() => { if (messageTextarea.value) messageTextarea.value.style.height = '40px' })

    // Preparar envio
    if (file) {
      // Enviar com FormData (arquivo)
      const formData = new FormData()
      formData.append('file', file)
      // Sempre adicionar texto, mesmo vazio (para o backend saber que é intencional)
      formData.append('texto', messageText || '')

      // Fazer upload via $fetch
      const response = await $fetch(`/api/atendimentos/${props.selectedContact.id}/mensagens`, {
        method: 'POST',
        body: formData
      })

      if (response?.success) {
        console.log('Arquivo enviado com sucesso:', response.data)
        // Atualizar mensagem temporária com dados reais
        const index = messages.value.findIndex(m => m.id === tempMessage.id)
        if (index > -1) {
          messages.value[index] = {
            ...response.data,
            sender: response.data.sender || 'user'
          }
        }
      }
    } else {
      // Enviar apenas texto (comportamento existente)
      emit('send-message', messageText)
    }

    // Rolar para ver a nova mensagem
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    // Remover mensagem temporária em caso de erro
    messages.value = messages.value.filter(m => m.id !== tempMessage.id)
    showToast('Erro ao enviar mensagem. Tente novamente.', 'error')
  } finally {
    uploadingFile.value = false
  }
}

// Funções para gerenciamento de arquivo
const autoResizeTextarea = () => {
  const el = messageTextarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 150) + 'px'
}

const openFileSelector = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Validar tamanho (16MB máximo)
  const maxSize = 16 * 1024 * 1024 // 16MB
  if (file.size > maxSize) {
    showToast('Arquivo muito grande. O tamanho máximo é 16MB.', 'error')
    return
  }

  // Validar tipo de arquivo
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]

  if (!allowedTypes.includes(file.type)) {
    showToast('Tipo de arquivo não suportado. Use imagens, vídeos, áudio ou documentos (PDF, DOC, XLS, TXT).', 'error')
    return
  }

  selectedFile.value = file
  // Limpar o input para permitir selecionar o mesmo arquivo novamente
  event.target.value = ''
}

const clearSelectedFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Funções de gravação de áudio
const startAudioRecording = async () => {
  try {
    // Solicitar permissão de microfone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Detectar MIME type suportado pelo navegador
    // Chrome/Edge: audio/webm;codecs=opus | Firefox: audio/ogg;codecs=opus
    const preferredTypes = ['audio/ogg;codecs=opus', 'audio/ogg', 'audio/webm;codecs=opus', 'audio/webm']
    const supportedMime = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) || ''

    // Configurar MediaRecorder com o tipo suportado
    const recorderOptions = supportedMime ? { mimeType: supportedMime } : {}
    const recorder = new MediaRecorder(stream, recorderOptions)
    mediaRecorder.value = recorder

    const audioChunks = []

    recorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    recorder.onstop = async () => {
      // Usar o MIME type real do recorder, não um tipo inventado
      const actualMime = recorder.mimeType || supportedMime || 'audio/webm'
      const blob = new Blob(audioChunks, { type: actualMime })
      audioBlob.value = blob

      // Parar todas as tracks do stream
      stream.getTracks().forEach(track => track.stop())

      // Se deve enviar automaticamente
      if (isRecording.value === 'sending') {
        await sendAudioRecording()
      }

      isRecording.value = false
    }

    // Iniciar gravação
    recorder.start()
    isRecording.value = true
    recordingTime.value = 0

    // Iniciar contador de tempo
    recordingInterval.value = setInterval(() => {
      if (!isPaused.value) {
        recordingTime.value++
      }
    }, 1000)

    console.log('🎤 Gravação de áudio iniciada')
  } catch (error) {
    console.error('Erro ao iniciar gravação de áudio:', error)
    showToast('Erro ao acessar microfone. Verifique as permissões do navegador.', 'error')
  }
}

const stopAudioRecording = (shouldSend = false) => {
  if (mediaRecorder.value && isRecording.value) {
    // Marcar que deve enviar após parar
    if (shouldSend) {
      isRecording.value = 'sending'
    }

    mediaRecorder.value.stop()
    isPaused.value = false

    // Parar contador
    if (recordingInterval.value) {
      clearInterval(recordingInterval.value)
      recordingInterval.value = null
    }

    console.log('🎤 Gravação de áudio finalizada')
  }
}

const pauseAudioRecording = () => {
  if (mediaRecorder.value && isRecording.value && !isPaused.value) {
    mediaRecorder.value.pause()
    isPaused.value = true
    console.log('⏸️ Gravação pausada')
  }
}

const resumeAudioRecording = () => {
  if (mediaRecorder.value && isRecording.value && isPaused.value) {
    mediaRecorder.value.resume()
    isPaused.value = false
    console.log('▶️ Gravação retomada')
  }
}

const cancelAudioRecording = () => {
  if (mediaRecorder.value) {
    // Parar gravação sem salvar
    isRecording.value = false
    isPaused.value = false
    audioBlob.value = null
    recordingTime.value = 0

    // Parar contador
    if (recordingInterval.value) {
      clearInterval(recordingInterval.value)
      recordingInterval.value = null
    }

    // Parar MediaRecorder e stream
    if (mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }

    // Parar stream de áudio
    if (mediaRecorder.value.stream) {
      mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.value = null
    console.log('❌ Gravação cancelada')
  }
}

const sendAudioRecording = async () => {
  if (!audioBlob.value || !props.selectedContact) return

  try {
    isSendingAudio.value = true
    uploadingFile.value = true

    // Capturar blob antes de limpar o estado
    const blobToSend = audioBlob.value
    const actualMime = blobToSend.type || 'audio/webm'
    const audioExt = actualMime.includes('ogg') ? 'ogg' : 'webm'
    const audioFile = new File([blobToSend], `audio_${Date.now()}.${audioExt}`, { type: actualMime })

    // Mensagem otimista — aparece imediatamente no chat
    const tempId = Date.now().toString()
    messages.value.push({
      id: tempId,
      type: 'audio',
      text: '',
      sender: 'user',
      timestamp: new Date(),
      lida: true,
      usuario_name: 'Você',
      _optimistic: true,
    })

    // Limpar estado de gravação ANTES do await
    isRecording.value = false
    audioBlob.value = null
    recordingTime.value = 0

    nextTick(() => scrollToBottom())

    // Criar FormData e enviar
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('texto', '')

    const response = await $fetch(`/api/atendimentos/${props.selectedContact.id}/mensagens`, {
      method: 'POST',
      body: formData
    })

    if (response?.success) {
      // Substituir mensagem otimista pelos dados reais (com media_url)
      const index = messages.value.findIndex(m => m.id === tempId)
      if (index > -1) {
        messages.value[index] = { ...response.data, sender: response.data.sender || 'user' }
      }
      nextTick(() => scrollToBottom())
    } else {
      messages.value = messages.value.filter(m => m.id !== tempId)
      showToast('Erro ao enviar áudio.', 'error')
    }

  } catch (error) {
    console.error('Erro ao enviar áudio:', error)
    messages.value = messages.value.filter(m => !m._optimistic)
    showToast('Erro ao enviar áudio. Tente novamente.', 'error')
  } finally {
    isSendingAudio.value = false
    uploadingFile.value = false
    isRecording.value = false
  }
}

const formatRecordingTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
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

// Funções para gerenciamento de emoji picker
const toggleEmojiPicker = () => {
  if (showAIOptions.value) showAIOptions.value = false
  showEmojiPicker.value = !showEmojiPicker.value
}

const closeEmojiPicker = () => {
  showEmojiPicker.value = false
}

const onSelectEmoji = (emoji) => {
  // Adicionar emoji ao campo de mensagem
  newMessage.value += emoji.i
  // Fechar o picker
  showEmojiPicker.value = false

  // Focar no textarea
  nextTick(() => {
    const textarea = document.querySelector('textarea')
    if (textarea) textarea.focus()
  })
}

// Funções de IA
const toggleAIOptions = () => {
  if (showEmojiPicker.value) showEmojiPicker.value = false
  if (showTagDropdown.value) showTagDropdown.value = false
  if (showKebabSidebar.value) showKebabSidebar.value = false
  showAIOptions.value = !showAIOptions.value
}

const closeAIOptions = () => {
  showAIOptions.value = false
}

const handleAIOption = async (option) => {
  if (!newMessage.value.trim()) {
    showToast('Digite uma mensagem para usar a IA.', 'warning')
    return
  }

  closeAIOptions()
  aiSelectedOption.value = option.label
  aiOriginalText.value = newMessage.value
  aiProcessing.value = true
  showAIPreview.value = true // Mostrar modal com loading

  try {
    const response = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: {
        text: newMessage.value,
        option: option.id
      }
    })

    if (response?.success) {
      aiGeneratedText.value = response.data
    } else {
      throw new Error('Falha na geração')
    }
  } catch (error) {
    console.error('Erro na IA:', error)
    showToast('Erro ao processar texto com IA.', 'error')
    showAIPreview.value = false
  } finally {
    aiProcessing.value = false
  }
}

const acceptAIResult = () => {
  newMessage.value = aiGeneratedText.value
  showAIPreview.value = false
  aiGeneratedText.value = ''
  aiOriginalText.value = ''
  
  // Focar no textarea
  nextTick(() => {
    const textarea = document.querySelector('textarea')
    if (textarea) textarea.focus()
  })
}

const cancelAI = () => {
  showAIPreview.value = false
  aiGeneratedText.value = ''
  aiOriginalText.value = ''
}

// Funções de edição de contato
const editNameInput = ref(null)

const startEditingContact = () => {
  editedName.value = props.selectedContact.name
  isEditingContact.value = true
  nextTick(() => {
    if (editNameInput.value) {
      editNameInput.value.focus()
    }
  })
}

const cancelEditingContact = () => {
  isEditingContact.value = false
  editedName.value = ''
}

const saveContactName = async () => {
  if (!editedName.value.trim() || !props.selectedContact) return
  if (savingContact.value) return

  try {
    savingContact.value = true
    const newName = editedName.value.trim()
    
    // Usar contato_id se disponível (estrutura de atendimento), senão usar id (estrutura de contato)
    const contactId = props.selectedContact.contato_id || props.selectedContact.id
    
    console.log('Atualizando contato:', { 
      originalId: props.selectedContact.id, 
      contatoId: props.selectedContact.contato_id, 
      finalId: contactId 
    })

    const response = await $fetch(`/api/contatos/${contactId}`, {
      method: 'PUT',
      body: {
        nome: newName,
        telefone: props.selectedContact.phone
      }
    })

    if (response?.success) {
      // Emitir evento para atualizar o contato no componente pai
      emit('update-contact', {
        ...props.selectedContact,
        name: newName
      })
      
      isEditingContact.value = false
    }
  } catch (error) {
    console.error('Erro ao atualizar nome do contato:', error)
    showToast('Erro ao atualizar nome do contato.', 'error')
  } finally {
    savingContact.value = false
  }
}

// Estados para transferência de atendimento
const showTransferModal = ref(false)
const agentsList = ref([])
const loadingAgents = ref(false)
const transferringChat = ref(false)
const showConfirmTransferModal = ref(false)
const agentToTransfer = ref(null)

const groupedAgents = computed(() => {
  const teamsMap = new Map()
  const others = []

  agentsList.value.forEach(agent => {
    // Pular o próprio usuário
    if (props.currentUserId && agent.id === props.currentUserId) {
      return
    }

    // Verificar se o agente tem equipes
    if (agent.equipes_agentes && agent.equipes_agentes.length > 0) {
      agent.equipes_agentes.forEach(relation => {
        const team = relation.equipes
        if (!teamsMap.has(team.id)) {
          teamsMap.set(team.id, {
            id: team.id,
            nome: team.nome,
            membros: []
          })
        }
        // Evitar duplicatas na mesma equipe (caso venha sujo do backend)
        const teamGroup = teamsMap.get(team.id)
        if (!teamGroup.membros.find(m => m.id === agent.id)) {
          teamGroup.membros.push(agent)
        }
      })
    } else {
      others.push(agent)
    }
  })

  // Converter Map para Array
  const teams = Array.from(teamsMap.values())

  return { teams, others }
})

const openTransferModal = async () => {
  showTransferModal.value = true
  if (agentsList.value.length === 0) {
    await loadAgents()
  }
}

const closeTransferModal = () => {
  showTransferModal.value = false
}

const loadAgents = async () => {
  loadingAgents.value = true
  try {
    const response = await $fetch('/api/agentes')
    if (response?.success) {
      // Filtrar o próprio usuário da lista (opcional, mas faz sentido não transferir para si mesmo se já é o dono)
      // Mas o requisito diz "lista de todos os agentes", então mantemos todos.
      agentsList.value = response.data
    }
  } catch (error) {
    console.error('Erro ao carregar agentes:', error)
    showToast('Erro ao carregar lista de agentes.', 'error')
  } finally {
    loadingAgents.value = false
  }
}

const transferToAgent = async (agent) => {
  if (!props.selectedContact || transferringChat.value) return

  agentToTransfer.value = agent
  showConfirmTransferModal.value = true
}

const cancelTransfer = () => {
  showConfirmTransferModal.value = false
  agentToTransfer.value = null
}

const confirmTransfer = async () => {
  if (!agentToTransfer.value || !props.selectedContact) return

  transferringChat.value = true
  const agent = agentToTransfer.value

  try {
    const response = await $fetch(`/api/atendimentos/${props.selectedContact.id}/assign`, {
      method: 'PATCH',
      body: { userId: agent.id }
    })

    if (response?.success) {
      showToast(`Atendimento transferido com sucesso para ${agent.name}`, 'success')
      closeTransferModal()
      cancelTransfer() // Fechar modal de confirmação
      emit('transfer-chat', agent) // Notificar pai para atualizar UI (ex: remover da lista se necessário)
    }
  } catch (error) {
    console.error('Erro ao transferir atendimento:', error)
    showToast('Erro ao transferir atendimento. Tente novamente.', 'error')
  } finally {
    transferringChat.value = false
  }
}

// Funções utilitárias
const getInitials = (name) => {
  if (!name) return ''
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const getCaixaEntradaNome = (caixaId) => {
  // Prioridade 1: Nome vindo diretamente no objeto do contato (se disponível e id corresponder)
  if (props.selectedContact?.inbox_id === caixaId && props.selectedContact?.inbox_name) {
    return props.selectedContact.inbox_name
  }
  
  if (!caixaId) return 'Não definida'
  
  // Prioridade 2: Mapa de inboxes carregadas
  return props.caixasEntradaMap[caixaId] || caixaId
}

const isTagSelected = (systemTag) => {
  if (!props.selectedContact?.tags || !systemTag) return false

  const tagName = typeof systemTag === 'object' ? systemTag.nome : systemTag
  return props.selectedContact.tags.some(contactTag => {
    const contactTagName = typeof contactTag === 'object' ? contactTag.nome : contactTag
    return contactTagName === tagName
  })
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

// Funções para gerenciamento de cores das tags
const getTagColor = (tag) => {
  // Se tag for um objeto com cor (nova estrutura), usar a cor do banco
  if (typeof tag === 'object' && tag.cor) {
    return {
      backgroundColor: tag.cor + '20', // Adicionar transparência
      color: tag.cor,
      borderColor: tag.cor
    }
  }

  // Se tag for string (antiga estrutura) ou não tiver cor, usar cor padrão
  return 'bg-gray-100 text-gray-800'
}

const getTagName = (tag) => {
  // Extrair nome da tag (se for objeto ou string)
  return typeof tag === 'object' ? tag.nome : tag
}

// Manipular erros de mídia
const handleMediaError = (error) => {
  console.error('Erro ao carregar mídia:', error)
  // Aqui você pode adicionar lógica adicional, como mostrar uma notificação
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
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

/* Ícone de enviar rotacionado para apontar para direita */
.send-icon-rotated {
  transform: rotate(90deg);
}
</style>
