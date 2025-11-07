<template>
  <div class="media-preview">
    <!-- Mensagem de Imagem -->
    <div v-if="isImage" class="image-message">
      <div class="relative group cursor-pointer" @click="openImageModal">
        <img
          :src="message.media_url"
          :alt="message.media_name || 'Imagem'"
          class="rounded-lg max-w-xs max-h-64 object-cover shadow-sm transition-all duration-200"
          :class="{
            'border border-indigo-200': message.sender === 'user',
            'border border-gray-200': message.sender === 'contact'
          }"
          @load="onImageLoad"
          @error="onImageError"
          loading="lazy"
        />

        <!-- Overlay com ícone de expandir -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Nome do arquivo -->
      <div v-if="showFileName && message.media_name" class="mt-2">
        <p class="text-xs text-gray-500 truncate">{{ message.media_name }}</p>
      </div>
    </div>

    <!-- Mensagem de Vídeo -->
    <div v-else-if="isVideo" class="video-message">
      <div class="rounded-lg overflow-hidden shadow-sm max-w-xs">
        <video
          :src="message.media_url"
          :poster="message.media_url"
          controls
          class="w-full max-h-64"
          preload="metadata"
          @error="onVideoError"
          @loadstart="onVideoLoadStart"
          @canplay="onVideoCanPlay"
        >
          <source :src="message.media_url" :type="message.media_type">
          Seu navegador não suporta reprodução de vídeo.
        </video>
      </div>

      <!-- Nome do arquivo e download -->
      <div v-if="showFileName && message.media_name" class="mt-2 flex items-center justify-between">
        <p class="text-xs text-gray-500 truncate flex-1">{{ message.media_name }}</p>
        <button
          @click="downloadMedia"
          class="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
          title="Baixar vídeo"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mensagem de Áudio -->
    <div v-else-if="isAudio" class="audio-message">
      <div class="bg-gray-50 rounded-lg p-3 shadow-sm max-w-xs">
        <div class="flex items-center space-x-3">
          <!-- Ícone de áudio -->
          <div class="flex-shrink-0">
            <div class="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
              </svg>
            </div>
          </div>

          <!-- Player de áudio -->
          <div class="flex-1">
            <audio
              :src="message.media_url"
              controls
              class="w-full h-8"
              preload="metadata"
              @error="onAudioError"
              @loadstart="onAudioLoadStart"
              @canplay="onAudioCanPlay"
            >
              <source :src="message.media_url" :type="message.media_type">
              Seu navegador não suporta reprodução de áudio.
            </audio>
          </div>
        </div>

        <!-- Nome do arquivo e download -->
        <div v-if="showFileName && message.media_name" class="mt-2 flex items-center justify-between">
          <p class="text-xs text-gray-500 truncate flex-1">{{ message.media_name }}</p>
          <button
            @click="downloadMedia"
            class="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
            title="Baixar áudio"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mensagem de Documento -->
    <div v-else-if="isDocument" class="document-message">
      <div class="bg-gray-50 rounded-lg p-4 shadow-sm max-w-xs">
        <div class="flex items-start space-x-3">
          <!-- Ícone de documento -->
          <div class="flex-shrink-0">
            <div class="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>

          <!-- Informações do documento -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ message.media_name || 'Documento' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ getDocumentType(message.media_type) }}
            </p>
          </div>
        </div>

        <!-- Ações -->
        <div class="mt-3 flex space-x-2">
          <button
            @click="openDocument"
            class="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            <span>Abrir</span>
          </button>
          <button
            @click="downloadMedia"
            class="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors duration-200"
            title="Baixar documento"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Fallback para mídia não reconhecida -->
    <div v-else-if="message.media_url" class="unknown-media">
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-xs">
        <div class="flex items-center space-x-3">
          <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div class="flex-1">
            <p class="text-sm text-yellow-800">Mídia não suportada</p>
            <p v-if="message.media_name" class="text-xs text-yellow-600 truncate">{{ message.media_name }}</p>
          </div>
          <button
            @click="downloadMedia"
            class="text-yellow-600 hover:text-yellow-800 transition-colors"
            title="Baixar arquivo"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Imagem em Tela Cheia -->
    <teleport to="body">
      <div
        v-if="showImageModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
        @click.self="closeImageModal"
        @keydown.esc="closeImageModal"
      >
        <!-- Botão fechar -->
        <button
          @click="closeImageModal"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          title="Fechar (ESC)"
        >
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Conteúdo da imagem -->
        <div class="relative max-w-full max-h-full">
          <img
            :src="message.media_url"
            :alt="message.media_name || 'Imagem'"
            class="max-w-full max-h-full object-contain rounded-lg"
            @load="onModalImageLoad"
            @error="onModalImageError"
          />

          <!-- Informações da imagem -->
          <div v-if="message.media_name" class="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
            <p class="text-sm truncate">{{ message.media_name }}</p>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Estados de carregamento e erro -->
    <div v-if="isLoading" class="loading-media">
      <div class="flex items-center space-x-2 text-gray-500">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
        <span class="text-xs">Carregando...</span>
      </div>
    </div>

    <div v-if="hasError" class="error-media">
      <div class="flex items-center space-x-2 text-red-500">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-xs">Erro ao carregar mídia</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  showFileName: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['error'])

// Estados do componente
const showImageModal = ref(false)
const isLoading = ref(false)
const hasError = ref(false)

// Computados para detectar tipo de mídia
const isImage = computed(() => {
  return props.message.media_type?.startsWith('image/') ||
         props.message.message_type === 'image' ||
         (props.message.media_url && props.message.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i))
})

const isVideo = computed(() => {
  return props.message.media_type?.startsWith('video/') ||
         props.message.message_type === 'video' ||
         (props.message.media_url && props.message.media_url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i))
})

const isAudio = computed(() => {
  return props.message.media_type?.startsWith('audio/') ||
         props.message.message_type === 'audio' ||
         (props.message.media_url && props.message.media_url.match(/\.(mp3|wav|ogg|aac|m4a|amr)$/i))
})

const isDocument = computed(() => {
  return props.message.media_type?.startsWith('application/') ||
         props.message.message_type === 'document' ||
         (props.message.media_url && props.message.media_url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i))
})

// Funções para imagens
const openImageModal = () => {
  if (isImage.value && props.message.media_url) {
    showImageModal.value = true
    document.body.style.overflow = 'hidden'
  }
}

const closeImageModal = () => {
  showImageModal.value = false
  document.body.style.overflow = ''
}

const onImageLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const onImageError = () => {
  isLoading.value = false
  hasError.value = true
  emit('error', { type: 'image', message: 'Erro ao carregar imagem' })
}

const onModalImageLoad = () => {
  console.log('Imagem do modal carregada com sucesso')
}

const onModalImageError = () => {
  console.error('Erro ao carregar imagem no modal')
  closeImageModal()
}

// Funções para vídeo
const onVideoLoadStart = () => {
  isLoading.value = true
}

const onVideoCanPlay = () => {
  isLoading.value = false
  hasError.value = false
}

const onVideoError = () => {
  isLoading.value = false
  hasError.value = true
  emit('error', { type: 'video', message: 'Erro ao carregar vídeo' })
}

// Funções para áudio
const onAudioLoadStart = () => {
  isLoading.value = true
}

const onAudioCanPlay = () => {
  isLoading.value = false
  hasError.value = false
}

const onAudioError = () => {
  isLoading.value = false
  hasError.value = true
  emit('error', { type: 'audio', message: 'Erro ao carregar áudio' })
}

// Funções utilitárias
const getDocumentType = (mimeType) => {
  const types = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'text/plain': 'Texto',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR'
  }

  return types[mimeType] || 'Documento'
}

const openDocument = () => {
  if (props.message.media_url) {
    window.open(props.message.media_url, '_blank', 'noopener,noreferrer')
  }
}

const downloadMedia = () => {
  if (props.message.media_url) {
    const link = document.createElement('a')
    link.href = props.message.media_url
    link.download = props.message.media_name || 'arquivo'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Limpar modal ao desmontar
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.media-preview {
  @apply w-full;
}

.image-message img {
  @apply cursor-pointer transition-transform duration-200 hover:scale-[1.02];
}

.video-message video {
  @apply rounded-lg;
}

.audio-message audio {
  @apply outline-none;
}

.document-message {
  @apply transition-transform duration-200 hover:scale-[1.01];
}

.loading-media {
  @apply flex items-center justify-center p-4;
}

.error-media {
  @apply flex items-center justify-center p-4;
}

/* Animações suaves */
.media-preview * {
  @apply transition-all duration-200;
}

/* Scrollbar personalizada para o modal */
.fixed img {
  max-height: calc(100vh - 2rem);
}

/* Responsividade */
@media (max-width: 640px) {
  .media-preview {
    @apply max-w-full;
  }

  .image-message img,
  .video-message video,
  .audio-message,
  .document-message {
    @apply max-w-full;
  }
}
</style>