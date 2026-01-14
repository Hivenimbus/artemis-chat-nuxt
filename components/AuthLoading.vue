<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <!-- Spinner de loading -->
      <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Texto de carregamento -->
      <h2 class="text-xl font-semibold text-gray-700 mb-2">
        Verificando autenticação...
      </h2>
      <p class="text-gray-500 text-sm">
        Aguarde um instante
      </p>
    </div>
  </div>
</template>

<script setup>
// Meta tags para página de loading
useHead({
  title: 'Carregando - MULTICONEX',
  meta: [
    { name: 'description', content: 'Verificando estado de autenticação' }
  ]
})
</script>

<style scoped>
/* Garante que o background ocupe a tela inteira */
body {
  margin: 0;
  padding: 0;
}
</style>