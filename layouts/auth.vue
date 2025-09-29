<template>
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
</template>

<script setup>
// Meta tags para páginas de autenticação
useHead({
  titleTemplate: '%s - Artemis',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})
</script> 