<template>
  <div class="h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <Sidebar
      :is-expanded="isSidebarExpanded"
      class="hidden md:flex h-full transition-all duration-300"
      :class="[
        isSidebarExpanded ? 'w-64' : 'w-16'
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
  isSidebarExpanded.value = !isSidebarExpanded.value
  // Salvar preferência no localStorage
  if (process.client) {
    localStorage.setItem('sidebarExpanded', isSidebarExpanded.value.toString())
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