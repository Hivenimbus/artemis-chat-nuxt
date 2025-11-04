<template>
  <div
    :class="[
      'flex mb-4 animate-fade-in',
      isUser ? 'justify-end' : 'justify-start'
    ]"
  >
    <div
      :class="[
        'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl',
        'rounded-2xl px-4 py-3 shadow-sm',
        'relative group',
        isUser
          ? 'bg-blue-600 text-white rounded-br-md'
          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
      ]"
    >
      <!-- Conteúdo da mensagem -->
      <div class="space-y-2">
        <!-- Texto da mensagem -->
        <div v-if="message.text && message.message_type !== 'media_only'" class="break-words">
          <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ message.text }}</p>
        </div>

        <!-- Imagem -->
        <div v-if="message.message_type === 'image' && message.media_url" class="space-y-2">
          <div class="relative">
            <img
              :src="message.media_url"
              :alt="message.media_name || 'Imagem'"
              class="rounded-lg max-w-full h-auto cursor-pointer transition-transform hover:scale-105"
              @click="openImageModal"
              @load="imageLoaded = true"
              @error="imageError = true"
            />
            <!-- Loading skeleton -->
            <div
              v-if="!imageLoaded && !imageError"
              class="absolute inset-0 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center"
            >
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <!-- Error fallback -->
            <div
              v-if="imageError"
              class="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <div class="text-center p-4">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-gray-500">Não foi possível carregar a imagem</p>
              </div>
            </div>
          </div>
          <!-- Caption da imagem (se houver) -->
          <p v-if="message.text && message.text.trim()" class="text-sm opacity-90">
            {{ message.text }}
          </p>
        </div>

        <!-- Vídeo -->
        <div v-if="message.message_type === 'video' && message.media_url" class="space-y-2">
          <div class="relative rounded-lg overflow-hidden bg-black">
            <video
              :src="message.media_url"
              controls
              class="w-full max-h-64"
              preload="metadata"
            >
              Seu navegador não suporta reprodução de vídeo.
            </video>
          </div>
          <!-- Caption do vídeo (se houver) -->
          <p v-if="message.text && message.text.trim()" class="text-sm opacity-90">
            {{ message.text }}
          </p>
        </div>

        <!-- Áudio -->
        <div v-if="message.message_type === 'audio' && message.media_url" class="space-y-2">
          <div
            :class="[
              'flex items-center space-x-3 p-3 rounded-lg',
              isUser ? 'bg-blue-700 bg-opacity-50' : 'bg-gray-100'
            ]"
          >
            <!-- Ícone de áudio -->
            <div class="flex-shrink-0">
              <svg class="w-6 h-6" :class="isUser ? 'text-blue-200' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <!-- Player de áudio -->
            <div class="flex-1">
              <audio
                :src="message.media_url"
                controls
                class="w-full h-8"
                preload="metadata"
              >
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          </div>
          <!-- Texto do áudio (se houver) -->
          <p v-if="message.text && message.text.trim() && message.text !== '🎵 Mensagem de áudio'" class="text-sm opacity-90">
            {{ message.text }}
          </p>
        </div>

        <!-- Documento -->
        <div v-if="message.message_type === 'document' && message.media_url" class="space-y-2">
          <a
            :href="message.media_url"
            target="_blank"
            :class="[
              'flex items-center space-x-3 p-3 rounded-lg',
              'transition-colors hover:opacity-80',
              isUser
                ? 'bg-blue-700 bg-opacity-50 hover:bg-opacity-70'
                : 'bg-gray-100 hover:bg-gray-200'
            ]"
          >
            <!-- Ícone do documento -->
            <div class="flex-shrink-0">
              <svg class="w-6 h-6" :class="isUser ? 'text-blue-200' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <!-- Informações do documento -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">
                {{ message.media_name || 'Documento' }}
              </p>
              <p class="text-xs opacity-75">
                Clique para abrir
              </p>
            </div>
            <!-- Ícone de download -->
            <div class="flex-shrink-0">
              <svg class="w-5 h-5" :class="isUser ? 'text-blue-200' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </a>
          <!-- Caption do documento (se houver) -->
          <p v-if="message.text && message.text.trim() && !message.text.includes('📄')" class="text-sm opacity-90">
            {{ message.text }}
          </p>
        </div>
      </div>

      <!-- Status e informações da mensagem -->
      <div
        :class="[
          'flex items-center justify-between mt-2 text-xs',
          isUser ? 'text-blue-100' : 'text-gray-500'
        ]"
      >
        <!-- Timestamp -->
        <span>{{ formatTimestamp(message.timestamp) }}</span>

        <!-- Status de entrega/leitura (apenas para mensagens do usuário) -->
        <div v-if="isUser" class="flex items-center space-x-1">
          <!-- Status de envio -->
          <svg
            v-if="message.evolution_status === 'pending'"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>

          <!-- Check único (enviado) -->
          <svg
            v-else-if="message.evolution_status === 'sent'"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>

          <!-- Check duplo (entregue) -->
          <div v-else-if="message.evolution_status === 'delivered'" class="flex items-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg class="w-4 h-4 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Check duplo azul (lido) -->
          <div v-else-if="message.evolution_status === 'read'" class="flex items-center">
            <svg class="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg class="w-4 h-4 -ml-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Erro -->
          <svg
            v-else-if="message.evolution_status === 'failed'"
            class="w-4 h-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <!-- Nome do usuário em mensagens de grupo -->
        <span v-if="!isUser && message.usuario_name" class="ml-2">
          {{ message.usuario_name }}
        </span>
      </div>
    </div>
  </div>

  <!-- Modal de visualização de imagem -->
  <div
    v-if="showImageModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
    @click.self="closeImageModal"
  >
    <div class="relative max-w-4xl max-h-full">
      <button
        @click="closeImageModal"
        class="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        :src="message.media_url"
        :alt="message.media_name || 'Imagem'"
        class="max-w-full max-h-full rounded-lg shadow-xl"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const imageLoaded = ref(false)
const imageError = ref(false)
const showImageModal = ref(false)

const isUser = computed(() => {
  return props.message.remetente === 'user' || props.message.sender === 'user'
})

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return 'Agora'
  } else if (diffMins < 60) {
    return `Há ${diffMins} min`
  } else if (diffHours < 24) {
    return `Há ${diffHours} h`
  } else if (diffDays < 7) {
    return `Há ${diffDays} d`
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

const openImageModal = () => {
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
}

// Fechar modal com ESC
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeImageModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
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

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Custom styles for audio player */
audio::-webkit-media-controls-panel {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Custom scrollbar for image modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>