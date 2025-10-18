<template>
  <div class="fixed inset-0 backdrop-blur-[2px] bg-opacity-20 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            Novo Contato
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Nome e Sobrenome -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                v-model="formData.name"
                type="text"
                required
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Digite o nome"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Sobrenome
              </label>
              <input
                v-model="formData.lastName"
                type="text"
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Digite o sobrenome"
              />
            </div>
          </div>

          <!-- Email e Telefone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                v-model="formData.email"
                type="email"
                required
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="email@exemplo.com"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-600">
                {{ errors.email }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                v-model="formData.phone"
                type="tel"
                required
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="(00) 00000-0000"
              />
              <p v-if="errors.phone" class="mt-1 text-sm text-red-600">
                {{ errors.phone }}
              </p>
            </div>
          </div>

          <!-- Cidade e País -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                v-model="formData.city"
                type="text"
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Digite a cidade"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <input
                v-model="formData.country"
                type="text"
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Digite o país"
              />
            </div>
          </div>

          <!-- Empresa e Biografia -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <input
                v-model="formData.company"
                type="text"
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                v-model="formData.address"
                type="text"
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Rua, número, complemento..."
              />
            </div>
          </div>

          <!-- Biografia -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Biografia
            </label>
            <textarea
              v-model="formData.biography"
              rows="3"
              :disabled="loading"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Informações adicionais sobre o contato..."
            ></textarea>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>

            <!-- Dropdown de Tags -->
            <div class="relative">
              <!-- Botão Trigger -->
              <button
                ref="tagsButtonRef"
                type="button"
                @click="toggleTagsDropdown"
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-left bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <!-- Tags selecionadas como chips -->
                    <div v-if="formData.tags.length > 0" class="flex flex-wrap gap-1">
                      <span
                        v-for="tag in formData.tags"
                        :key="tag"
                        :class="getTagColor(tag)"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {{ tag }}
                        <button
                          type="button"
                          @click.stop="removeTag(tag)"
                          class="ml-1 text-current hover:text-red-600 transition-colors"
                        >
                          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                      </span>
                    </div>
                    <span v-else class="text-gray-500">Selecione as tags...</span>
                  </div>

                  <!-- Seta indicadora -->
                  <svg
                    :class="[
                      'h-5 w-5 text-gray-400 transition-transform duration-200',
                      showTagsDropdown ? 'rotate-180' : ''
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              :disabled="loading"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Criando...' : 'Criar Contato' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Dropdown Flutuante via Teleport -->
    <Teleport to="body">
      <div
        v-if="showTagsDropdown"
        v-click-outside="closeTagsDropdown"
        class="fixed z-[60] bg-white border border-gray-200 rounded-lg shadow-lg"
        :style="{
          top: `${tagsDropdownPosition.top}px`,
          left: `${tagsDropdownPosition.left}px`,
          width: `${tagsDropdownPosition.width}px`
        }"
      >
        <div class="p-2 max-h-48 overflow-y-auto">
          <div
            v-for="tag in availableTags"
            :key="tag"
            class="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
            @click="toggleTag(tag)"
          >
            <input
              type="checkbox"
              :checked="formData.tags.includes(tag)"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
              @click.stop
            />
            <span class="text-sm text-gray-700">{{ tag }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
// Emits
const emit = defineEmits(['save', 'close'])

// State
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({
  name: '',
  email: '',
  phone: ''
})
const showTagsDropdown = ref(false)
const tagsDropdownPosition = ref({ top: 0, left: 0, width: 0 })
const tagsButtonRef = ref(null)

// Tags disponíveis
const availableTags = ref([])

// Carregar etiquetas disponíveis
const loadEtiquetas = async () => {
  try {
    const { fetchEtiquetas } = useContatos()
    availableTags.value = await fetchEtiquetas()
  } catch (err) {
    console.error('Erro ao carregar etiquetas:', err)
    // Usar tags padrão em caso de erro
    availableTags.value = ['VIP', 'Cliente', 'Novo Lead', 'Empresa']
  }
}

// Carregar etiquetas quando o componente for montado
onMounted(() => {
  loadEtiquetas()
})

// Form data
const formData = ref({
  name: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  country: '',
  biography: '',
  company: '',
  address: '',
  tags: []
})

// Methods
const clearErrors = () => {
  errors.value = { name: '', email: '', phone: '' }
  errorMessage.value = ''
}

// Funções do dropdown de tags
const calculateDropdownPosition = () => {
  if (!tagsButtonRef.value) return

  const rect = tagsButtonRef.value.getBoundingClientRect()
  const scrollY = window.scrollY
  const scrollX = window.scrollX

  tagsDropdownPosition.value = {
    top: rect.bottom + scrollY + 4, // 4px de margem
    left: rect.left + scrollX,
    width: rect.width
  }
}

const toggleTagsDropdown = () => {
  if (!showTagsDropdown.value) {
    calculateDropdownPosition()
  }
  showTagsDropdown.value = !showTagsDropdown.value
}

const closeTagsDropdown = () => {
  showTagsDropdown.value = false
}

const removeTag = (tagToRemove) => {
  const index = formData.value.tags.indexOf(tagToRemove)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

const toggleTag = (tag) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  } else {
    formData.value.tags.push(tag)
  }
}

const getTagColor = (tag) => {
  const colors = {
    'VIP': 'bg-purple-100 text-purple-800',
    'Cliente': 'bg-blue-100 text-blue-800',
    'Novo Lead': 'bg-green-100 text-green-800',
    'Empresa': 'bg-indigo-100 text-indigo-800'
  }
  return colors[tag] || 'bg-gray-100 text-gray-800'
}

const resetForm = () => {
  formData.value = {
    name: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    biography: '',
    company: '',
    address: '',
    tags: []
  }
  clearErrors()
}

const validateForm = () => {
  clearErrors()
  let isValid = true

  // Validate name
  if (!formData.value.name || formData.value.name.trim().length < 2) {
    errors.value.name = 'Nome deve ter pelo menos 2 caracteres'
    isValid = false
  }

  // Validate email
  if (!formData.value.email) {
    errors.value.email = 'Email é obrigatório'
    isValid = false
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.value.email)) {
      errors.value.email = 'Email inválido'
      isValid = false
    }
  }

  // Validate phone
  if (!formData.value.phone) {
    errors.value.phone = 'Telefone é obrigatório'
    isValid = false
  } else {
    const phoneRegex = /^\(?(\d{2})\)?[-. ]?(\d{5})[-. ]?(\d{4})$/
    const cleanPhone = formData.value.phone.replace(/\D/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.value.phone = 'Telefone inválido'
      isValid = false
    }
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const contactData = {
      ...formData.value,
      name: formData.value.name.trim(),
      lastName: formData.value.lastName.trim(),
      email: formData.value.email.trim(),
      lastContact: new Date()
    }

    emit('save', contactData)
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    errorMessage.value = 'Erro ao criar contato. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Initialize form when component is mounted
onMounted(() => {
  resetForm()
})
</script>

<style scoped>
/* Additional styles if needed */
.backdrop-blur-\[2px\] {
  backdrop-filter: blur(2px);
}
</style>