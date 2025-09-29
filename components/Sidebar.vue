<template>
  <div
    class="flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden"
    :class="[
      isExpanded ? 'w-64' : 'w-[76px]'
    ]"
  >
    <!-- Logo e Título -->
    <div class="flex items-center px-4 py-4 border-b border-gray-200 h-16">
      <div class="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span class="text-white font-bold text-sm">A</span>
      </div>
      <h1
        class="ml-2 text-xl font-semibold text-gray-900 transition-opacity duration-300 delay-100"
        :class="[
          isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
        ]"
      >
        Artemis
      </h1>
    </div>

    <!-- Navegação -->
    <nav class="flex-1 px-4 py-6 space-y-2">
      <NuxtLink
        to="/atendimentos"
        class="flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group"
        :class="[
          isActive('/atendimentos')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        ]"
      >
        <svg
          class="h-5 w-5 flex-shrink-0"
          :class="[
            isActive('/atendimentos') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span
          class="ml-3 transition-opacity duration-300 delay-100"
          :class="[
            isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
          ]"
        >
          Atendimentos
        </span>
      </NuxtLink>

      <NuxtLink
        to="/contatos"
        class="flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group"
        :class="[
          isActive('/contatos')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        ]"
      >
        <svg
          class="h-5 w-5 flex-shrink-0"
          :class="[
            isActive('/contatos') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span
          class="ml-3 transition-opacity duration-300 delay-100"
          :class="[
            isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
          ]"
        >
          Contatos
        </span>
      </NuxtLink>
    </nav>

    <!-- Seção inferior -->
    <div class="px-4 py-4 border-t border-gray-200 mt-auto h-16">
      <div class="flex items-center h-full">
        <div class="flex-shrink-0 flex items-center justify-center">
          <div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {{ userInitials }}
          </div>
        </div>
        <div
          class="ml-3 flex-1 transition-opacity duration-300"
          :class="[
            isExpanded ? 'opacity-100' : 'opacity-0 hidden'
          ]"
        >
          <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
          <p class="text-xs text-gray-500">{{ userEmail }}</p>
        </div>
        <button
          v-if="isExpanded"
          class="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

// Props
const props = defineProps({
  isExpanded: {
    type: Boolean,
    default: true
  }
})

const route = useRoute()

// Dados do usuário (mockados)
const userName = ref('Administrador')
const userEmail = ref('admin@artemis.com')

// Computados
const userInitials = computed(() => {
  return userName.value.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
})

// Métodos
const isActive = (path) => {
  return route.path === path
}
</script>