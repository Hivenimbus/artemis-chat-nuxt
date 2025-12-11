<template>
  <div class="campaign-message-editor">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-t-lg">
      <!-- Botão Spintax -->
      <button
        type="button"
        @click="openSpintaxModal"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        <svg class="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        Spintax
      </button>

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

    <!-- Modal de Spintax -->
    <Teleport to="body">
      <div
        v-if="showSpintaxModal"
        class="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
        @click.self="closeSpintaxModal"
      >
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <!-- Header do Modal -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Gerar Spintax</h3>
            </div>
            <button
              type="button"
              @click="closeSpintaxModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Conteúdo do Modal -->
          <div class="px-6 py-5">
            <p class="text-sm text-gray-600 mb-6">
              Adicione variações de palavras para criar mensagens dinâmicas. Cada campo receberá uma única palavra.
            </p>

            <!-- Campos de Variação -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-medium text-gray-700">Variações de Palavras</label>
                <span class="text-sm text-gray-500">{{ usedFieldsCount }} de {{ maxSpintaxFields }} campos utilizados</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  v-for="(field, index) in spintaxFields"
                  :key="index"
                  class="relative"
                >
                  <label class="block text-xs font-medium text-gray-500 mb-1">
                    Spintax {{ index + 1 }}
                  </label>
                  <div class="relative">
                    <input
                      v-model="spintaxFields[index]"
                      type="text"
                      :placeholder="`Opção ${index + 1}`"
                      class="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-8"
                    />
                    <button
                      v-if="spintaxFields.length > 1"
                      type="button"
                      @click="removeSpintaxField(index)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botão Adicionar Campo -->
            <button
              v-if="spintaxFields.length < maxSpintaxFields"
              type="button"
              @click="addSpintaxField"
              class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Adicionar campo
            </button>

            <!-- Preview do Spintax Gerado -->
            <div v-if="usedFieldsCount > 0" class="mt-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Preview do spintax:</p>
              <code class="text-sm text-indigo-600 font-mono">
                {{'{'}}{{ spintaxFields.filter(f => f.trim()).join('|') }}{{'}'}}
              </code>
            </div>
          </div>

          <!-- Footer do Modal -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              @click="closeSpintaxModal"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="generateSpintax"
              :disabled="usedFieldsCount === 0"
              class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gerar Spintax
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
const showSpintaxModal = ref(false)
const showVariablesMenu = ref(false)
const spintaxFields = ref(['', '', ''])
const maxSpintaxFields = 9

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

// Computed
const usedFieldsCount = computed(() => {
  return spintaxFields.value.filter(f => f.trim() !== '').length
})

// Methods
const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleFocus = () => {
  closeAllMenus()
}

const closeAllMenus = () => {
  showSpintaxModal.value = false
  showVariablesMenu.value = false
}

const openSpintaxModal = () => {
  showVariablesMenu.value = false
  spintaxFields.value = ['', '', '']
  showSpintaxModal.value = true
}

const closeSpintaxModal = () => {
  showSpintaxModal.value = false
  spintaxFields.value = ['', '', '']
}

const addSpintaxField = () => {
  if (spintaxFields.value.length < maxSpintaxFields) {
    spintaxFields.value.push('')
  }
}

const removeSpintaxField = (index) => {
  if (spintaxFields.value.length > 1) {
    spintaxFields.value.splice(index, 1)
  }
}

const generateSpintax = () => {
  const validOptions = spintaxFields.value.filter(f => f.trim() !== '')
  if (validOptions.length === 0) return
  
  const spintaxText = `{${validOptions.join('|')}}`
  insertAtCursor(spintaxText)
  closeSpintaxModal()
}

const toggleVariablesMenu = () => {
  showSpintaxModal.value = false
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

const insertVariable = (variable) => {
  insertAtCursor(variable)
  showVariablesMenu.value = false
}

// Click outside handler para o menu de variáveis
const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest('.campaign-message-editor') && !target.closest('[data-spintax-modal]')) {
    showVariablesMenu.value = false
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

