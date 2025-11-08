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
    <div v-else-if="isAudio" class="audio-player-container">
      <audio
        ref="audioElement"
        :src="message.media_url"
        preload="metadata"
        @error="onAudioError"
        @loadstart="onAudioLoadStart"
        @canplay="onAudioCanPlay"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        class="hidden"
      >
        <source :src="message.media_url" :type="message.media_type">
        Seu navegador não suporta reprodução de áudio.
      </audio>

      <!-- Controles customizados -->
      <div class="audio-controls">
        <!-- Botão Play/Pause -->
        <button
          @click="togglePlayPause"
          :disabled="!canPlay"
          class="audio-play-button"
        >
          <svg v-if="!isPlaying" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>

        <!-- Barra de progresso -->
        <div
          @click="seekAudio"
          class="audio-progress-bar"
          @mouseenter="$event.target.classList.add('hover')"
          @mouseleave="$event.target.classList.remove('hover')"
        >
          <div
            class="audio-progress-fill"
            :style="{ width: Math.max(progressPercentage, 1) + '%' }"
          >
            <div class="audio-progress-thumb"></div>
          </div>
        </div>

        <!-- Tempo exibido -->
        <div class="audio-time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
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

// Estados do player de áudio
const audioElement = ref(null)
const isPlaying = ref(false)
const canPlay = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// Throttling para animações suaves
let lastTimeUpdate = 0
const THROTTLE_DELAY = 100 // 100ms para atualizações de tempo

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

// Computed para progresso do áudio
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
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
  canPlay.value = true
}

const onAudioError = () => {
  isLoading.value = false
  hasError.value = true
  canPlay.value = false
  emit('error', { type: 'audio', message: 'Erro ao carregar áudio' })
}

// Funções para controles customizados do áudio
const togglePlayPause = () => {
  if (!audioElement.value || !canPlay.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
  } else {
    audioElement.value.play()
    isPlaying.value = true
  }
}

const seekAudio = (event) => {
  if (!audioElement.value || !canPlay.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const width = rect.width
  const percentage = clickX / width
  const seekTime = percentage * duration.value

  audioElement.value.currentTime = seekTime
  currentTime.value = seekTime
}

const onTimeUpdate = () => {
  if (!audioElement.value) return

  const now = Date.now()
  if (now - lastTimeUpdate >= THROTTLE_DELAY) {
    currentTime.value = audioElement.value.currentTime
    lastTimeUpdate = now
  }
}

const onLoadedMetadata = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
  }
}


const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

// Limpar modal e áudio ao desmontar
onUnmounted(() => {
  document.body.style.overflow = ''

  // Parar áudio e limpar referências
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.removeEventListener('timeupdate', onTimeUpdate)
    audioElement.value.removeEventListener('loadedmetadata', onLoadedMetadata)
    audioElement.value.removeEventListener('play', () => { isPlaying.value = true })
    audioElement.value.removeEventListener('pause', () => { isPlaying.value = false })
  }

  // Resetar estados
  isPlaying.value = false
  canPlay.value = false
  currentTime.value = 0
  duration.value = 0
})

// Adicionar event listeners quando o áudio estiver pronto
watch(() => audioElement.value, (newAudioElement) => {
  if (newAudioElement) {
    newAudioElement.addEventListener('play', () => { isPlaying.value = true })
    newAudioElement.addEventListener('pause', () => { isPlaying.value = false })
    newAudioElement.addEventListener('ended', () => { isPlaying.value = false })
  }
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

/* Estilos melhorados para o player de áudio */
.audio-player-container {
  @apply bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-5 shadow-md border border-gray-100 max-w-lg hover:shadow-lg transition-all duration-300 overflow-hidden;
}

.audio-controls {
  @apply flex items-center gap-3 min-w-0;
}

.audio-play-button {
  @apply flex-shrink-0 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed;
}

.audio-progress-bar {
  @apply flex-1 cursor-pointer relative;
  height: 12px;
  min-height: 12px;
  background-color: #d1d5db;
  border-radius: 9999px;
  width: 100%;
  min-width: 200px;
  position: relative;
  z-index: 10;
  display: block;
  visibility: visible;
  opacity: 1;
  flex: 1;
  transition: background-color 0.2s ease;
}

.audio-progress-bar.hover {
  background-color: #9ca3af;
}

.audio-progress-fill {
  height: 100%;
  min-height: 12px;
  background: linear-gradient(to right, rgb(99 102 241), rgb(168 85 247));
  border-radius: 9999px;
  position: relative;
  width: 1%;
  min-width: 2px;
  transition: width 0.3s ease-out;
  z-index: 11;
}

.audio-progress-thumb {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(50%, -50%);
  height: 16px;
  width: 16px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
  border: 2px solid rgb(99 102 241);
  transition: transform 0.2s ease;
}

.audio-progress-thumb:hover {
  transform: translate(50%, -50%) scale(1.1);
}

.audio-time-display {
  @apply text-xs text-gray-600 font-mono min-w-[50px] text-right whitespace-nowrap;
}

/* Estilos legados para compatibilidade */
.custom-audio-player {
  @apply bg-white rounded-lg p-4 border border-gray-100 shadow-sm;
}

.custom-audio-player:hover {
  @apply shadow-md border-gray-200;
}


/* Efeito de hover na barra de progresso */
.custom-audio-player .progress-bar:hover {
  @apply bg-gray-300;
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

  /* Ajustes específicos para o player de áudio em mobile */
  .audio-player-container {
    @apply max-w-full p-3;
  }

  .audio-controls {
    @apply gap-2;
  }

  .audio-play-button {
    @apply h-8 w-8;
  }

  .audio-progress-bar {
    height: 8px;
    min-height: 8px;
    min-width: 50px;
  }

  .audio-progress-fill {
    min-height: 8px;
  }

  .audio-progress-thumb {
    height: 12px;
    width: 12px;
    border: 1px solid rgb(99 102 241);
  }

  .audio-time-display {
    @apply text-xs;
  }

  }

@media (max-width: 480px) {
  /* Ajustes ainda menores para telas muito pequenas */
  .audio-player-container {
    @apply p-2;
  }

  .audio-controls {
    @apply flex-wrap gap-2;
  }
}
</style>