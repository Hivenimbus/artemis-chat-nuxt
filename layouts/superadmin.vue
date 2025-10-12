<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header do Painel Superadmin -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo e Nome -->
          <div class="flex items-center">
            <NuxtLink to="/superadmin" class="flex items-center">
              <div class="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h1 class="text-xl font-bold text-gray-900">Painel Superadmin</h1>
                <p class="text-xs text-gray-500">Artemis Chat</p>
              </div>
            </NuxtLink>
          </div>

          <!-- Navegação Interna -->
          <nav class="hidden md:flex space-x-8">
            <NuxtLink
              to="/superadmin"
              class="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium transition-colors"
              :class="{ 'text-red-600 border-b-2 border-red-600': $route.path === '/superadmin' }"
            >
              Dashboard
            </NuxtLink>
            <!-- Aqui podemos adicionar mais links de navegação interna no futuro -->
          </nav>

          <!-- Área do Usuário -->
          <div class="flex items-center space-x-4">
            <!-- Badge de Superadmin -->
            <div class="hidden sm:flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              <svg class="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              Superadmin
            </div>

            <!-- Menu do Usuário -->
            <div class="relative">
              <button
                @click="userMenuOpen = !userMenuOpen"
                class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <div class="h-8 w-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                  {{ userInitials }}
                </div>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="userMenuOpen"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50"
              >
                <div class="py-1">
                  <div class="px-4 py-2 text-sm text-gray-700">
                    <div class="font-medium">{{ userName }}</div>
                    <div class="text-gray-500">{{ userEmail }}</div>
                  </div>
                  <div class="border-t border-gray-100"></div>
                  <NuxtLink
                    to="/atendimentos"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div class="flex items-center">
                      <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Voltar ao Sistema
                    </div>
                  </NuxtLink>
                  <button
                    @click="handleLogout"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div class="flex items-center">
                      <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sair
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Conteúdo Principal -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center text-sm text-gray-500">
          <div>&copy; 2025 Artemis Chat. Todos os direitos reservados.</div>
          <div class="flex items-center">
            <svg class="h-4 w-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            Painel Superadmin v1.0
          </div>
        </div>
      </div>
    </footer>

    <!-- Overlay para fechar o menu quando clicar fora -->
    <div
      v-if="userMenuOpen"
      class="fixed inset-0 z-40"
      @click="userMenuOpen = false"
    ></div>
  </div>
</template>

<script setup>
import { useSupabaseClient } from '#imports'

// Composables
const { user } = useSuperAdmin()
const supabase = useSupabaseClient()

// Estado
const userMenuOpen = ref(false)

// Computados
const userName = computed(() => user.value?.user_metadata?.name || user.value?.email?.split('@')[0] || 'Usuário')
const userEmail = computed(() => user.value?.email || '')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
})

// Métodos
const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    await navigateTo('/')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

// Fechar menu quando rolar a página
onMounted(() => {
  document.addEventListener('scroll', () => {
    userMenuOpen.value = false
  })
})

onUnmounted(() => {
  document.removeEventListener('scroll', () => {
    userMenuOpen.value = false
  })
})
</script>