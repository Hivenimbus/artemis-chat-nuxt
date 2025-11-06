<template>
  <div class="media-message">
    <!-- Mensagem de Imagem -->
    <div v-if="isImage" class="image-message">
      <div class="relative group cursor-pointer" @click="openImageModal">
        <img
          :src="message.media_url"
          :alt="message.media_name || 'Imagem'"
          class="rounded-lg max-w-xs max-h-64 object-cover shadow-sm"
          :class="{
            'border border-indigo-200': message.sender === 'user',
            'border border-gray-200': message.sender === 'contact'
          }"
          @load="onImageLoad"
          @error="onImageError"
        />

        <!-- Overlay com ícone de expandir -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
            </svg>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="imageLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Error fallback -->
        <div v-if="imageError" class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div class="text-center p-4">
            <svg class="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-xs text-gray-500">Erro ao carregar imagem</p>
          </div>
        </div>
      </div>

      <!-- Nome do arquivo (opcional) -->
      <p v-if="showFileName && message.media_name" class="text-xs mt-1" :class="fileNameClass">
        {{ message.media_name }}
      </p>
    </div>

    <!-- Mensagem de Vídeo -->
    <div v-else-if="isVideo" class="video-message">
      <div class="relative group cursor-pointer" @click="openVideoModal">
        <video
          :src="message.media_url"
          class="rounded-lg max-w-xs max-h-64 object-cover shadow-sm"
          :class="{
            'border border-indigo-200': message.sender === 'user',
            'border border-gray-200': message.sender === 'contact'
          }"
          muted
        />

        <!-- Overlay com ícone de play -->
        <div class="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
          <div class="bg-white bg-opacity-90 rounded-full p-3">
            <svg class="h-6 w-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        <!-- Duração e tamanho -->
        <div class="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          {{ formatDuration(message.media_name) }}
        </div>
      </div>

      <p v-if="showFileName && message.media_name" class="text-xs mt-1" :class="fileNameClass">
        {{ message.media_name }}
      </p>
    </div>

    <!-- Mensagem de Áudio -->
    <div v-else-if="isAudio" class="audio-message">
      <div class="flex items-center space-x-3 p-3 rounded-lg" :class="audioContainerClass">
        <button class="flex-shrink-0" @click="toggleAudio">
          <div class="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition-colors">
            <svg v-if="audioPlaying" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
            <svg v-else class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </button>

        <div class="flex-1">
          <audio
            ref="audioElement"
            :src="message.media_url"
            class="hidden"
            @play="audioPlaying = true"
            @pause="audioPlaying = false"
            @ended="audioPlaying = false"
          />

          <!-- Progress bar simulada (decorativa) -->
          <div class="w-full bg-gray-200 rounded-full h-1">
            <div class="bg-indigo-600 h-1 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>

        <div class="text-xs" :class="fileNameClass">
          {{ formatAudioDuration(message.media_name) }}
        </div>
      </div>

      <p v-if="showFileName && message.media_name" class="text-xs mt-1" :class="fileNameClass">
        {{ message.media_name }}
      </p>
    </div>

    <!-- Mensagem de Documento -->
    <div v-else-if="isDocument" class="document-message">
      <div class="flex items-center space-x-3 p-3 rounded-lg" :class="documentContainerClass">
        <div class="flex-shrink-0">
          <div class="bg-gray-100 text-gray-600 rounded-lg p-2">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate" :class="fileNameClass">
            {{ message.media_name || 'Documento' }}
          </p>
          <p class="text-xs" :class="metaInfoClass">
            {{ getDocumentType(message.media_type) }}
          </p>
        </div>

        <button @click="downloadDocument" class="flex-shrink-0 text-indigo-600 hover:text-indigo-700">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Fallback para texto (mensagem sem mídia) -->
    <div v-else class="text-message">
      <p class="text-sm">{{ message.text || message.texto }}</p>
    </div>

    <!-- Modal de Imagem -->
    <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="closeImageModal">
      <div class="relative max-w-4xl max-h-screen p-4" @click.stop>
        <button
          @click="closeImageModal"
          class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <img
          :src="message.media_url"
          :alt="message.media_name || 'Imagem'"
          class="max-w-full max-h-full rounded-lg shadow-2xl"
        />

        <div class="absolute bottom-6 left-6 text-white bg-black bg-opacity-50 px-3 py-2 rounded-lg">
          <p class="text-sm">{{ message.media_name || 'Imagem' }}</p>
        </div>
      </div>
    </div>

    <!-- Modal de Vídeo -->
    <div v-if="showVideoModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="closeVideoModal">
      <div class="relative max-w-4xl max-h-screen p-4" @click.stop>
        <button
          @click="closeVideoModal"
          class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <video
          :src="message.media_url"
          controls
          class="max-w-full max-h-full rounded-lg shadow-2xl"
        />

        <div class="absolute bottom-6 left-6 text-white bg-black bg-opacity-50 px-3 py-2 rounded-lg">
          <p class="text-sm">{{ message.media_name || 'Vídeo' }}</p>
        </div>
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

// Estados
const imageLoading = ref(true)
const imageError = ref(false)
const audioPlaying = ref(false)
const showImageModal = ref(false)
const showVideoModal = ref(false)

const audioElement = ref(null)

// Computeds para determinar tipo de mídia
const isImage = computed(() => {
  return props.message.media_type?.startsWith('image/') ||
         props.message.message_type === 'image' ||
         (props.message.media_url && props.message.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i))
})

const isVideo = computed(() => {
  return props.message.media_type?.startsWith('video/') ||
         props.message.message_type === 'video' ||
         (props.message.media_url && props.message.media_url.match(/\.(mp4|avi|mov|webm)$/i))
})

const isAudio = computed(() => {
  return props.message.media_type?.startsWith('audio/') ||
         props.message.message_type === 'audio' ||
         (props.message.media_url && props.message.media_url.match(/\.(mp3|ogg|wav|m4a)$/i))
})

const isDocument = computed(() => {
  return props.message.media_type?.startsWith('application/') ||
         props.message.media_type?.startsWith('text/') ||
         props.message.message_type === 'document' ||
         (props.message.media_url && props.message.media_url.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/i))
})

// Classes dinâmicas baseadas no remetente
const fileNameClass = computed(() => {
  return props.message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'
})

const metaInfoClass = computed(() => {
  return props.message.sender === 'user' ? 'text-indigo-300' : 'text-gray-400'
})

const audioContainerClass = computed(() => {
  return props.message.sender === 'user'
    ? 'bg-indigo-500 bg-opacity-20 border border-indigo-400'
    : 'bg-gray-100 border border-gray-200'
})

const documentContainerClass = computed(() => {
  return props.message.sender === 'user'
    ? 'bg-indigo-500 bg-opacity-20 border border-indigo-400'
    : 'bg-gray-100 border border-gray-200'
})

// Métodos
const onImageLoad = () => {
  imageLoading.value = false
  imageError.value = false
}

const onImageError = () => {
  imageLoading.value = false
  imageError.value = true
  emit('error', 'Erro ao carregar imagem')
}

const openImageModal = () => {
  if (!imageError.value && props.message.media_url) {
    showImageModal.value = true
  }
}

const closeImageModal = () => {
  showImageModal.value = false
}

const openVideoModal = () => {
  showVideoModal.value = true
}

const closeVideoModal = () => {
  showVideoModal.value = false
  // Pausar vídeo ao fechar modal
  const video = document.querySelector('video[src="' + props.message.media_url + '"]')
  if (video) {
    video.pause()
  }
}

const toggleAudio = () => {
  if (audioElement.value) {
    if (audioPlaying.value) {
      audioElement.value.pause()
    } else {
      audioElement.value.play()
    }
  }
}

const downloadDocument = () => {
  if (props.message.media_url) {
    const link = document.createElement('a')
    link.href = props.message.media_url
    link.download = props.message.media_name || 'documento'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Utilitários
const formatDuration = (filename) => {
  // Tentar extrair duração do nome do arquivo ou usar fallback
  return '0:30'
}

const formatAudioDuration = (filename) => {
  // Tentar extrair duração do nome do arquivo ou usar fallback
  return '0:15'
}

const getDocumentType = (mimeType) => {
  if (!mimeType) return 'Documento'

  const types = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'text/plain': 'Texto',
    'text/csv': 'CSV'
  }

  return types[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Documento'
}

// Cleanup
onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
  }
})
</script>

<style scoped>
.media-message {
  @apply w-full;
}

.image-message img,
.video-message video {
  @apply transition-transform duration-200;
}

.image-message img:hover,
.video-message video:hover {
  @apply scale-105;
}

/* Animações para modais */
.fixed {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>