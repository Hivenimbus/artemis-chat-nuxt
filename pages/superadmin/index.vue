<template>
  <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <!-- Conteúdo principal -->
    <div class="text-center">
      <!-- Mensagem principal -->
      <div class="mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Em breve
        </h2>
        <h3 class="text-xl font-semibold text-gray-700 mb-6">
          Fale comigo
        </h3>
        <p class="text-gray-600 max-w-2xl mx-auto mb-8">
          O painel superadmin está em desenvolvimento. Em breve você terá acesso a ferramentas
          avançadas para gerenciamento do sistema, usuários, configurações globais e muito mais.
        </p>
      </div>

      <!-- Cards de funcionalidades -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Card 1 -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div class="h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-gray-900 mb-2">Gerenciamento de Usuários</h4>
          <p class="text-gray-600">Controle total sobre todos os usuários do sistema</p>
        </div>

        <!-- Card 2 -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div class="h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-gray-900 mb-2">Análises e Métricas</h4>
          <p class="text-gray-600">Dashboard completo com estatísticas do sistema</p>
        </div>

        <!-- Card 3 -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div class="h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
          <h4 class="text-lg font-semibold text-gray-900 mb-2">Configurações Globais</h4>
          <p class="text-gray-600">Ajustes avançados do sistema e integrações</p>
        </div>
      </div>

      <!-- Status de desenvolvimento -->
      <div class="mt-12 inline-flex items-center px-6 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <svg class="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span class="text-yellow-800 font-medium">Em desenvolvimento - Funcionalidades chegando em breve</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Middleware de proteção e layout
definePageMeta({
  layout: 'superadmin',
  middleware: 'superadmin'
})

// Meta tags da página
useHead({
  title: 'Painel Superadmin - Artemis',
  meta: [
    {
      name: 'description',
      content: 'Painel de administração restrita para superadministradores do Artemis Chat'
    }
  ]
})
</script>