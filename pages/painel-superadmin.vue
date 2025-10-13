<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
    <!-- Elementos de fundo decorativos -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      <div class="absolute top-40 left-1/2 w-80 h-80 bg-blue-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
    </div>

    <div class="relative z-10">
      <!-- Header -->
      <div class="bg-white/95 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold bg-gradient-to-r from-purple-900 to-indigo-600 bg-clip-text text-transparent">
                  Painel Superadmin
                </h1>
                <p class="text-sm text-gray-600">Gerenciamento de Empresas</p>
              </div>
            </div>

            <div class="flex items-center space-x-4">
              <!-- Botão de atualização -->
              <button
                @click="refreshEmpresas"
                :disabled="loading"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 disabled:opacity-50"
              >
                <svg
                  class="h-4 w-4 mr-2"
                  :class="{ 'animate-spin': loading }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ loading ? 'Atualizando...' : 'Atualizar' }}
              </button>

              <!-- Botão de retorno -->
              <NuxtLink
                to="/atendimentos"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Voltar
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 rounded-lg">
                <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total de Empresas</p>
                <p class="text-2xl font-bold text-gray-900">{{ empresas.length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Empresas OK</p>
                <p class="text-2xl font-bold text-green-600">{{ empresasPorStatus.normal }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div class="flex items-center">
              <div class="p-3 bg-yellow-100 rounded-lg">
                <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Atenção</p>
                <p class="text-2xl font-bold text-yellow-600">{{ empresasPorStatus.atencao + empresasPorStatus.urgente }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div class="flex items-center">
              <div class="p-3 bg-red-100 rounded-lg">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Vencidas</p>
                <p class="text-2xl font-bold text-red-600">{{ empresasPorStatus.vencido }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && empresas.length === 0" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg">
              <svg class="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="mt-4 text-white">Carregando empresas...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erro ao carregar empresas</h3>
              <p class="mt-1 text-sm text-red-700">{{ error }}</p>
              <div class="mt-3">
                <button
                  @click="refreshEmpresas"
                  class="text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="empresas.length === 0" class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-12 text-center border border-white/20">
          <div class="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
          <p class="text-gray-600">Não há empresas cadastradas no sistema.</p>
        </div>

        <!-- Empresas List -->
        <div v-else class="empresas-list">
          <EmpresaListItem
            v-for="empresa in empresas"
            :key="empresa.id"
            :empresa="empresa"
            @edit="openEditModal"
          />
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <EmpresaEditModal
      v-if="showEditModal"
      :empresa="selectedEmpresa"
      @save="handleSaveEmpresa"
      @close="closeEditModal"
    />
  </div>
</template>

<script setup>
// Verificar se o usuário é superadmin
const { isSuperAdmin } = useUser()

// Usar composable de empresas
const {
  loading,
  error,
  empresas,
  getEmpresas
} = useEmpresas()

// Computar estatísticas por status
const empresasPorStatus = computed(() => {
  const stats = {
    normal: 0,
    atencao: 0,
    urgente: 0,
    vencido: 0
  }

  empresas.value.forEach(empresa => {
    stats[empresa.statusVencimento]++
  })

  return stats
})

// Estado do modal
const showEditModal = ref(false)
const selectedEmpresa = ref(null)

// Método para atualizar empresas
const refreshEmpresas = async () => {
  try {
    await getEmpresas()
  } catch (err) {
    console.error('Erro ao atualizar empresas:', err)
  }
}

// Métodos do modal
const openEditModal = (empresa) => {
  selectedEmpresa.value = empresa
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedEmpresa.value = null
}

const handleSaveEmpresa = async (empresaData) => {
  try {
    loading.value = true

    const response = await $fetch(`/api/empresas/${empresaData.id}`, {
      method: 'PUT',
      body: empresaData
    })

    if (response.success) {
      // Atualizar a lista de empresas
      await refreshEmpresas()
      // Fechar modal
      closeEditModal()

      // Mostrar mensagem de sucesso (opcional)
      console.log('Empresa atualizada com sucesso!')
    }
  } catch (err) {
    console.error('Erro ao salvar empresa:', err)
    // Aqui você pode mostrar uma notificação de erro
  } finally {
    loading.value = false
  }
}

// Middleware de proteção da página
definePageMeta({
  layout: 'auth',
  middleware: 'superadmin'
})

// Meta tags para SEO
useHead({
  title: 'Painel Superadmin - Empresas',
  meta: [
    { name: 'description', content: 'Painel de administração de empresas do sistema' }
  ]
})
</script>

<style scoped>
/* Animações customizadas */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* Empresas List Styles */
.empresas-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>