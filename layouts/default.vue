<template>
  <div class="h-screen bg-gray-50 flex">
    <!-- Overlay para mobile -->
    <div
      v-if="isSidebarMobileOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      @click="isSidebarMobileOpen = false"
    />

    <!-- Sidebar -->
    <Sidebar
      :is-expanded="isSidebarExpanded"
      class="h-full transition-all duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-50 md:translate-x-0 transform md:flex"
      :class="[
        isSidebarExpanded ? 'w-64' : 'w-16',
        isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    />

    <!-- Conteúdo Principal -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <!-- Conteúdo da página -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// Estado da sidebar
const isSidebarExpanded = ref(true)
const isSidebarMobileOpen = ref(false)

// Meta tags globais
useHead({
  titleTemplate: '%s - Artemis',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})

// Métodos
const toggleSidebar = () => {
  // Verificar se estamos no modo mobile
  if (window.innerWidth < 768) {
    isSidebarMobileOpen.value = !isSidebarMobileOpen.value
  } else {
    // Modo desktop - comportamento normal
    isSidebarExpanded.value = !isSidebarExpanded.value
    // Salvar preferência no localStorage
    if (process.client) {
      localStorage.setItem('sidebarExpanded', isSidebarExpanded.value.toString())
    }
  }
}

// Inicializar estado da sidebar do localStorage
onMounted(() => {
  if (process.client) {
    const saved = localStorage.getItem('sidebarExpanded')
    if (saved !== null) {
      isSidebarExpanded.value = saved === 'true'
    }
  }
})
</script>