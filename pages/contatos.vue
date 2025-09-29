<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Cabeçalho da página -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <h1 class="text-2xl font-bold text-gray-900">Contatos</h1>
          <p class="mt-1 text-sm text-gray-600">Gerencie sua lista de contatos</p>
        </div>
      </div>
    </div>

    <!-- Conteúdo principal -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total de Contatos</dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">{{ contacts.length }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Ativos</dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">{{ activeContactsCount }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Pendentes</dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">{{ pendingContactsCount }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">VIP</dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">{{ vipContactsCount }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros e Ações -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-4">
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

                <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="pending">Pendentes</option>
                  <option value="inactive">Inativos</option>
                </select>
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

        <!-- Lista de Contatos -->
        <div class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Contato
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="contact in filteredContacts" :key="contact.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {{ getInitials(contact.name) }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ contact.name }}</div>
                      <div class="text-sm text-gray-500">{{ contact.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatPhone(contact.phone) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(contact.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(contact.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="tag in contact.tags" :key="tag" :class="getTagColor(tag)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                      {{ tag }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(contact.lastContact) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <NuxtLink :to="`/atendimentos?contact=${contact.id}`" class="text-indigo-600 hover:text-indigo-900">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </NuxtLink>
                    <button class="text-gray-400 hover:text-gray-600">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button class="text-gray-400 hover:text-gray-600">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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