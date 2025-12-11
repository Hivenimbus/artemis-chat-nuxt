<template>
  <div class="h-full bg-gray-50">
    <div class="max-w-4xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Cabeçalho -->
      <div class="mb-4 sm:mb-6 flex-shrink-0">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p class="mt-1 text-sm text-gray-500">Gerencie suas informações pessoais e de segurança</p>
      </div>

      <!-- Card do Perfil -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-500">Carregando perfil...</p>
          </div>
        </div>

        <!-- Conteúdo -->
        <div v-else class="p-6 sm:p-8 space-y-6">
          
          <!-- Avatar e Informações Básicas -->
          <div class="flex items-center space-x-6">
            <div class="flex-shrink-0">
              <div class="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {{ userInitials }}
              </div>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">{{ formData.name || 'Usuário' }}</h2>
              <p class="text-sm text-gray-500">{{ userData?.email }}</p>
              <div class="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {{ userRoleFormatted }}
              </div>
            </div>
          </div>

          <hr class="border-gray-200" />

          <!-- Formulário -->
          <form @submit.prevent="saveProfile" class="space-y-6">
            
            <!-- Mensagens de Feedback -->
            <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
                </div>
              </div>
            </div>

            <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
                </div>
              </div>
            </div>

            <!-- Campos -->
            <div class="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
              
              <!-- Nome -->
              <div class="sm:col-span-2">
                <label for="name" class="block text-sm font-medium text-gray-700">Nome Completo</label>
                <div class="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    v-model="formData.name"
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <!-- Email (Read-only) -->
              <div class="sm:col-span-2">
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <div class="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    :value="userData?.email"
                    disabled
                    class="shadow-sm bg-gray-50 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p class="mt-1 text-xs text-gray-500">O email não pode ser alterado.</p>
              </div>

            </div>

            <div class="pt-4 pb-2">
              <h3 class="text-lg font-medium text-gray-900">Segurança</h3>
              <p class="mt-1 text-sm text-gray-500">Alterar sua senha de acesso.</p>
            </div>
            
            <div class="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
              <!-- Senha Atual -->
              <div class="sm:col-span-1">
                <label for="currentPassword" class="block text-sm font-medium text-gray-700">Senha Atual</label>
                <div class="mt-1">
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    v-model="formData.currentPassword"
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                    placeholder="Digite sua senha atual"
                  />
                </div>
              </div>

              <!-- Nova Senha -->
              <div class="sm:col-span-1">
                <label for="newPassword" class="block text-sm font-medium text-gray-700">Nova Senha</label>
                <div class="mt-1">
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    v-model="formData.newPassword"
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                    placeholder="Digite a nova senha"
                  />
                </div>
                 <p class="mt-1 text-xs text-gray-500">Deixe em branco se não quiser alterar.</p>
              </div>
            </div>

            <!-- Botões -->
            <div class="flex justify-end pt-4">
              <button
                type="submit"
                :disabled="saving"
                class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg
                  v-if="saving"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                  <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

const { userData, getUserData } = useUser()

// Estados
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const formData = ref({
  name: '',
  currentPassword: '',
  newPassword: ''
})

// Computados
const userInitials = computed(() => {
  const name = formData.value.name || userData.value?.name || 'Usuário'
  if (name === 'Usuário') return 'U'
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
})

const userRoleFormatted = computed(() => {
  const role = userData.value?.role || 'user'
  const roles = {
    'superadmin': 'Super Administrador',
    'admin': 'Administrador',
    'user': 'Usuário',
    'agent': 'Agente'
  }
  return roles[role] || role
})

// Inicialização
onMounted(async () => {
  if (!userData.value) {
    try {
      await getUserData()
    } catch (error) {
      errorMessage.value = 'Erro ao carregar dados do usuário'
    }
  }
  
  if (userData.value) {
    formData.value.name = userData.value.name || ''
  }
  
  loading.value = false
})

// Watcher para atualizar form se userData mudar (ex: reload)
watch(userData, (newVal) => {
  if (newVal && !formData.value.name) {
    formData.value.name = newVal.name || ''
  }
}, { immediate: true })

// Salvar perfil
const saveProfile = async () => {
  if (!formData.value.name || !formData.value.name.trim()) {
    errorMessage.value = 'O nome não pode estar vazio'
    return
  }

  // Validação de senha se preenchido
  if (formData.value.newPassword) {
    if (!formData.value.currentPassword) {
      errorMessage.value = 'Para alterar a senha, informe a senha atual'
      return
    }
    if (formData.value.newPassword.length < 6) {
      errorMessage.value = 'A nova senha deve ter no mínimo 6 caracteres'
      return
    }
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      name: formData.value.name
    }

    if (formData.value.currentPassword && formData.value.newPassword) {
      payload.currentPassword = formData.value.currentPassword
      payload.newPassword = formData.value.newPassword
    }

    const { data } = await $fetch('/api/user', {
      method: 'PUT',
      body: payload
    })

    // Limpar campos de senha
    formData.value.currentPassword = ''
    formData.value.newPassword = ''

    // Atualizar dados locais via composable se possível ou manualmente
    await getUserData()

    successMessage.value = 'Perfil atualizado com sucesso!'
    
    // Limpar mensagem de sucesso após alguns segundos
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    errorMessage.value = error.data?.statusMessage || 'Erro ao atualizar perfil. Tente novamente.'
  } finally {
    saving.value = false
  }
}
</script>
