<template>
  <div class="campaign-attachment-uploader">
    <!-- Área de Upload -->
    <div
      v-if="!attachment"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      class="relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200"
      :class="[
        isDragging
          ? 'border-indigo-500 bg-red-50'
          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
      ]"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptedTypes"
        class="hidden"
        @change="handleFileSelect"
      />
      
      <div class="flex flex-col items-center">
        <div class="w-16 h-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        <p class="text-sm font-medium text-gray-900 mb-1">
          Arraste um arquivo aqui ou clique para selecionar
        </p>
        <p class="text-xs text-gray-500">
          Imagem, vídeo, áudio ou documento (máx. {{ maxFileSizeMB }}MB)
        </p>
        
        <!-- Tipos aceitos -->
        <div class="flex flex-wrap justify-center gap-2 mt-4">
          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Imagem
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Vídeo
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Áudio
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documento
          </span>
        </div>
      </div>
    </div>

    <!-- Preview do Anexo -->
    <div v-else class="border border-gray-200 rounded-lg overflow-hidden">
      <!-- Header com info do arquivo -->
      <div class="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <!-- Ícone baseado no tipo -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :class="getFileTypeColor(attachment.type)"
          >
            <component :is="getFileTypeIcon(attachment.type)" class="w-5 h-5" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {{ attachment.name }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatFileSize(attachment.size) }} • {{ getFileTypeLabel(attachment.type) }}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          @click="removeAttachment"
          class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <!-- Preview do conteúdo -->
      <div class="p-4">
        <!-- Imagem -->
        <div v-if="isImage" class="flex justify-center">
          <img
            :src="previewUrl"
            :alt="attachment.name"
            class="max-h-48 rounded-lg object-contain"
          />
        </div>

        <!-- Vídeo -->
        <div v-else-if="isVideo" class="flex justify-center">
          <video
            :src="previewUrl"
            controls
            class="max-h-48 rounded-lg"
          ></video>
        </div>

        <!-- Áudio -->
        <div v-else-if="isAudio" class="flex justify-center">
          <audio :src="previewUrl" controls class="w-full max-w-md"></audio>
        </div>

        <!-- Documento -->
        <div v-else class="flex items-center justify-center py-4">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">Documento anexado</p>
          </div>
        </div>

        <!-- Campo de Legenda -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Legenda do anexo (opcional)
          </label>
          <CampaignMessageEditor
            v-model="captionValue"
            placeholder="Digite uma legenda para o anexo..."
            :rows="3"
            :show-preview="false"
          />
        </div>
      </div>
    </div>

    <!-- Mensagem de erro -->
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import CampaignMessageEditor from './CampaignMessageEditor.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  caption: {
    type: String,
    default: ''
  },
  maxFileSizeMB: {
    type: Number,
    default: 16
  }
})

const emit = defineEmits(['update:modelValue', 'update:caption'])

// Refs
const fileInputRef = ref(null)

// State
const isDragging = ref(false)
const error = ref('')
const previewUrl = ref('')

// Tipos aceitos
const acceptedTypes = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'

// Computed
const attachment = computed(() => props.modelValue)

const captionValue = computed({
  get: () => props.caption,
  set: (value) => emit('update:caption', value)
})

const isImage = computed(() => {
  return attachment.value?.type?.startsWith('image/')
})

const isVideo = computed(() => {
  return attachment.value?.type?.startsWith('video/')
})

const isAudio = computed(() => {
  return attachment.value?.type?.startsWith('audio/')
})

// Methods
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleDragOver = (event) => {
  isDragging.value = true
}

const handleDragLeave = (event) => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) {
    processFile(files[0])
  }
}

const handleFileSelect = (event) => {
  const files = event.target?.files
  if (files?.length) {
    processFile(files[0])
  }
  // Reset input para permitir selecionar o mesmo arquivo novamente
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const processFile = (file) => {
  error.value = ''
  
  // Validar tamanho
  const maxSize = props.maxFileSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    error.value = `O arquivo deve ter no máximo ${props.maxFileSizeMB}MB`
    return
  }
  
  // Validar tipo
  const validTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
  
  if (!validTypes.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
    error.value = 'Tipo de arquivo não suportado'
    return
  }
  
  // Criar preview URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  
  // Emitir arquivo
  emit('update:modelValue', {
    file,
    name: file.name,
    size: file.size,
    type: file.type
  })
}

const removeAttachment = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  emit('update:modelValue', null)
  emit('update:caption', '')
  error.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileTypeColor = (type) => {
  if (type?.startsWith('image/')) return 'bg-blue-100 text-blue-600'
  if (type?.startsWith('video/')) return 'bg-purple-100 text-purple-600'
  if (type?.startsWith('audio/')) return 'bg-green-100 text-green-600'
  return 'bg-orange-100 text-orange-600'
}

const getFileTypeLabel = (type) => {
  if (type?.startsWith('image/')) return 'Imagem'
  if (type?.startsWith('video/')) return 'Vídeo'
  if (type?.startsWith('audio/')) return 'Áudio'
  return 'Documento'
}

const getFileTypeIcon = (type) => {
  if (type?.startsWith('image/')) {
    return {
      template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`
    }
  }
  if (type?.startsWith('video/')) {
    return {
      template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`
    }
  }
  if (type?.startsWith('audio/')) {
    return {
      template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>`
    }
  }
  return {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`
  }
}

// Cleanup
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

