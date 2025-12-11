<template>
  <div class="w-full md:w-2/6 lg:w-2/6 bg-white border-r border-gray-200 scrollbar-permanent">
    <!-- Cabeçalho da lista de contatos -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Conversas</h2>
        
        <!-- Dropdown de Caixa de Entrada -->
        <div class="relative ml-3">
          <button
            @click="toggleCaixaEntradaDropdown"
            class="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Selecionar caixa de entrada"
          >
            <!-- Ícone de caixa de entrada -->
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <span>{{ selectedCaixaEntradaName }}</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showCaixaEntradaDropdown"
            v-click-outside="closeCaixaEntradaDropdown"
            class="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div class="p-3">
              <p class="text-sm font-medium text-gray-900 mb-3">Selecionar Caixa de Entrada</p>

              <!-- Barra de Pesquisa -->
              <div class="mb-3">
                <input
                  v-model="searchCaixaEntrada"
                  type="text"
                  placeholder="Pesquisar caixa de entrada..."
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <!-- Lista de Caixas de Entrada -->
              <div class="max-h-60 overflow-y-auto">
                <div class="space-y-1">
                  <button
                    v-for="caixa in filteredCaixaEntradaOptions"
                    :key="caixa.value"
                    @click="selectCaixaEntrada(caixa.value)"
                    :class="[
                      'w-full px-3 py-2 text-left text-sm rounded-md transition-colors duration-200 flex items-center justify-between',
                      selectedCaixaEntrada === caixa.value
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    ]"
                  >
                    <span>{{ caixa.label }}</span>
                    <span v-if="caixa.count > 0" class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {{ caixa.count }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de pesquisa -->
      <div class="flex space-x-2">
        <div class="relative flex-1">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Buscar contatos..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
        <!-- Botão de filtro com dropdown -->
        <div class="relative">
          <button
            @click="toggleFilterDropdown"
            :class="[
              'px-4 py-2 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 flex items-center space-x-2',
              filterOptions.unreadOnly || filterOptions.selectedTags.length > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600'
            ]"
            title="Filtrar contatos"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            <span v-if="filterOptions.unreadOnly || filterOptions.selectedTags.length > 0" class="text-xs font-medium">
              {{ (filterOptions.unreadOnly ? 1 : 0) + filterOptions.selectedTags.length }}
            </span>
          </button>

          <!-- Dropdown de opções de filtro -->
          <div
            v-if="showFilterDropdown"
            v-click-outside="closeFilterDropdown"
            class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div class="p-4">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Filtrar Contatos</h3>

              <!-- Filtro de mensagens não lidas -->
              <div class="mb-4">
                <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    v-model="filterOptions.unreadOnly"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700">Apenas mensagens não lidas</span>
                </label>
              </div>

              <!-- Filtro por tags -->
              <div class="mb-4">
                <p class="text-sm font-medium text-gray-700 mb-2">Filtrar por tags:</p>
                <div class="space-y-1 max-h-40 scrollbar-always-visible border border-gray-200 rounded">
                  <label
                    v-for="tag in availableTags"
                    :key="tag"
                    class="flex items-center cursor-pointer hover:bg-gray-50 p-2"
                  >
                    <input
                      type="checkbox"
                      :value="tag"
                      v-model="filterOptions.selectedTags"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700">{{ tag }}</span>
                  </label>
                </div>
              </div>

              <!-- Botões de ação -->
              <div class="flex justify-between pt-3 border-t border-gray-200">
                <button
                  @click="clearFilters"
                  class="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 hover:bg-gray-100 rounded"
                >
                  Limpar filtros
                </button>
                <button
                  @click="applyFilters"
                  class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navbar de Status -->
      <div class="mt-3">
        <div class="bg-gray-100 p-1 rounded-lg">
          <nav class="flex space-x-1" aria-label="Status dos atendimentos">
            <button
              v-for="status in statusOptions"
              :key="status.value"
              @click="selectedStatus = status.value"
              :class="[
                'flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors duration-200 flex items-center justify-center',
                selectedStatus === status.value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              ]"
            >
              <span v-if="status.count !== undefined">
                {{ status.label }} ({{ status.count }})
              </span>
              <span v-else>
                {{ status.label }}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Lista de contatos -->
    <div class="space-y-3 p-3">
      <!-- Estado de loading -->
      <div v-if="props.loading" class="flex items-center justify-center py-8">
        <div class="text-center">
          <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-600 text-sm">Carregando atendimentos...</p>
        </div>
      </div>

      <!-- Estado de erro -->
      <div v-else-if="props.error" class="flex items-center justify-center py-8">
        <div class="text-center">
          <svg class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-red-600 text-sm">{{ props.error }}</p>
        </div>
      </div>

      <!-- Lista vazia -->
      <div v-else-if="!props.loading && !props.error && filteredContacts.length === 0" class="flex items-center justify-center py-8">
        <div class="text-center">
          <svg class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <p class="text-gray-500 text-sm">Nenhum atendimento encontrado</p>
        </div>
      </div>

      <!-- Lista de contatos -->
      <div
        v-for="contact in filteredContacts"
        v-show="!props.loading && !props.error"
        :key="contact.id"
        :class="[
          'p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 hover:shadow-md transition-all duration-200',
          selectedContactId === contact.id ? 'bg-blue-50 border-blue-500 shadow-sm' : ''
        ]"
      >
        <div @click="$emit('select-contact', contact)" class="cursor-pointer">
          <div class="flex items-start space-x-3">
            <!-- Avatar -->
            <div class="flex-shrink-0 relative">
              <div class="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {{ getInitials(contact.name) }}
              </div>

              <!-- Indicador de mensagens não lidas -->
              <div
                v-if="contact.unreadCount > 0"
                class="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
              >
                {{ contact.unreadCount > 9 ? '9+' : contact.unreadCount }}
              </div>
            </div>

            <!-- Informações do contato -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-900 truncate">
                  {{ contact.name }}
                </h3>
                <span class="text-xs text-gray-500">
                  {{ formatTime(contact.lastMessageTime) }}
                </span>
              </div>

              <p class="text-sm text-gray-600 mt-1">
                {{ formatPhone(contact.phone) }}
              </p>

              <!-- Última mensagem -->
              <p class="text-sm text-gray-500 mt-1 truncate">
                {{ contact.lastMessage }}
              </p>

              <!-- Tags e Botão Atribuir -->
              <div class="flex items-center justify-between mt-2">
                <!-- Tags -->
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(tag, index) in contact.tags"
                    :key="typeof tag === 'object' ? tag.id : tag"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                    :class="typeof getTagColor(tag) === 'string' ? getTagColor(tag) : ''"
                    :style="typeof getTagColor(tag) === 'object' ? getTagColor(tag) : {}"
                  >
                    {{ getTagName(tag) }}
                  </span>
                </div>
                
                <!-- Botão Atribuir a Mim (apenas na aba aguardando) -->
                <button
                  v-if="selectedStatus === 'aguardando'"
                  @click.stop="$emit('assign-to-me', contact)"
                  class="ml-2 flex-shrink-0 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center space-x-1"
                  title="Atribuir este atendimento a mim"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Atribuir a mim</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  contacts: {
    type: Array,
    required: true
  },
  selectedContactId: {
    type: [String, Number],
    default: null
  },
  availableTags: {
    type: Array,
    default: () => []
  },
  caixasEntradaOptions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  selectedInboxId: {
    type: String,
    default: null
  },
  serverCounts: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select-contact', 'assign-to-me', 'select-inbox'])

const searchTerm = ref('')
const selectedStatus = ref('todos')
const selectedCaixaEntrada = ref(null) // null = aguardando carregar, ou UUID específico
const showCaixaEntradaDropdown = ref(false)
const searchCaixaEntrada = ref('')
const showFilterDropdown = ref(false)
const filterOptions = ref({
  unreadOnly: false,
  selectedTags: []
})

// Opções de status com contagens
const statusOptions = computed(() => {
  // Se tivermos counts vindos do servidor, usamos eles
  if (props.serverCounts) {
    return [
      { label: 'Minhas', value: 'ativo', count: props.serverCounts.ativo || 0 },
      { label: 'Aguardando', value: 'aguardando', count: props.serverCounts.aguardando || 0 },
      { label: 'Todos', value: 'todos', count: props.serverCounts.todos || 0 }
    ]
  }

  // Fallback para cálculo local (caso API antiga ou erro)
  if (!props.contacts || !Array.isArray(props.contacts)) {
    return [
      { label: 'Minhas', value: 'ativo', count: 0 },
      { label: 'Aguardando', value: 'aguardando', count: 0 },
      { label: 'Todos', value: 'todos', count: 0 }
    ]
  }

  const statusCounts = {
    todos: props.contacts.length,
    aguardando: props.contacts.filter(c => c.status === 'aguardando').length,
    ativo: props.contacts.filter(c => c.status === 'ativo').length,
    concluido: props.contacts.filter(c => c.status === 'concluido').length
  }

  return [
    { label: 'Minhas', value: 'ativo', count: statusCounts.ativo },
    { label: 'Aguardando', value: 'aguardando', count: statusCounts.aguardando },
    { label: 'Todos', value: 'todos', count: statusCounts.todos }
  ]
})

// Computed para obter o nome da caixa de entrada selecionada para exibição
const selectedCaixaEntradaName = computed(() => {
  // Tentar encontrar a caixa selecionada nas opções
  const selectedInbox = props.caixasEntradaOptions.find(caixa => caixa.value === selectedCaixaEntrada.value)
  if (selectedInbox) {
    return selectedInbox.label
  }

  // Se não encontrou (pode ser null ou inválido), verificar casos especiais
  
  // Se existe a opção de "Nenhuma disponível" (array vazio de inboxes), retornar ela
  const noneOption = props.caixasEntradaOptions.find(c => c.value === 'none')
  if (noneOption) {
    return noneOption.label
  }

  // Se estiver carregando
  if (props.loading || props.caixasEntradaOptions.some(c => c.value === 'loading')) {
    return 'Carregando...'
  }

  return 'Selecione uma caixa'
})

// Computed para filtrar caixas de entrada no dropdown
const filteredCaixaEntradaOptions = computed(() => {
  if (!searchCaixaEntrada.value) {
    return props.caixasEntradaOptions || []
  }

  const search = searchCaixaEntrada.value.toLowerCase()
  return (props.caixasEntradaOptions || []).filter(caixa =>
    caixa.label && caixa.label.toLowerCase().includes(search)
  )
})

// Filtrar contatos
const filteredContacts = computed(() => {
  if (!props.contacts || !Array.isArray(props.contacts)) {
    return []
  }

  let filtered = props.contacts.filter(contact => contact != null)

  // Filtrar por caixa de entrada (apenas se houver uma selecionada e não for 'all')
  if (selectedCaixaEntrada.value && selectedCaixaEntrada.value !== 'all' && selectedCaixaEntrada.value !== 'none') {
    filtered = filtered.filter(contact =>
      contact.caixa_entrada === selectedCaixaEntrada.value
    )
  }
  // Se for 'all', não filtra por caixa (mostra todas)

  // Filtrar por status
  if (selectedStatus.value !== 'todos') {
    filtered = filtered.filter(contact =>
      contact.status === selectedStatus.value
    )
  }

  // Filtrar por termo de pesquisa
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(contact =>
      (contact.name && contact.name.toLowerCase().includes(search)) ||
      (contact.phone && contact.phone.includes(search)) ||
      (contact.lastMessage && contact.lastMessage.toLowerCase().includes(search)) ||
      (contact.tags && Array.isArray(contact.tags) &&
       contact.tags.some(tag => tag && tag.toLowerCase().includes(search)))
    )
  }

  // Aplicar filtros avançados
  if (filterOptions.value.unreadOnly) {
    filtered = filtered.filter(contact =>
      contact.unreadCount > 0
    )
  }

  if (filterOptions.value.selectedTags && Array.isArray(filterOptions.value.selectedTags) && filterOptions.value.selectedTags.length > 0) {
    filtered = filtered.filter(contact =>
      contact.tags && Array.isArray(contact.tags) &&
      filterOptions.value.selectedTags.some(tag => contact.tags.includes(tag))
    )
  }

  return filtered
})

// Funções de dropdown
const toggleCaixaEntradaDropdown = () => {
  if (showFilterDropdown.value) {
    showFilterDropdown.value = false
  }
  showCaixaEntradaDropdown.value = !showCaixaEntradaDropdown.value
}

const closeCaixaEntradaDropdown = () => {
  showCaixaEntradaDropdown.value = false
}

const selectCaixaEntrada = (value) => {
  selectedCaixaEntrada.value = value
  showCaixaEntradaDropdown.value = false
  searchCaixaEntrada.value = ''
  emit('select-inbox', value)
}

const toggleFilterDropdown = () => {
  if (showCaixaEntradaDropdown.value) {
    showCaixaEntradaDropdown.value = false
  }
  showFilterDropdown.value = !showFilterDropdown.value
}

const closeFilterDropdown = () => {
  showFilterDropdown.value = false
}

const clearFilters = () => {
  filterOptions.value = {
    unreadOnly: false,
    selectedTags: []
  }
  showFilterDropdown.value = false
}

const applyFilters = () => {
  showFilterDropdown.value = false
}

// Funções utilitárias
const getInitials = (name) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

const formatTime = (date) => {
  if (!date) return 'sem data'

  // Converter string para Date se necessário
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Validar se é uma data válida
  if (isNaN(dateObj.getTime())) return 'data inválida'

  const now = new Date()
  const diff = now - dateObj
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}m`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days}d`

  return dateObj.toLocaleDateString('pt-BR')
}

const getTagColor = (tag) => {
  // Se tag for um objeto com cor (nova estrutura), usar a cor do banco
  if (typeof tag === 'object' && tag.cor) {
    return {
      backgroundColor: tag.cor + '20', // Adicionar transparência
      color: tag.cor,
      borderColor: tag.cor
    }
  }

  // Se tag for string (antiga estrutura) ou não tiver cor, usar cores padrão
  const colors = {
    'Prioridade': 'bg-red-100 text-red-800',
    'VIP': 'bg-purple-100 text-purple-800',
    'Resolvido': 'bg-green-100 text-green-800',
    'Entrega': 'bg-blue-100 text-blue-800',
    'Urgente': 'bg-orange-100 text-orange-800',
    'Novo Cliente': 'bg-indigo-100 text-indigo-800'
  }

  return colors[tag] || 'bg-gray-100 text-gray-800'
}

const getTagName = (tag) => {
  // Extrair nome da tag (se for objeto ou string)
  return typeof tag === 'object' ? tag.nome : tag
}

// Watcher para selecionar automaticamente a primeira inbox quando carregar
watch(() => props.caixasEntradaOptions, (newOptions) => {
  if (newOptions && newOptions.length > 0 && !selectedCaixaEntrada.value) {
    // Tentar selecionar "Todas" (valor 'all') se existir
    const allOption = newOptions.find(c => c.value === 'all')
    if (allOption) {
      selectedCaixaEntrada.value = 'all'
      return
    }

    // Se não tiver "Todas", tenta a primeira real
    const firstRealInbox = newOptions.find(caixa =>
      caixa.value !== 'loading' &&
      caixa.value !== 'none' &&
      !caixa.disabled
    )

    if (firstRealInbox) {
      selectedCaixaEntrada.value = firstRealInbox.value
    } else {
      // Se não encontrou inbox real, verificar se é o caso de "nenhuma disponível"
      const noneOption = newOptions.find(c => c.value === 'none')
      if (noneOption) {
        selectedCaixaEntrada.value = 'none'
      }
    }
  }
}, { immediate: true })

// Watcher para sincronizar com prop do parent
watch(() => props.selectedInboxId, (newInboxId) => {
  if (newInboxId !== selectedCaixaEntrada.value) {
    selectedCaixaEntrada.value = newInboxId
  }
}, { immediate: true })

// Controle de scrollbars
onMounted(() => {
  initScrollbars()
})

const initScrollbars = () => {
  const scrollElements = document.querySelectorAll('.scrollbar-permanent')

  scrollElements.forEach(element => {
    let scrollTimeout
    let isHoveringScrollbar = false

    const showScrollbar = () => {
      element.classList.add('scrollbar-visible')
      clearTimeout(scrollTimeout)
    }

    const hideScrollbar = () => {
      scrollTimeout = setTimeout(() => {
        if (!isHoveringScrollbar) {
          element.classList.remove('scrollbar-visible')
        }
      }, 1000)
    }

    const checkScrollbarHover = (event) => {
      const rect = element.getBoundingClientRect()
      const scrollbarZone = rect.right - 20

      if (event.clientX >= scrollbarZone) {
        isHoveringScrollbar = true
        showScrollbar()
      } else {
        isHoveringScrollbar = false
        hideScrollbar()
      }
    }

    element.addEventListener('mouseenter', showScrollbar)
    element.addEventListener('mouseleave', hideScrollbar)
    element.addEventListener('mousemove', checkScrollbarHover)
    element.addEventListener('scroll', () => {
      showScrollbar()
      hideScrollbar()
    })
    element.addEventListener('mouseleave', () => {
      isHoveringScrollbar = false
      hideScrollbar()
    })
  })
}
</script>

<style scoped>
/* Scrollbar permanente com visibilidade controlada */
.scrollbar-permanent {
  scrollbar-gutter: stable;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-permanent::-webkit-scrollbar {
  width: 8px;
  background: transparent;
}

.scrollbar-permanent::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.scrollbar-permanent::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.3s ease;
}

.scrollbar-permanent.scrollbar-visible::-webkit-scrollbar-thumb {
  background: #9ca3af;
  opacity: 1;
}

.scrollbar-permanent.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Para Firefox */
.scrollbar-permanent {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s ease;
}

.scrollbar-permanent.scrollbar-visible {
  scrollbar-color: #9ca3af transparent;
}

/* Garantir que o container sempre reserve espaço */
.scrollbar-permanent {
  overflow-y: scroll !important;
}

/* Scrollbar sempre visível para dropdowns */
.scrollbar-always-visible {
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.scrollbar-always-visible::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-always-visible::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.scrollbar-always-visible::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 3px;
}

.scrollbar-always-visible::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* Para Firefox */
.scrollbar-always-visible {
  scrollbar-width: thin;
  scrollbar-color: #6b7280 #f3f4f6;
}
</style>
