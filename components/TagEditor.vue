<template>
  <div class="flex flex-wrap items-center gap-1">
    <!-- Tags atuais -->
    <span
      v-for="tag in currentTags"
      :key="typeof tag === 'object' ? tag.name : tag"
      :class="getTagClasses(tag)"
      :style="getTagStyle(tag)"
      class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium group relative"
    >
      {{ typeof tag === 'object' ? tag.name : tag }}
      <!-- Botão de remover tag (visível apenas no modo de edição) -->
      <button
        v-if="editing"
        @click.stop="removeTag(tag)"
        class="ml-1 text-current hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </span>

    <!-- Botão de adicionar tag (visível apenas no modo de edição) -->
    <button
      ref="addButtonRef"
      v-if="editing"
      @click="toggleDropdown"
      class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-300 border-dashed"
    >
      <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
      Adicionar
    </button>

    <!-- Botão de editar tags (agora com texto explícito) -->
    <button
      v-if="!editing"
      @click="$emit('toggle-edit')"
      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
      title="Editar tags"
    >
      <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
      Editar tag
    </button>

    <!-- Botão de sair do modo de edição (visível apenas no modo de edição) -->
    <button
      v-if="editing"
      @click="cancelEdit"
      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
      title="Concluir edição"
    >
      <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Concluir
    </button>
  </div>

  <!-- Dropdown Flutuante via Teleport -->
  <Teleport to="body">
    <div
      v-if="showDropdown && editing"
      v-click-outside="closeDropdown"
      class="fixed z-[60] bg-white border border-gray-200 rounded-lg shadow-lg"
      :style="{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`
      }"
    >
      <div class="p-2 max-h-48 overflow-y-auto">
        <div
          v-for="tag in allTagsWithStatus"
          :key="tag.name"
          class="flex items-center justify-between p-2 rounded cursor-pointer transition-colors"
          :class="[
            tag.isAdded
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'hover:bg-gray-50 text-gray-700'
          ]"
          @click="!tag.isAdded && addTag(tag.name)"
        >
          <span class="text-sm">{{ tag.name }}</span>
          <svg
            v-if="tag.isAdded"
            class="h-4 w-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <svg
            v-else
            class="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// Props
const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  availableTags: {
    type: Array,
    default: () => ['VIP', 'Cliente', 'Novo Lead', 'Empresa']
  },
  editing: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['toggle-edit', 'update-tags'])

// State
const showDropdown = ref(false)
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })
const addButtonRef = ref(null)
const currentTags = ref([...props.tags])

// Watch para sincronizar tags quando props mudam
watch(() => props.tags, (newTags) => {
  currentTags.value = [...newTags]
}, { deep: true })

// Watch para resetar quando o modo de edição muda
watch(() => props.editing, (isEditing) => {
  if (!isEditing) {
    currentTags.value = [...props.tags]
    closeDropdown()
  }
})

// Listener para redimensionamento e scroll
onMounted(() => {
  window.addEventListener('resize', () => {
    if (showDropdown.value) {
      calculateDropdownPosition()
    }
  })

  window.addEventListener('scroll', () => {
    if (showDropdown.value) {
      closeDropdown() // Fechar dropdown no scroll para evitar posicionamento incorreto
    }
  }, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateDropdownPosition)
  window.removeEventListener('scroll', closeDropdown)
})

// Todas as tags disponíveis com status de seleção
const allTagsWithStatus = computed(() => {
  return props.availableTags.map(tag => {
    const tagName = typeof tag === 'object' ? tag.name : tag
    const isAdded = currentTags.value.some(currentTag => {
      const currentTagName = typeof currentTag === 'object' ? currentTag.name : currentTag
      return currentTagName === tagName
    })

    return {
      name: tagName,
      isAdded
    }
  })
})

// Methods
const getTagHex = (tag) => {
  if (typeof tag === 'object' && tag.color) return tag.color
  
  const tagName = typeof tag === 'object' ? tag.name : tag
  const availableTag = props.availableTags.find(t =>
    typeof t === 'object' ? t.name === tagName : t === tagName
  )
  
  return availableTag && typeof availableTag === 'object' ? availableTag.color : null
}

const getContrastColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return null
  
  // Remove # if present
  const hex = hexColor.replace('#', '')
  
  // Check for valid hex length
  if (hex.length !== 6) return null
  
  // Parse r, g, b
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate brightness (YIQ formula)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  
  // Return black or white based on brightness
  return yiq >= 128 ? '#1F2937' : '#FFFFFF' // gray-800 or white
}

const getTagStyle = (tag) => {
  const hex = getTagHex(tag)
  
  // Check if it's a mapped color (we'll use classes for those)
  if (hex && isMappedColor(hex)) {
    return {}
  }
  
  // For unmapped colors, return inline style
  if (hex && hex.startsWith('#')) {
    return {
      backgroundColor: hex,
      color: getContrastColor(hex) || '#1F2937'
    }
  }
  
  return {}
}

const isMappedColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return false
  const map = getColorMap()
  return !!map[hexColor.toUpperCase()]
}

const getColorMap = () => ({
  '#FF0000': 'bg-red-100 text-red-800',     // Vermelho
  '#FF4500': 'bg-orange-100 text-orange-800', // Laranja
  '#FFD700': 'bg-yellow-100 text-yellow-800', // Amarelo
  '#32CD32': 'bg-green-100 text-green-800',   // Verde
  '#0000FF': 'bg-blue-100 text-blue-800',     // Azul
  '#800080': 'bg-purple-100 text-purple-800', // Roxo
  '#FFC0CB': 'bg-pink-100 text-pink-800',     // Rosa
  '#808080': 'bg-gray-100 text-gray-800',     // Cinza
  '#000000': 'bg-gray-900 text-white',        // Preto
  '#FFFFFF': 'bg-white text-gray-900 border border-gray-300', // Branco
  '#8B5CF6': 'bg-purple-100 text-purple-800', // Roxo (VIP)
  '#3B82F6': 'bg-blue-100 text-blue-800',     // Azul (Cliente)
  '#10B981': 'bg-green-100 text-green-800',   // Verde (Novo Lead)
  '#6366F1': 'bg-indigo-100 text-indigo-800', // Índigo (Empresa)
  '#EF4444': 'bg-red-500 text-white',         // Vermelho (Teste 2) - Adicionado especificamente
  '#6B7280': 'bg-gray-100 text-gray-800'      // Cinza padrão
})

const getTagClasses = (tag) => {
  const hex = getTagHex(tag)
  
  // If we have a mapped color, use it
  if (hex) {
    const map = getColorMap()
    const classes = map[hex.toUpperCase()]
    if (classes) return classes
    
    // If we have a hex but no map, we're using styles, so no specific color class needed
    // but we return nothing here and let style take over
    if (hex.startsWith('#')) return ''
  }

  // Fallback for legacy string tags or when no color is found
  const tagName = typeof tag === 'object' ? tag.name : tag
  const colors = {
    'VIP': 'bg-purple-100 text-purple-800',
    'Cliente': 'bg-blue-100 text-blue-800',
    'Novo Lead': 'bg-green-100 text-green-800',
    'Empresa': 'bg-indigo-100 text-indigo-800'
  }
  return colors[tagName] || 'bg-gray-100 text-gray-800'
}

// Mantido para compatibilidade se usado em outros lugares, mas redireciona para a nova lógica
const getTagColor = (tag) => getTagClasses(tag)

// Converter cor hex para classes Tailwind (versão legada, agora usa o mapa centralizado)
const getTailwindColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) {
    return 'bg-gray-100 text-gray-800'
  }
  
  const map = getColorMap()
  return map[hexColor.toUpperCase()] || 'bg-gray-100 text-gray-800'
}

const calculateDropdownPosition = () => {
  if (!addButtonRef.value) return

  const rect = addButtonRef.value.getBoundingClientRect()

  // Fallbacks para scroll em diferentes contextos
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
  const scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0

  // Coordenadas iniciais
  let top = rect.bottom + scrollY + 4
  let left = rect.left + scrollX
  let width = Math.max(200, rect.width)

  // Validações para evitar que o dropdown saia da tela
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth
  const dropdownHeight = 200 // Altura estimada do dropdown
  const dropdownWidth = width

  // Ajustar posição vertical se o dropdown ficar abaixo da tela
  if (top + dropdownHeight > scrollY + windowHeight) {
    // Tentar posicionar acima do botão
    top = rect.top + scrollY - dropdownHeight - 4
    // Se ainda não couber, posicionar no topo da janela
    if (top < scrollY) {
      top = scrollY + 4
    }
  }

  // Ajustar posição horizontal se o dropdown ficar fora da tela
  if (left + dropdownWidth > scrollX + windowWidth) {
    left = scrollX + windowWidth - dropdownWidth - 4
    if (left < scrollX) {
      left = scrollX + 4
    }
  }

  dropdownPosition.value = {
    top,
    left,
    width
  }
}

const toggleDropdown = () => {
  if (!showDropdown.value) {
    // Recalcular posição toda vez que abrir o dropdown
    nextTick(() => {
      calculateDropdownPosition()
    })
  }
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

const addTag = (tag) => {
  // Normalizar nome da tag para comparação
  const tagName = typeof tag === 'object' ? tag.name : tag
  const tagExists = currentTags.value.some(currentTag => {
    const currentTagName = typeof currentTag === 'object' ? currentTag.name : currentTag
    return currentTagName === tagName
  })

  if (!tagExists) {
    // Encontrar a tag completa com cor se disponível
    const fullTag = typeof tag === 'object' ? tag : props.availableTags.find(t =>
      typeof t === 'object' ? t.name === tag : t === tag
    )

    currentTags.value.push(fullTag || tagName)
    // Fechar dropdown automaticamente após adicionar uma tag
    closeDropdown()
    // Auto-save: emitir atualização para o pai
    emit('update-tags', [...currentTags.value])
    // Sair do modo de edição após salvar
    emit('toggle-edit')
  }
}

const removeTag = (tagToRemove) => {
  const tagNameToRemove = typeof tagToRemove === 'object' ? tagToRemove.name : tagToRemove
  const index = currentTags.value.findIndex(tag => {
    const tagName = typeof tag === 'object' ? tag.name : tag
    return tagName === tagNameToRemove
  })

  if (index > -1) {
    currentTags.value.splice(index, 1)
    // Auto-save: emitir atualização para o pai
    emit('update-tags', [...currentTags.value])
    // Sair do modo de edição após salvar
    emit('toggle-edit')
  }
}

const cancelEdit = () => {
  currentTags.value = [...props.tags]
  emit('toggle-edit')
}
</script>

<style scoped>
/* Estilos específicos se necessário */
</style>
