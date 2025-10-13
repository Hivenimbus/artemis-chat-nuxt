<template>
  <div class="fixed inset-0 backdrop-blur-[2px] bg-opacity-20 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            Editar Empresa
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
          <!-- Nome da Empresa -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nome da Empresa *
            </label>
            <input
              v-model="formData.nome"
              type="text"
              required
              :disabled="loading"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Digite o nome da empresa"
            />
            <p v-if="errors.nome" class="mt-1 text-sm text-red-600">
              {{ errors.nome }}
            </p>
          </div>

          <!-- Data de Vencimento -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Data de Vencimento *
            </label>
            <input
              v-model="formData.vencimento"
              type="date"
              required
              :disabled="loading"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p v-if="errors.vencimento" class="mt-1 text-sm text-red-600">
              {{ errors.vencimento }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              Data em que o acesso da empresa expira
            </p>
          </div>

          <!-- Informações Atuais -->
          <div class="bg-gray-50 p-3 rounded-lg">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Informações Atuais</h3>
            <div class="space-y-1 text-sm text-gray-600">
              <p><strong>Total de Usuários:</strong> {{ empresa?.totalUsuarios || 0 }}</p>
              <p><strong>Status Atual:</strong>
                <span :class="getStatusClass(empresa?.statusVencimento)">
                  {{ getStatusText(empresa?.statusVencimento, empresa?.diasParaVencimento) }}
                </span>
              </p>
              <p><strong>Criada em:</strong> {{ formatDate(empresa?.criadaEm) }}</p>
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
              {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  empresa: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['save', 'close'])

// State
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({
  nome: '',
  vencimento: ''
})

// Form data
const formData = ref({
  nome: '',
  vencimento: ''
})

// Methods
const clearErrors = () => {
  errors.value = { nome: '', vencimento: '' }
  errorMessage.value = ''
}

// Initialize form with empresa data
watch(() => props.empresa, (newEmpresa) => {
  if (newEmpresa) {
    formData.value = {
      nome: newEmpresa.nome || '',
      vencimento: new Date(newEmpresa.vencimento).toISOString().split('T')[0]
    }
    clearErrors()
  }
}, { immediate: true })

const validateForm = () => {
  clearErrors()
  let isValid = true

  // Validate nome
  if (!formData.value.nome || formData.value.nome.trim().length < 2) {
    errors.value.nome = 'Nome deve ter pelo menos 2 caracteres'
    isValid = false
  }

  // Validate vencimento
  if (!formData.value.vencimento) {
    errors.value.vencimento = 'Data de vencimento é obrigatória'
    isValid = false
  } else {
    const dataVenc = new Date(formData.value.vencimento)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (dataVenc < hoje) {
      errors.value.vencimento = 'Data de vencimento não pode ser anterior a hoje'
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
    const updateData = {
      id: props.empresa.id,
      nome: formData.value.nome.trim(),
      vencimento: formData.value.vencimento
    }

    emit('save', updateData)
  } catch (error) {
    console.error('Erro ao salvar empresa:', error)
    errorMessage.value = 'Erro ao salvar alterações. Tente novamente.'
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status) => {
  const classes = {
    'vencido': 'text-red-600 font-medium',
    'urgente': 'text-orange-600 font-medium',
    'atencao': 'text-yellow-600 font-medium',
    'normal': 'text-green-600 font-medium'
  }
  return classes[status] || 'text-gray-600'
}

const getStatusText = (status, dias) => {
  if (!status || dias === undefined) return 'Desconhecido'

  switch (status) {
    case 'vencido':
      return `Vencido há ${Math.abs(dias)} dias`
    case 'urgente':
      return `Vence em ${dias} dias`
    case 'atencao':
      return `Vence em ${dias} dias`
    default:
      return `Vence em ${dias} dias`
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Não informada'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
/* Additional styles if needed */
.backdrop-blur-\[2px\] {
  backdrop-filter: blur(2px);
}
</style>