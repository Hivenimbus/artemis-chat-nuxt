<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Conteúdo principal -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Filtros e Ações -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-3">
                <div class="flex-1 max-w-lg">
                  <div class="relative">
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
                </div>
                <button class="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="mt-4 sm:mt-0">
              <button class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Novo Contato
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de Contatos em Cards -->
        <div class="p-4">
          <div class="space-y-3">
            <div 
              v-for="contact in filteredContacts" 
              :key="contact.id" 
              class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-center justify-between">
                <!-- Informações do Contato -->
                <div class="flex items-center flex-1 min-w-0">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {{ getInitials(contact.name) }}
                    </div>
                  </div>
                  
                  <div class="ml-4 flex-1 min-w-0">
                    <div class="flex items-center space-x-3">
                      <h3 class="text-base font-semibold text-gray-900 truncate">{{ contact.name }}</h3>
                      <span :class="getStatusClass(contact.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                        {{ getStatusText(contact.status) }}
                      </span>
                    </div>
                    <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        {{ contact.email }}
                      </span>
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        {{ formatPhone(contact.phone) }}
                      </span>
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ formatDate(contact.lastContact) }}
                      </span>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1">
                      <span v-for="tag in contact.tags" :key="tag" :class="getTagColor(tag)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Ações -->
                <div class="ml-6 flex items-center space-x-2">
                  <NuxtLink :to="`/atendimentos?contact=${contact.id}`" class="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </NuxtLink>
                  <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Dados mockados para demonstração
const contacts = ref([
  {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '11999999999',
    status: 'active',
    tags: ['VIP', 'Cliente'],
    lastContact: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '21988888888',
    status: 'pending',
    tags: ['Novo Lead'],
    lastContact: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '31977777777',
    status: 'active',
    tags: ['Cliente'],
    lastContact: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
  },
  {
    id: 4,
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '11966666666',
    status: 'inactive',
    tags: ['Inativo'],
    lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
  },
  {
    id: 5,
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@email.com',
    phone: '11955555555',
    status: 'active',
    tags: ['VIP', 'Empresa'],
    lastContact: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
  }
])

const searchTerm = ref('')
const statusFilter = ref('')

// Computados
const filteredContacts = computed(() => {
  let result = contacts.value

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    result = result.filter(contact =>
      contact.name.toLowerCase().includes(search) ||
      contact.email.toLowerCase().includes(search) ||
      contact.phone.includes(search)
    )
  }

  if (statusFilter.value) {
    result = result.filter(contact => contact.status === statusFilter.value)
  }

  return result
})

const activeContactsCount = computed(() =>
  contacts.value.filter(c => c.status === 'active').length
)

const pendingContactsCount = computed(() =>
  contacts.value.filter(c => c.status === 'pending').length
)

const vipContactsCount = computed(() =>
  contacts.value.filter(c => c.tags.includes('VIP')).length
)

// Métodos
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

const formatDate = (date) => {
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `Há ${days} dias`

  return date.toLocaleDateString('pt-BR')
}

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  const texts = {
    active: 'Ativo',
    pending: 'Pendente',
    inactive: 'Inativo'
  }
  return texts[status] || 'Desconhecido'
}

const getTagColor = (tag) => {
  const colors = {
    'VIP': 'bg-purple-100 text-purple-800',
    'Cliente': 'bg-blue-100 text-blue-800',
    'Novo Lead': 'bg-green-100 text-green-800',
    'Inativo': 'bg-red-100 text-red-800',
    'Empresa': 'bg-indigo-100 text-indigo-800'
  }
  return colors[tag] || 'bg-gray-100 text-gray-800'
}

// Meta tags da página
useHead({
  title: 'Contatos - Artemis',
  meta: [
    { name: 'description', content: 'Gerencie sua lista de contatos' }
  ]
})
</script>