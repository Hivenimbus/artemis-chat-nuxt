<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Campanhas</h1>
        <p class="mt-2 text-gray-600">Crie campanhas de disparo em massa no WhatsApp para seus contatos</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Formulário de Campanha -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-8">
        <!-- Seção 1: Seleção de Destinatários -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Destinatários</h2>
              <p class="text-sm text-gray-500">Selecione quem receberá a campanha</p>
            </div>
          </div>

          <!-- Opções de seleção -->
          <div class="space-y-4">
            <label class="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-indigo-500 bg-indigo-50': recipientType === 'all' }">
              <input
                type="radio"
                v-model="recipientType"
                value="all"
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div class="flex-1">
                <span class="block text-sm font-medium text-gray-900">Todos os contatos</span>
                <span class="block text-sm text-gray-500">Enviar para toda a base de contatos cadastrados</span>
              </div>
              <span class="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full">
                {{ totalContacts }} contatos
              </span>
            </label>

            <label class="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-indigo-500 bg-indigo-50': recipientType === 'tags' }">
              <input
                type="radio"
                v-model="recipientType"
                value="tags"
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div class="flex-1">
                <span class="block text-sm font-medium text-gray-900">Contatos com tags específicas</span>
                <span class="block text-sm text-gray-500">Filtrar por etiquetas para segmentar o envio</span>
              </div>
            </label>
          </div>

          <!-- Seleção de Tags -->
          <div v-if="recipientType === 'tags'" class="mt-4 ml-7">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Selecione as tags
            </label>
            <div class="flex flex-wrap gap-3 p-1">
              <button
                v-for="tag in availableTags"
                :key="getTagId(tag)"
                type="button"
                @click="toggleTag(tag)"
                class="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200"
                :class="isTagSelected(tag) 
                  ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' 
                  : 'hover:scale-105 opacity-80 hover:opacity-100'"
                :style="getTagStyle(tag)"
              >
                {{ getTagName(tag) }}
              </button>
            </div>
            
            <!-- Contador de contatos filtrados -->
            <div v-if="selectedTags.length > 0" class="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ filteredContactsCount }} contatos serão impactados</span>
            </div>
          </div>
        </div>

        <!-- Seção 2: Mensagem -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Mensagem</h2>
              <p class="text-sm text-gray-500">Escreva o conteúdo da sua campanha</p>
            </div>
          </div>

          <CampaignMessageEditor
            v-model="messageText"
            placeholder="Olá {{nome}}, temos uma novidade especial para você..."
            :rows="8"
            :error="errors.message"
            :show-preview="false"
            :sample-contact="sampleContact"
            @save-template="handleSaveTemplate"
          />
        </div>

        <!-- Seção 3: Anexos -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Anexos</h2>
              <p class="text-sm text-gray-500">Adicione mídias à sua mensagem (opcional)</p>
            </div>
          </div>

          <!-- Seletores de Tipo -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <button
              type="button"
              @click="openAttachmentModal('image')"
              class="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-sm font-medium text-gray-700 group-hover:text-blue-600">Imagem</span>
            </button>

            <button
              type="button"
              @click="openAttachmentModal('video')"
              class="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
            >
              <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="text-sm font-medium text-gray-700 group-hover:text-purple-600">Vídeo</span>
            </button>

            <button
              type="button"
              @click="openAttachmentModal('audio')"
              class="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
            >
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span class="text-sm font-medium text-gray-700 group-hover:text-green-600">Áudio</span>
            </button>

            <button
              type="button"
              @click="openAttachmentModal('document')"
              class="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors group"
            >
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="text-sm font-medium text-gray-700 group-hover:text-orange-600">Documento</span>
            </button>
          </div>

          <!-- Grid de Anexos Carregados -->
          <div v-if="attachments.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(att, index) in attachments"
              :key="index"
              class="relative border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              <!-- Preview/Thumbnail -->
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                  <img
                    v-if="att.previewUrl && att.file?.type?.startsWith('image/')"
                    :src="att.previewUrl"
                    class="w-full h-full object-cover"
                  />
                  <svg v-else-if="att.file?.type?.startsWith('video/')" class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else-if="att.file?.type?.startsWith('audio/')" class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <svg v-else class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ att.file?.name || 'Arquivo' }}</p>
                  <p v-if="att.caption" class="text-xs text-indigo-600 mt-1 truncate">"{{ att.caption }}"</p>
                </div>

                <!-- Ações -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    @click="editAttachment(index)"
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Editar"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="removeAttachment(index)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remover"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mensagem quando não há anexos -->
          <div v-else class="text-center py-4 text-sm text-gray-500">
            Clique em um tipo de arquivo acima para adicionar anexos
          </div>
        </div>

        <!-- Seção 4: Agendamento -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Envio</h2>
              <p class="text-sm text-gray-500">Configure quando a campanha será enviada</p>
            </div>
          </div>

          <!-- Toggle de agendamento -->
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  v-model="sendType"
                  value="now"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span class="text-sm font-medium text-gray-900">Enviar agora</span>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  v-model="sendType"
                  value="scheduled"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span class="text-sm font-medium text-gray-900">Agendar envio</span>
              </label>
            </div>

            <!-- Campos de agendamento -->
            <div v-if="sendType === 'scheduled'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Data e hora do envio *
                </label>
                <input
                  v-model="scheduledDateTime"
                  type="datetime-local"
                  :min="minDateTime"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <!-- Seleção de Inbox -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Caixa de entrada para envio *
              </label>
              <select
                v-model="selectedInboxId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione uma caixa de entrada</option>
                <option
                  v-for="inbox in inboxes"
                  :key="inbox.id"
                  :value="inbox.id"
                >
                  {{ inbox.name }} {{ inbox.status === 'connected' ? '(Conectado)' : '(Desconectado)' }}
                </option>
              </select>
              <p v-if="errors.inbox" class="mt-1 text-sm text-red-600">{{ errors.inbox }}</p>
            </div>
          </div>
        </div>

        <!-- Resumo e Ações -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumo da Campanha</h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Destinatários</p>
              <p class="text-xl font-semibold text-gray-900">
                {{ recipientType === 'all' ? totalContacts : filteredContactsCount }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Anexos</p>
              <p class="text-xl font-semibold text-gray-900">
                {{ attachments.filter(a => a.file).length }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Envio</p>
              <p class="text-xl font-semibold text-gray-900">
                {{ sendType === 'now' ? 'Imediato' : 'Agendado' }}
              </p>
            </div>
          </div>

          <!-- Botões de ação -->
          <div class="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              @click="resetForm"
              class="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Limpar
            </button>
            <button
              type="submit"
              :disabled="submitting || !canSubmit"
              class="px-6 py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-if="sendType === 'now'">
                {{ submitting ? 'Enviando...' : 'Iniciar Campanha' }}
              </span>
              <span v-else>
                {{ submitting ? 'Agendando...' : 'Agendar Campanha' }}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Modal de Confirmação -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 backdrop-blur-[2px] bg-black/20 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Confirmar Campanha</h3>
            <p class="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-700">
            Você está prestes a enviar uma campanha para 
            <strong>{{ recipientType === 'all' ? totalContacts : filteredContactsCount }} contatos</strong>
            <span v-if="sendType === 'scheduled'">
              agendada para <strong>{{ formatDateTime(scheduledDateTime) }}</strong>
            </span>
            <span v-else>
              <strong>imediatamente</strong>
            </span>.
          </p>
        </div>

        <div class="flex gap-3 justify-end">
          <button
            type="button"
            @click="showConfirmModal = false"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmSubmit"
            :disabled="submitting"
            class="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ submitting ? 'Processando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Anexo -->
    <div
      v-if="showAttachmentModal"
      class="fixed inset-0 backdrop-blur-[2px] bg-black/20 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingAttachmentIndex !== null ? 'Editar' : 'Adicionar' }} {{ getAttachmentTypeLabel(attachmentModalType) }}
          </h3>
          <button
            type="button"
            @click="closeAttachmentModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <!-- Área de Upload -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Arquivo</label>
            <div
              v-if="!tempAttachmentFile"
              @click="triggerModalFileInput"
              @dragover.prevent="modalDragging = true"
              @dragleave.prevent="modalDragging = false"
              @drop.prevent="handleModalDrop"
              class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all"
              :class="modalDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'"
            >
              <input
                ref="modalFileInputRef"
                type="file"
                :accept="getAcceptedTypes(attachmentModalType)"
                class="hidden"
                @change="handleModalFileSelect"
              />
              <svg class="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-sm text-gray-600">Arraste um arquivo ou clique para selecionar</p>
              <p class="text-xs text-gray-400 mt-1">Máx. 16MB</p>
            </div>

            <!-- Preview do arquivo selecionado -->
            <div v-else class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <!-- Preview -->
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="tempAttachmentPreview && tempAttachmentFile.type?.startsWith('image/')"
                    :src="tempAttachmentPreview"
                    class="w-full h-full object-cover"
                  />
                  <video
                    v-else-if="tempAttachmentPreview && tempAttachmentFile.type?.startsWith('video/')"
                    :src="tempAttachmentPreview"
                    class="w-full h-full object-cover"
                  />
                  <svg v-else-if="tempAttachmentFile.type?.startsWith('audio/')" class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <svg v-else class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ tempAttachmentFile.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(tempAttachmentFile.size) }}</p>
                </div>

                <button
                  type="button"
                  @click="clearTempAttachment"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Campo de Legenda -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Legenda (opcional)</label>
            <CampaignMessageEditor
              v-model="tempAttachmentCaption"
              placeholder="Digite uma legenda para o arquivo..."
              :rows="3"
              :show-preview="false"
              :show-save-button="false"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            @click="closeAttachmentModal"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmAttachment"
            :disabled="!tempAttachmentFile && editingAttachmentIndex === null"
            class="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="uploadingAttachment" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ uploadingAttachment ? 'Salvando...' : (editingAttachmentIndex !== null ? 'Salvar' : 'Adicionar') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CampaignMessageEditor from '~/components/CampaignMessageEditor.vue'
import { useContatos } from '~/composables/useContatos'
import { useInboxes } from '~/composables/useInboxes'
import { useToast } from '~/composables/useToast'
import { useAuth } from '~/composables/useAuth'

// Composables
const { fetchContatos, fetchEtiquetas } = useContatos()
const { getInboxes } = useInboxes()
const toast = useToast()
const supabase = useSupabaseClient()
const { user } = useAuth()

// State
const loading = ref(true)
const submitting = ref(false)
const uploadingAttachment = ref(false) // New state for modal button
const showConfirmModal = ref(false)
const showAttachmentModal = ref(false)
const attachmentModalType = ref('image')
const editingAttachmentIndex = ref(null)
const modalDragging = ref(false)
const modalFileInputRef = ref(null)

// Temp state for modal
const tempAttachmentFile = ref(null)
const tempAttachmentCaption = ref('')
const tempAttachmentPreview = ref('')

// Dados carregados
const contacts = ref([])
const availableTags = ref([])
const inboxes = ref([])
const realFilteredCount = ref(0)

// Formulário
const recipientType = ref('all')
const selectedTags = ref([])
const messageText = ref('')
const attachments = ref([]) // Array de { file: File|null, caption: string }
const sendType = ref('now')
const scheduledDateTime = ref('')
const selectedInboxId = ref('')

// Erros
const errors = ref({
  message: '',
  inbox: ''
})

// Watchers para contagem de contatos
watch([recipientType, selectedTags], async () => {
  if (recipientType.value === 'all') {
    realFilteredCount.value = totalContacts.value
    return
  }
  
  if (selectedTags.value.length === 0) {
    realFilteredCount.value = 0
    return
  }

  try {
    const tagsIds = selectedTags.value.map(t => t.id || t)
    const { count } = await $fetch('/api/contatos/count', {
      query: {
        type: 'tags',
        tags: tagsIds
      }
    })
    realFilteredCount.value = count
  } catch (error) {
    console.error('Erro ao contar contatos:', error)
  }
}, { deep: true })

// Computed
const totalContacts = computed(() => contacts.value.length) // Nota: Isso conta apenas os carregados na memória (limit 1000). Idealmente deveria vir do backend também.

const filteredContactsCount = computed(() => {
  if (recipientType.value === 'all') return realFilteredCount.value
  if (selectedTags.value.length === 0) return 0
  return realFilteredCount.value
})

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5) // Mínimo 5 minutos no futuro
  return now.toISOString().slice(0, 16)
})

const canSubmit = computed(() => {
  // Verificar se tem mensagem ou pelo menos um anexo
  const hasAttachments = attachments.value.some(a => a.file)
  if (!messageText.value && !hasAttachments) return false
  
  // Verificar inbox selecionado
  if (!selectedInboxId.value) return false
  
  // Verificar agendamento se for agendado
  if (sendType.value === 'scheduled' && !scheduledDateTime.value) return false
  
  // Verificar se há destinatários
  if (recipientType.value === 'tags' && selectedTags.value.length === 0) return false
  
  return true
})

const sampleContact = computed(() => {
  if (contacts.value.length > 0) {
    const c = contacts.value[0]
    return {
      nome: c.name || c.nome || 'Cliente',
      sobrenome: c.lastName || c.sobrenome || '',
      email: c.email || 'email@exemplo.com',
      telefone: c.phone || c.telefone || '11999999999',
      cidade: c.city || c.cidade || 'São Paulo',
      empresa: c.company || c.empresa || 'Empresa'
    }
  }
  return {
    nome: 'João Silva',
    sobrenome: 'Silva',
    email: 'joao@email.com',
    telefone: '11999998888',
    cidade: 'São Paulo',
    empresa: 'Empresa ABC'
  }
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const [contactsRes, tagsRes, inboxesRes, countRes, templateRes, attachmentsRes] = await Promise.all([
      fetchContatos({ limit: 1000 }),
      fetchEtiquetas(),
      getInboxes(),
      $fetch('/api/contatos/count?type=all'),
      $fetch('/api/templates'),
      $fetch('/api/attachments')
    ])

    if (contactsRes?.contatos) {
      contacts.value = contactsRes.contatos
    }

    if (countRes && typeof countRes.count === 'number') {
       realFilteredCount.value = countRes.count
       // Se recipientType for all, o watcher pode não disparar inicialmente se já for o padrão
       if (recipientType.value === 'all') {
         realFilteredCount.value = countRes.count
       }
    }

    if (templateRes?.data?.content) {
      messageText.value = templateRes.data.content
    }

    if (attachmentsRes?.success && Array.isArray(attachmentsRes.data)) {
      attachments.value = attachmentsRes.data.map(att => ({
        id: att.id,
        file: att.file_name ? { name: att.file_name, type: att.file_type, size: 0 } : null,
        previewUrl: att.file_url,
        caption: att.caption,
        url: att.file_url,
        type: att.file_type
      }))
    }

    if (Array.isArray(tagsRes)) {
      availableTags.value = tagsRes
    }

    if (inboxesRes?.success) {
      inboxes.value = inboxesRes.data
    } else if (Array.isArray(inboxesRes)) {
      inboxes.value = inboxesRes
    } else if (inboxesRes?.data) {
      inboxes.value = inboxesRes.data
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    toast.showToast('Erro ao carregar dados', 'error')
  } finally {
    loading.value = false
  }
}

// Funções auxiliares para tags
const getTagId = (tag) => {
  if (typeof tag === 'string') return tag
  // Tenta usar ID, nome ou name como identificador único
  // Se for objeto sem esses campos, usa JSON.stringify para garantir unicidade e evitar [object Object]
  return tag?.id || tag?.nome || tag?.name || JSON.stringify(tag)
}

const getTagName = (tag) => {
  if (typeof tag === 'string') return tag
  return tag?.nome || tag?.name || 'Tag'
}

const getTagColor = (tag) => {
  if (typeof tag === 'string') return '#6366f1' // indigo default
  return tag?.cor || tag?.color || '#6366f1'
}

const getContrastColor = (hexColor) => {
  // Remove o # se existir
  const hex = hexColor.replace('#', '')
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calcula luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Retorna cor escura ou clara baseado na luminância
  return luminance > 0.5 ? '#1f2937' : '#ffffff'
}

const getTagStyle = (tag) => {
  const bgColor = getTagColor(tag)
  const textColor = getContrastColor(bgColor)
  
  return {
    backgroundColor: bgColor,
    color: textColor
  }
}

const toggleTag = (tag) => {
  const tagId = getTagId(tag)
  const index = selectedTags.value.findIndex(t => getTagId(t) === tagId)
  
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const isTagSelected = (tag) => {
  const tagId = getTagId(tag)
  return selectedTags.value.some(t => getTagId(t) === tagId)
}

const validateForm = () => {
  errors.value = { message: '', inbox: '' }
  let isValid = true

  const hasAttachments = attachments.value.some(a => a.file)
  if (!messageText.value && !hasAttachments) {
    errors.value.message = 'Digite uma mensagem ou adicione um anexo'
    isValid = false
  }

  if (attachments.value.length > 3) {
    toast.showToast('Você pode enviar no máximo 3 anexos por campanha.', 'error')
    isValid = false
  }

  if (!selectedInboxId.value) {
    errors.value.inbox = 'Selecione uma caixa de entrada'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) return
  showConfirmModal.value = true
}

const confirmSubmit = async () => {
  submitting.value = true
  
  try {
    // Coletar URLs/IDs dos anexos já enviados
    const campaignAttachments = attachments.value.map(att => ({
      url: att.url,
      type: att.type,
      caption: att.caption
    })).filter(a => a.url)

    // Preparar dados da campanha
    const campaignData = {
      recipientType: recipientType.value,
      selectedTags: recipientType.value === 'tags' ? selectedTags.value.map(t => t.id || t) : [],
      messageText: messageText.value || (campaignAttachments[0]?.caption || ''),
      attachmentUrl: campaignAttachments[0]?.url || null,
      attachmentType: campaignAttachments[0]?.type || null,
      attachments: campaignAttachments,
      sendType: sendType.value,
      scheduledDateTime: sendType.value === 'scheduled' ? scheduledDateTime.value : null,
      inboxId: selectedInboxId.value
    }

    await $fetch('/api/campanhas', {
      method: 'POST',
      body: campaignData
    })
    
    toast.showToast(
      sendType.value === 'now' 
        ? 'Campanha iniciada com sucesso!' 
        : 'Campanha agendada com sucesso!',
      'success'
    )
    
    showConfirmModal.value = false
    resetForm()
    
  } catch (error) {
    console.error('Erro ao enviar campanha:', error)
    toast.showToast('Erro ao processar campanha', 'error')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  recipientType.value = 'all'
  selectedTags.value = []
  messageText.value = ''
  attachments.value = []
  sendType.value = 'now'
  scheduledDateTime.value = ''
  selectedInboxId.value = ''
  errors.value = { message: '', inbox: '' }
}

// Funções para gerenciar anexos
const openAttachmentModal = (type) => {
  attachmentModalType.value = type
  editingAttachmentIndex.value = null
  tempAttachmentFile.value = null
  tempAttachmentCaption.value = ''
  tempAttachmentPreview.value = ''
  showAttachmentModal.value = true
}

const closeAttachmentModal = () => {
  showAttachmentModal.value = false
  if (tempAttachmentPreview.value) {
    URL.revokeObjectURL(tempAttachmentPreview.value)
  }
  tempAttachmentFile.value = null
  tempAttachmentCaption.value = ''
  tempAttachmentPreview.value = ''
  editingAttachmentIndex.value = null
}

const editAttachment = (index) => {
  const att = attachments.value[index]
  editingAttachmentIndex.value = index
  tempAttachmentFile.value = att.file
  tempAttachmentCaption.value = att.caption || ''
  tempAttachmentPreview.value = att.previewUrl || ''
  
  // Determine type from file
  if (att.file?.type?.startsWith('image/')) attachmentModalType.value = 'image'
  else if (att.file?.type?.startsWith('video/')) attachmentModalType.value = 'video'
  else if (att.file?.type?.startsWith('audio/')) attachmentModalType.value = 'audio'
  else attachmentModalType.value = 'document'
  
  showAttachmentModal.value = true
}

const confirmAttachment = async () => {
  if (!tempAttachmentFile.value && editingAttachmentIndex.value === null) return

  if (!user.value) {
    toast.showToast('Erro: Usuário não autenticado. Tente recarregar a página.', 'error')
    return
  }

  uploadingAttachment.value = true
  try {
    let attachmentData = null

    // Caso 1: Editando anexo existente
    if (editingAttachmentIndex.value !== null) {
      const existingAttachment = attachments.value[editingAttachmentIndex.value]
      
      // Se o arquivo mudou (é um objeto File), faz upload do novo
      if (tempAttachmentFile.value instanceof File) {
        // Upload novo arquivo via API (Server-side para evitar RLS)
        const formData = new FormData()
        formData.append('file', tempAttachmentFile.value)

        const uploadResponse = await $fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.success) {
           throw new Error('Falha no upload do arquivo')
        }

        const publicUrl = uploadResponse.publicUrl
        const file = tempAttachmentFile.value

        // Salvar novo metadado
        const { data } = await $fetch('/api/attachments', {
          method: 'POST',
          body: {
            fileUrl: publicUrl,
            fileType: file.type,
            fileName: file.name,
            caption: tempAttachmentCaption.value
          }
        })
        attachmentData = data
      } else {
        // Arquivo não mudou, apenas atualizar legenda se necessário
        if (existingAttachment.id && existingAttachment.caption !== tempAttachmentCaption.value) {
          const { data } = await $fetch(`/api/attachments/${existingAttachment.id}`, {
            method: 'PUT',
            body: {
              caption: tempAttachmentCaption.value
            }
          })
          attachmentData = data
        } else {
          // Nada mudou ou não tem ID ainda (não deveria acontecer se salvo corretamente antes)
          attachmentData = {
            ...existingAttachment,
            caption: tempAttachmentCaption.value
          }
        }
      }

      // Atualizar lista
      if (attachmentData) {
        attachments.value[editingAttachmentIndex.value] = {
          id: attachmentData.id,
          file: attachmentData.file_name ? { name: attachmentData.file_name, type: attachmentData.file_type, size: 0 } : tempAttachmentFile.value, // Mock file obj for display if needed
          previewUrl: attachmentData.file_url || tempAttachmentPreview.value,
          caption: attachmentData.caption,
          url: attachmentData.file_url,
          type: attachmentData.file_type
        }
      }

    } else {
      // Caso 2: Adicionando novo anexo
      if (tempAttachmentFile.value instanceof File) {
        // Upload arquivo via API
        const formData = new FormData()
        formData.append('file', tempAttachmentFile.value)

        const uploadResponse = await $fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.success) {
           throw new Error('Falha no upload do arquivo')
        }

        const publicUrl = uploadResponse.publicUrl
        const file = tempAttachmentFile.value

        // Salvar metadados
        // Se já tiver ID (veio do banco mas estamos substituindo o arquivo), enviar ID para fazer update
        // Caso contrário, é um novo insert
        const existingId = editingAttachmentIndex.value !== null ? attachments.value[editingAttachmentIndex.value].id : null

        const { data } = await $fetch('/api/attachments', {
          method: 'POST',
          body: {
            id: existingId, // Passar ID se existir para fazer update
            fileUrl: publicUrl,
            fileType: file.type,
            fileName: file.name,
            caption: tempAttachmentCaption.value
          }
        })

        if (data) {
            // Se estava editando, atualiza
            if (editingAttachmentIndex.value !== null) {
                 attachments.value[editingAttachmentIndex.value] = {
                    id: data.id,
                    file: file,
                    previewUrl: publicUrl,
                    caption: data.caption,
                    url: data.file_url,
                    type: data.file_type
                 }
            } else {
                 // Novo
                 attachments.value.push({
                    id: data.id,
                    file: file,
                    previewUrl: publicUrl,
                    caption: data.caption,
                    url: data.file_url,
                    type: data.file_type
                 })
            }
        }
      }
    }

    showAttachmentModal.value = false
    closeAttachmentModal() // Reset variables
    
  } catch (error) {
    console.error('Erro ao salvar anexo:', error)
    toast.showToast('Erro ao salvar anexo', 'error')
  } finally {
    uploadingAttachment.value = false
  }
}

const removeAttachment = (index) => {
  const att = attachments.value[index]
  if (att.previewUrl) {
    URL.revokeObjectURL(att.previewUrl)
  }
  attachments.value.splice(index, 1)
}

const triggerModalFileInput = () => {
  modalFileInputRef.value?.click()
}

const handleModalFileSelect = (event) => {
  const files = event.target?.files
  if (files?.length) {
    processModalFile(files[0])
  }
  if (modalFileInputRef.value) {
    modalFileInputRef.value.value = ''
  }
}

const handleModalDrop = (event) => {
  modalDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) {
    processModalFile(files[0])
  }
}

const processModalFile = (file) => {
  // Validate size
  const maxSize = 16 * 1024 * 1024
  if (file.size > maxSize) {
    toast.showToast('O arquivo deve ter no máximo 16MB', 'error')
    return
  }

  // Create preview
  if (tempAttachmentPreview.value) {
    URL.revokeObjectURL(tempAttachmentPreview.value)
  }
  tempAttachmentPreview.value = URL.createObjectURL(file)
  tempAttachmentFile.value = file
}

const clearTempAttachment = () => {
  if (tempAttachmentPreview.value) {
    URL.revokeObjectURL(tempAttachmentPreview.value)
  }
  tempAttachmentFile.value = null
  tempAttachmentPreview.value = ''
}

const getAcceptedTypes = (type) => {
  switch (type) {
    case 'image': return 'image/*'
    case 'video': return 'video/*'
    case 'audio': return 'audio/*'
    case 'document': return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
    default: return '*/*'
  }
}

const getAttachmentTypeLabel = (type) => {
  switch (type) {
    case 'image': return 'Imagem'
    case 'video': return 'Vídeo'
    case 'audio': return 'Áudio'
    case 'document': return 'Documento'
    default: return 'Arquivo'
  }
}

const handleSaveTemplate = async () => {
  if (!messageText.value.trim()) return
  
  submitting.value = true
  try {
    await $fetch('/api/templates', {
      method: 'POST',
      body: {
        content: messageText.value
      }
    })
    
    toast.showToast('Mensagem salva com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error)
    toast.showToast('Erro ao salvar mensagem', 'error')
  } finally {
    submitting.value = false
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  loadData()
})

// Page meta
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Campanhas - Artemis',
  meta: [
    { name: 'description', content: 'Crie campanhas de disparo em massa no WhatsApp' }
  ]
})
</script>

