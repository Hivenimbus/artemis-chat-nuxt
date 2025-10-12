<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="flex justify-center mb-6">
          <div class="h-20 w-20 bg-red-600 rounded-full flex items-center justify-center">
            <svg class="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          Painel Superadmin
        </h1>

        <p class="text-xl text-gray-600 mb-2">
          Área restrita para administradores do sistema
        </p>

        <div class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          Acesso autorizado
        </div>
      </div>

      <!-- Card principal -->
      <div class="bg-white shadow-xl rounded-lg overflow-hidden">
        <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8">
          <h2 class="text-2xl font-bold text-white text-center">
            Em breve
          </h2>
        </div>

        <div class="p-8 text-center">
          <div class="mb-8">
            <svg class="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>

          <h3 class="text-xl font-semibold text-gray-900 mb-4">
            Fale comigo
          </h3>

          <p class="text-gray-600 mb-8 max-w-2xl mx-auto">
            O painel superadmin está em desenvolvimento. Em breve você terá acesso a ferramentas
            avançadas para gerenciamento do sistema, usuários, configurações globais e muito mais.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <!-- Card 1 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h4 class="font-medium text-gray-900 mb-2">Gerenciamento de Usuários</h4>
              <p class="text-sm text-gray-600">Controle total sobre todos os usuários do sistema</p>
            </div>

            <!-- Card 2 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 class="font-medium text-gray-900 mb-2">Análises e Métricas</h4>
              <p class="text-sm text-gray-600">Dashboard completo com estatísticas do sistema</p>
            </div>

            <!-- Card 3 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h4 class="font-medium text-gray-900 mb-2">Configurações Globais</h4>
              <p class="text-sm text-gray-600">Ajustes avançados do sistema e integrações</p>
            </div>
          </div>

          <div class="mt-8 text-sm text-gray-500">
            <p>Painel Superadmin v1.0 - Artemis Chat</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Middleware de proteção
definePageMeta({
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