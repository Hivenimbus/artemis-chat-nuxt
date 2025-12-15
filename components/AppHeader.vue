<template>
  <header class="bg-white shadow-sm border-b border-gray-200 h-16">
    <div class="flex items-center justify-between px-4 py-4 h-full">
      <!-- Botão de Toggle da Sidebar -->
      <div class="flex items-center">
        <button
          @click="$emit('toggle-sidebar')"
          class="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-md hover:bg-gray-100"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      <!-- Ações e Notificações -->
      <div class="flex items-center space-x-4">
        <!-- Notificações -->
        <button class="relative text-gray-400 hover:text-gray-600 transition-colors duration-200">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {{ notificationCount }}
          </span>
        </button>

        <!-- Menu do Usuário -->
        <div class="relative">
          <button
            @click="toggleUserMenu"
            class="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {{ userInitials }}
            </div>
            <span class="hidden md:block text-gray-700 font-medium">{{ userName }}</span>
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showUserMenu"
            ref="userMenuRef"
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-[9999] border border-gray-200 pointer-events-auto"
          >
            <NuxtLink
              to="/profile"
              class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Meu Perfil
            </NuxtLink>
            <hr class="my-1">
            <button
              @click="handleLogout"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Dashboard'
  },
  subtitle: {
    type: String,
    default: ''
  }
})

// Dados do usuário
const { userData: user } = useUser()
const notificationCount = ref(3)

// Computados para dados do usuário
const userName = computed(() => {
  return user.value?.name || user.value?.email?.split('@')[0] || 'Usuário'
})

const userEmail = computed(() => {
  return user.value?.email || 'usuario@artemis.com'
})

// Estados
const showUserMenu = ref(false)
const userMenuRef = ref(null)

// Computados
const userInitials = computed(() => {
  const name = userName.value
  if (name === 'Usuário') return 'U'
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
})

// Métodos
const toggleUserMenu = (event) => {
  event.preventDefault()
  event.stopPropagation()
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const handleLogout = async () => {
  try {
    await logout()
    closeUserMenu()
    // router.push('/') // logout already handles redirect
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

// Fechar o menu ao clicar fora
const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    closeUserMenu()
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Fechar o menu quando a rota mudar
watch(() => route.path, () => {
  showUserMenu.value = false
})
</script>