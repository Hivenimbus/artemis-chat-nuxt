<template>
  <div class="campaign-message-editor">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-t-lg">
      <!-- Botão Spintax -->
      <div class="relative">
        <button
          type="button"
          @click="toggleSpintaxMenu"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Spintax
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <!-- Menu Spintax -->
        <div
          v-if="showSpintaxMenu"
          class="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
        >
          <div class="p-3">
            <p class="text-xs text-gray-500 mb-2">Insira variações separadas por |</p>
            <input
              v-model="spintaxInput"
              type="text"
              placeholder="opção1|opção2|opção3"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              @keyup.enter="insertSpintax"
            />
            <div class="flex gap-2 mt-2">
              <button
                type="button"
                @click="insertSpintax"
                class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Inserir
              </button>
              <button
                type="button"
                @click="showSpintaxMenu = false"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Botão Variáveis -->
      <div class="relative">
        <button
          type="button"
          @click="toggleVariablesMenu"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Variáveis
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <!-- Menu Variáveis -->
        <div
          v-if="showVariablesMenu"
          class="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
        >
          <div class="py-1">
            <button
              v-for="variable in availableVariables"
              :key="variable.value"
              type="button"
              @click="insertVariable(variable.value)"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <span class="font-medium">{{ variable.label }}</span>
              <span class="text-gray-400 ml-2">{{ variable.value }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Botão Nome do Cliente (atalho) -->
      <button
        type="button"
        @click="insertVariable('{{nome}}')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Nome do Cliente
      </button>

      <!-- Dica -->
      <div class="ml-auto text-xs text-gray-400 hidden sm:block">
        Dica: Use {opção1|opção2} para variações
      </div>
    </div>

    <!-- Área de Texto -->
    <div class="relative">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="handleInput"
        @focus="handleFocus"
        :placeholder="placeholder"
        :rows="rows"
        class="w-full px-4 py-3 text-gray-900 border border-t-0 border-gray-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': error }"
      ></textarea>
      
      <!-- Contador de caracteres -->
      <div class="absolute bottom-2 right-2 text-xs text-gray-400">
        {{ characterCount }} caracteres
      </div>
    </div>

    <!-- Mensagem de erro -->
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>

    <!-- Preview da mensagem -->
    <div v-if="showPreview && modelValue" class="mt-3">
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span class="text-sm font-medium text-gray-500">Preview (exemplo)</span>
      </div>
      <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ previewMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Digite sua mensagem aqui...'
  },
  rows: {
    type: Number,
    default: 6
  },
  error: {
    type: String,
    default: ''
  },
  showPreview: {
    type: Boolean,
    default: true
  },
  sampleContact: {
    type: Object,
    default: () => ({
      nome: 'João Silva',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999998888',
      cidade: 'São Paulo',
      empresa: 'Empresa ABC'
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Refs
const textareaRef = ref(null)
const cursorPosition = ref(0)

// State
const showSpintaxMenu = ref(false)
const showVariablesMenu = ref(false)
const spintaxInput = ref('')

// Variáveis disponíveis
const availableVariables = [
  { label: 'Nome', value: '{{nome}}' },
  { label: 'Sobrenome', value: '{{sobrenome}}' },
  { label: 'Email', value: '{{email}}' },
  { label: 'Telefone', value: '{{telefone}}' },
  { label: 'Cidade', value: '{{cidade}}' },
  { label: 'Empresa', value: '{{empresa}}' }
]

// Computed
const characterCount = computed(() => {
  return props.modelValue?.length || 0
})

const previewMessage = computed(() => {
  if (!props.modelValue) return ''
  
  let message = props.modelValue
  
  // Substituir variáveis pelo contato de exemplo
  message = message.replace(/\{\{nome\}\}/g, props.sampleContact.nome || 'Cliente')
  message = message.replace(/\{\{sobrenome\}\}/g, props.sampleContact.sobrenome || '')
  message = message.replace(/\{\{email\}\}/g, props.sampleContact.email || 'email@exemplo.com')
  message = message.replace(/\{\{telefone\}\}/g, props.sampleContact.telefone || '00000000000')
  message = message.replace(/\{\{cidade\}\}/g, props.sampleContact.cidade || 'Cidade')
  message = message.replace(/\{\{empresa\}\}/g, props.sampleContact.empresa || 'Empresa')
  
  // Processar spintax - escolhe a primeira opção para preview
  message = message.replace(/\{([^}]+)\}/g, (match, content) => {
    const options = content.split('|')
    return options[0] || match
  })
  
  return message
})

// Methods
const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleFocus = () => {
  closeAllMenus()
}

const closeAllMenus = () => {
  showSpintaxMenu.value = false
  showVariablesMenu.value = false
}

const toggleSpintaxMenu = () => {
  showVariablesMenu.value = false
  showSpintaxMenu.value = !showSpintaxMenu.value
  if (showSpintaxMenu.value) {
    spintaxInput.value = ''
  }
}

const toggleVariablesMenu = () => {
  showSpintaxMenu.value = false
  showVariablesMenu.value = !showVariablesMenu.value
}

const insertAtCursor = (text) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const currentValue = props.modelValue || ''
  
  const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
  emit('update:modelValue', newValue)
  
  // Reposicionar cursor após a inserção
  nextTick(() => {
    textarea.focus()
    const newPosition = start + text.length
    textarea.setSelectionRange(newPosition, newPosition)
  })
}

const insertSpintax = () => {
  if (!spintaxInput.value.trim()) return
  
  const spintaxText = `{${spintaxInput.value.trim()}}`
  insertAtCursor(spintaxText)
  
  spintaxInput.value = ''
  showSpintaxMenu.value = false
}

const insertVariable = (variable) => {
  insertAtCursor(variable)
  showVariablesMenu.value = false
}

// Click outside handler
const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest('.campaign-message-editor')) {
    closeAllMenus()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.campaign-message-editor {
  @apply relative;
}
</style>

