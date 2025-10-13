<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Painel Superadmin</h1>
        <p class="text-gray-600 mb-6">Bem-vindo ao painel de administração do sistema.</p>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 class="text-lg font-semibold text-blue-900 mb-2">Status do Sistema</h2>
          <p class="text-blue-700">Esta área é restrita a superadministradores.</p>
        </div>

        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Estatísticas</h3>
            <p class="text-gray-600">Funcionalidades em desenvolvimento...</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Gerenciamento</h3>
            <p class="text-gray-600">Funcionalidades em desenvolvimento...</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Configurações</h3>
            <p class="text-gray-600">Funcionalidades em desenvolvimento...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Proteção de rota - apenas superadmin pode acessar
definePageMeta({
  middleware: 'superadmin-only'
})

useHead({
  title: 'Painel Superadmin - Artemis'
})
</script>