<template>
  <div
    class="flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden"
    :class="[
      isExpanded ? 'w-64' : 'w-[76px]'
    ]"
  >
    <!-- Logo e Título -->
    <div class="flex items-center px-4 py-4 border-b border-gray-200 h-16">
      <div class="h-11 w-11 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span class="text-white font-bold text-base">A</span>
      </div>
      <h1
        class="ml-2 text-2xl font-semibold text-gray-900 transition-opacity duration-300 delay-100"
        :class="[
          isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
        ]"
      >
        Artemis Chat
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
        to="/agendamentos"
        class="flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group"
        :class="[
          isActive('/agendamentos')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        ]"
      >
        <svg
          class="h-5 w-5 flex-shrink-0"
          :class="[
            isActive('/agendamentos') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span
          class="ml-3 transition-opacity duration-300 delay-100"
          :class="[
            isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
          ]"
        >
          Agendamentos
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

      <NuxtLink
        to="/kanbans"
        class="flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group"
        :class="[
          isActive('/kanbans')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        ]"
      >
        <svg
          class="h-5 w-5 flex-shrink-0"
          :class="[
            isActive('/kanbans') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-4h.01M9 16h.01"
          />
        </svg>
        <span
          class="ml-3 transition-opacity duration-300 delay-100"
          :class="[
            isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
          ]"
        >
          Kanbans
        </span>
      </NuxtLink>

      <!-- Configurações com submenu -->
      <div>
        <button
          @click="toggleSettings"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group"
          :class="[
            isSettingsActive
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          ]"
        >
          <svg
            class="h-5 w-5 flex-shrink-0"
            :class="[
              isSettingsActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span
            class="ml-3 flex-1 text-left transition-opacity duration-300 delay-100"
            :class="[
              isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
            ]"
          >
            Configurações
          </span>
          <svg
            v-if="isExpanded"
            class="h-4 w-4 transition-transform duration-200"
            :class="[
              settingsExpanded ? 'transform rotate-180' : '',
              isSettingsActive ? 'text-indigo-600' : 'text-gray-400'
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Submenu -->
        <div
          v-if="settingsExpanded && isExpanded"
          class="mt-1 ml-3 space-y-1 border-l-2 border-gray-200 pl-4"
        >
          <NuxtLink
            to="/configuracoes/etiquetas"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group"
            :class="[
              isActive('/configuracoes/etiquetas')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <svg
              class="h-4 w-4 flex-shrink-0"
              :class="[
                isActive('/configuracoes/etiquetas') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span class="ml-3">Etiquetas</span>
          </NuxtLink>

          <NuxtLink
            to="/configuracoes/equipes"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group"
            :class="[
              isActive('/configuracoes/equipes')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <svg
              class="h-4 w-4 flex-shrink-0"
              :class="[
                isActive('/configuracoes/equipes') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span class="ml-3">Equipes</span>
          </NuxtLink>

          <NuxtLink
            to="/configuracoes/agentes"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group"
            :class="[
              isActive('/configuracoes/agentes')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <svg
              class="h-4 w-4 flex-shrink-0"
              :class="[
                isActive('/configuracoes/agentes') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="ml-3">Agentes</span>
          </NuxtLink>

          <NuxtLink
            to="/configuracoes/caixas-de-entrada"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group"
            :class="[
              isActive('/configuracoes/caixas-de-entrada')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <svg
              class="h-4 w-4 flex-shrink-0"
              :class="[
                isActive('/configuracoes/caixas-de-entrada') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <span class="ml-3">Caixas de entrada</span>
          </NuxtLink>

          <NuxtLink
            to="/configuracoes/ia"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group"
            :class="[
              isActive('/configuracoes/ia')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <svg
              class="h-4 w-4 flex-shrink-0"
              :class="[
                isActive('/configuracoes/ia') ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span class="ml-3">IA</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Painel Superadmin (apenas para usuários com role superadmin) -->
      <div v-if="isSuperAdmin" class="pt-4 border-t border-gray-200">
        <NuxtLink
          to="/superadmin"
          class="flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group"
          :class="[
            isActive('/superadmin')
              ? 'bg-red-50 text-red-700'
              : 'text-red-700 hover:bg-red-50 hover:text-red-900'
          ]"
        >
          <svg
            class="h-5 w-5 flex-shrink-0"
            :class="[
              isActive('/superadmin') ? 'text-red-600' : 'text-red-500 group-hover:text-red-600'
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span
            class="ml-3 transition-opacity duration-300 delay-100"
            :class="[
              isExpanded ? 'opacity-100' : 'opacity-0 absolute invisible'
            ]"
          >
            Painel Superadmin
          </span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Seção inferior -->
    <div class="px-4 py-4 border-t border-gray-200 mt-auto h-16">
      <div class="flex items-center h-full">
        <div class="flex-shrink-0 flex items-center justify-center">
          <div class="h-11 w-11 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base">
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

// Composables
const { isSuperAdmin } = useSuperAdmin()

// Dados do usuário (mockados)
const userName = ref('Administrador')
const userEmail = ref('admin@artemis.com')

// Estado do menu de configurações
const settingsExpanded = ref(false)

// Computados
const userInitials = computed(() => {
  return userName.value.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
})

const isSettingsActive = computed(() => {
  return route.path.startsWith('/configuracoes')
})

// Métodos
const isActive = (path) => {
  return route.path === path
}

const toggleSettings = () => {
  settingsExpanded.value = !settingsExpanded.value
}

// Auto-expandir configurações se estiver em uma rota de configuração
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/configuracoes')) {
    settingsExpanded.value = true
  }
}, { immediate: true })
</script>