<template>
  <div class="h-full bg-gray-50">
    <!-- Conteúdo principal -->
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8 flex flex-col">
      <!-- Mensagem de Sucesso -->
      <div
        v-if="updateSuccess"
        class="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-200"
      >
        <div class="flex items-center">
          <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="text-green-800 font-medium">{{ updateSuccess }}</span>
        </div>
      </div>

      <!-- Filtros e Ações -->
      <div class="bg-white shadow rounded-lg mb-4 sm:mb-6 flex-shrink-0 flex flex-col h-full">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div class="flex-1 max-w-lg">
                  <div class="relative">
                    <input
                      type="text"
                      v-model="searchTerm"
                      placeholder="Buscar contatos..."
                      class="w-full pl-10 pr-4 py-2 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <button class="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="mt-0 sm:mt-0">
              <button class="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg class="-ml-1 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <span class="hidden sm:inline">Novo Contato</span>
                <span class="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de Contatos em Cards -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Container da lista com scroll customizado -->
          <div class="flex-1 p-2 sm:p-4 custom-scrollbar-container rounded-b-lg">
            <div class="space-y-2 sm:space-y-3">
              <div
                v-for="contact in paginatedContacts"
                :key="contact.id"
                class="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mr-2 sm:mr-0 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-center justify-between">
                  <!-- Informações do Contato -->
                  <div class="flex items-start sm:items-center flex-1 min-w-0 pr-2">
                    <div class="flex-shrink-0">
                      <div class="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                        {{ getInitials(contact.name) }}
                      </div>
                    </div>

                    <div class="ml-3 sm:ml-4 flex-1 min-w-0">
                      <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                        <h3 class="text-sm sm:text-base font-semibold text-gray-900 truncate">{{ contact.name }}</h3>
                        <span :class="getStatusClass(contact.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full self-start sm:self-auto">
                          {{ getStatusText(contact.status) }}
                        </span>
                      </div>
                      <div class="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                        <span class="flex items-center truncate">
                          <svg class="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                          <span class="truncate">{{ contact.email }}</span>
                        </span>
                        <span class="flex items-center">
                          <svg class="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                          </svg>
                          {{ formatPhone(contact.phone) }}
                        </span>
                        <span class="flex items-center">
                          <svg class="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {{ formatDate(contact.lastContact) }}
                        </span>
                      </div>
                      <div class="mt-2 flex flex-wrap gap-1">
                        <span v-for="tag in contact.tags" :key="tag" :class="getTagColor(tag)" class="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Ações -->
                  <div class="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <NuxtLink :to="`/atendimentos?contact=${contact.id}`" class="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors">
                      <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </NuxtLink>
                    <button
                      @click="toggleContactExpansion(contact.id)"
                      class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <svg
                        :class="[
                          'h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200',
                          expandedContacts.includes(contact.id) ? 'rotate-180' : ''
                        ]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Formulário de Edição (Expansível) -->
                <div
                  :class="[
                    'form-expansion-container',
                    expandedContacts.includes(contact.id) ? 'expanded' : 'collapsed'
                  ]"
                >
                  <form @submit.prevent="updateContact(contact.id)" class="space-y-4">
                    <!-- Primeiro Grid: Nome e Sobrenome -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Nome -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Nome
                        </label>
                        <input
                          v-model="contact.name"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <!-- Sobrenome -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Sobrenome
                        </label>
                        <input
                          v-model="contact.lastName"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <!-- Segundo Grid: Email e Telefone -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Email -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          v-model="contact.email"
                          type="email"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <!-- Telefone -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          v-model="contact.phone"
                          type="tel"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <!-- Terceiro Grid: Cidade e País -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Cidade -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Cidade
                        </label>
                        <input
                          v-model="contact.city"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <!-- País -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          País
                        </label>
                        <input
                          v-model="contact.country"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <!-- Quarto Grid: Biografia e Empresa -->
                    <div class="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Biografia -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Biografia
                        </label>
                        <input
                          v-model="contact.biography"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <!-- Empresa -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Empresa
                        </label>
                        <input
                          v-model="contact.company"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <!-- Botão de Atualizar -->
                    <div class="form-field flex justify-end">
                      <button
                        type="submit"
                        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Atualizar Contato
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <!-- Paginação (fora do container de scroll) -->
          <div class="border-t border-gray-200 bg-white px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 flex-shrink-0 rounded-b-lg">
            <!-- Informações de contatos exibidos -->
            <div class="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              <span v-if="filteredContacts.length > 0">
                Mostrando {{ startItem }}-{{ endItem }} de {{ filteredContacts.length }} contatos
              </span>
              <span v-else>
                Nenhum contato encontrado
              </span>
            </div>

            <!-- Controles de paginação -->
            <div class="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
              <!-- Botão Anterior -->
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <svg class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                <span class="hidden sm:inline">Anterior</span>
                <span class="sm:hidden">◀</span>
              </button>

              <!-- Números das páginas -->
              <div class="flex items-center space-x-1">
                <button
                  v-for="page in Math.min(totalPages, 5)"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md',
                    currentPage === page
                      ? 'bg-indigo-600 text-white border border-indigo-600'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>

                <!-- Indicador de páginas extras -->
                <span v-if="totalPages > 5" class="text-gray-500 text-xs sm:text-sm px-1 sm:px-2">...</span>
              </div>

              <!-- Botão Próximo -->
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <span class="hidden sm:inline">Próximo</span>
                <span class="sm:hidden">▶</span>
                <svg class="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
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
    lastName: 'Silva',
    city: 'São Paulo',
    country: 'Brasil',
    biography: 'Gerente de projetos com mais de 10 anos de experiência em tecnologia.',
    company: 'Tech Solutions Ltda'
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '21988888888',
    status: 'pending',
    tags: ['Novo Lead'],
    lastContact: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    lastName: 'Santos',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    biography: 'Especialista em marketing digital e redes sociais.',
    company: 'Marketing Digital Agency'
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '31977777777',
    status: 'active',
    tags: ['Cliente'],
    lastContact: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
    lastName: 'Oliveira',
    city: 'Belo Horizonte',
    country: 'Brasil',
    biography: 'Desenvolvedor full-stack com foco em aplicações web.',
    company: 'DevWorks'
  },
  {
    id: 4,
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '11966666666',
    status: 'inactive',
    tags: ['Inativo'],
    lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
    lastName: 'Costa',
    city: 'Salvador',
    country: 'Brasil',
    biography: 'Designer gráfico com experiência em branding.',
    company: 'Creative Studio'
  },
  {
    id: 5,
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@email.com',
    phone: '11955555555',
    status: 'active',
    tags: ['VIP', 'Empresa'],
    lastContact: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
    lastName: 'Ferreira',
    city: 'Brasília',
    country: 'Brasil',
    biography: 'Consultor de negócios especializado em transformação digital.',
    company: 'Business Consulting Group'
  },
  {
    id: 6,
    name: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    phone: '11944444444',
    status: 'active',
    tags: ['Cliente'],
    lastContact: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
    lastName: 'Lima',
    city: 'Porto Alegre',
    country: 'Brasil',
    biography: 'Advogada especializada em direito empresarial.',
    company: 'Law & Associates'
  },
  {
    id: 7,
    name: 'Roberto Almeida',
    email: 'roberto.almeida@email.com',
    phone: '11933333333',
    status: 'pending',
    tags: ['Novo Lead', 'Empresa'],
    lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
    lastName: 'Almeida',
    city: 'Curitiba',
    country: 'Brasil',
    biography: 'Engenheiro de software com experiência em cloud computing.',
    company: 'CloudTech Solutions'
  },
  {
    id: 8,
    name: 'Juliana Martins',
    email: 'juliana.martins@email.com',
    phone: '11922222222',
    status: 'active',
    tags: ['VIP'],
    lastContact: new Date(Date.now() - 45 * 60 * 1000), // 45 minutos atrás
    lastName: 'Martins',
    city: 'Recife',
    country: 'Brasil',
    biography: 'Gerente de produtos especializada em SaaS.',
    company: 'Product Innovations Inc'
  },
  {
    id: 9,
    name: 'Lucas Pereira',
    email: 'lucas.pereira@email.com',
    phone: '11911111111',
    status: 'active',
    tags: ['Cliente'],
    lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    lastName: 'Pereira',
    city: 'Fortaleza',
    country: 'Brasil',
    biography: 'Analista financeiro com experiência em investimentos.',
    company: 'Financial Services Ltd'
  },
  {
    id: 10,
    name: 'Camila Souza',
    email: 'camila.souza@email.com',
    phone: '11900000000',
    status: 'pending',
    tags: ['Novo Lead'],
    lastContact: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
    lastName: 'Souza',
    city: 'Manaus',
    country: 'Brasil',
    biography: 'Coordenadora de projetos sociais.',
    company: 'Community Development NGO'
  },
  {
    id: 11,
    name: 'Gustavo Mendes',
    email: 'gustavo.mendes@email.com',
    phone: '11999998888',
    status: 'active',
    tags: ['Empresa'],
    lastContact: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
    lastName: 'Mendes',
    city: 'São Paulo',
    country: 'Brasil',
    biography: 'CTO de empresa de tecnologia.',
    company: 'Innovation Tech'
  },
  {
    id: 12,
    name: 'Patricia Oliveira',
    email: 'patricia.oliveira@email.com',
    phone: '11999997777',
    status: 'inactive',
    tags: ['Inativo'],
    lastContact: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 dias atrás
    lastName: 'Oliveira',
    city: 'Campinas',
    country: 'Brasil',
    biography: 'Analista de sistemas.',
    company: 'Data Corp'
  },
  {
    id: 13,
    name: 'Ricardo Dias',
    email: 'ricardo.dias@email.com',
    phone: '11999996666',
    status: 'active',
    tags: ['VIP', 'Empresa'],
    lastContact: new Date(Date.now() - 90 * 60 * 1000), // 1.5 horas atrás
    lastName: 'Dias',
    city: 'São Paulo',
    country: 'Brasil',
    biography: 'Diretor executivo.',
    company: 'Executive Solutions'
  },
  {
    id: 14,
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    phone: '11999995555',
    status: 'pending',
    tags: ['Novo Lead', 'VIP'],
    lastContact: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 horas atrás
    lastName: 'Costa',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    biography: 'Consultora de negócios.',
    company: 'Business Strategy'
  },
  {
    id: 15,
    name: 'Bruno Santos',
    email: 'bruno.santos@email.com',
    phone: '11999994444',
    status: 'active',
    tags: ['Cliente'],
    lastContact: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    lastName: 'Santos',
    city: 'Belém',
    country: 'Brasil',
    biography: 'Gerente de vendas.',
    company: 'Sales Excellence'
  },
  {
    id: 16,
    name: 'Carolina Rocha',
    email: 'carolina.rocha@email.com',
    phone: '11999993333',
    status: 'active',
    tags: ['VIP'],
    lastContact: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
    lastName: 'Rocha',
    city: 'São Luís',
    country: 'Brasil',
    biography: 'CEO de startup.',
    company: 'Startup Innovations'
  },
  {
    id: 17,
    name: 'Felipe Fernandes',
    email: 'felipe.fernandes@email.com',
    phone: '11999992222',
    status: 'pending',
    tags: ['Novo Lead'],
    lastContact: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 horas atrás
    lastName: 'Fernandes',
    city: 'Goiânia',
    country: 'Brasil',
    biography: 'Desenvolvedor mobile.',
    company: 'Mobile Solutions'
  },
  {
    id: 18,
    name: 'Tatiana Alves',
    email: 'tatiana.alves@email.com',
    phone: '11999991111',
    status: 'active',
    tags: ['Cliente', 'Empresa'],
    lastContact: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 dias atrás
    lastName: 'Alves',
    city: 'Florianópolis',
    country: 'Brasil',
    biography: 'Arquiteta de software.',
    company: 'Software Architecture'
  },
  {
    id: 19,
    name: 'Marcos Paulo',
    email: 'marcos.paulo@email.com',
    phone: '11999990000',
    status: 'inactive',
    tags: ['Inativo'],
    lastContact: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 dias atrás
    lastName: 'Paulo',
    city: 'Vitória',
    country: 'Brasil',
    biography: 'Analista de qualidade.',
    company: 'Quality Assurance'
  },
  {
    id: 20,
    name: 'Isabela Gomes',
    email: 'isabela.gomes@email.com',
    phone: '11999989999',
    status: 'active',
    tags: ['VIP'],
    lastContact: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
    lastName: 'Gomes',
    city: 'Natal',
    country: 'Brasil',
    biography: 'Gerente de projetos.',
    company: 'Project Management'
  },
  {
    id: 21,
    name: 'Daniel Barbosa',
    email: 'daniel.barbosa@email.com',
    phone: '11999989988',
    status: 'active',
    tags: ['Cliente'],
    lastContact: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 dias atrás
    lastName: 'Barbosa',
    city: 'Maceió',
    country: 'Brasil',
    biography: 'Consultor financeiro.',
    company: 'Financial Consulting'
  },
  {
    id: 22,
    name: 'Larissa Castro',
    email: 'larissa.castro@email.com',
    phone: '11999989977',
    status: 'pending',
    tags: ['Novo Lead', 'Empresa'],
    lastContact: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 horas atrás
    lastName: 'Castro',
    city: 'João Pessoa',
    country: 'Brasil',
    biography: 'Especialista em RH.',
    company: 'HR Solutions'
  },
  {
    id: 23,
    name: 'Thiago Nogueira',
    email: 'thiago.nogueira@email.com',
    phone: '11999989966',
    status: 'active',
    tags: ['VIP', 'Cliente'],
    lastContact: new Date(Date.now() - 75 * 60 * 1000), // 1.25 horas atrás
    lastName: 'Nogueira',
    city: 'Aracaju',
    country: 'Brasil',
    biography: 'Empreendedor digital.',
    company: 'Digital Business'
  }
])

const searchTerm = ref('')
const statusFilter = ref('')

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Estado de expansão dos cards
const expandedContacts = ref([])

// Estado de feedback de atualização
const updateSuccess = ref(null)

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

const paginatedContacts = computed(() => {
  const result = filteredContacts.value
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return result.slice(startIndex, endIndex)
})

const totalPages = computed(() => {
  return Math.ceil(filteredContacts.value.length / itemsPerPage.value)
})

const startItem = computed(() => {
  return filteredContacts.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return end > filteredContacts.value.length ? filteredContacts.value.length : end
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

// Métodos de expansão de cards
const toggleContactExpansion = (contactId) => {
  const index = expandedContacts.value.indexOf(contactId)
  if (index > -1) {
    expandedContacts.value.splice(index, 1)
  } else {
    expandedContacts.value.push(contactId)
  }
}

// Método de atualização de contato
const updateContact = (contactId) => {
  // Encontrar o contato no array
  const contactIndex = contacts.value.findIndex(c => c.id === contactId)

  if (contactIndex !== -1) {
    // Simular atualização (em um app real, isso seria uma chamada de API)
    const updatedContact = { ...contacts.value[contactIndex] }

    // Mostrar feedback de sucesso
    updateSuccess.value = `Contato "${updatedContact.name}" atualizado com sucesso!`

    // Remover o feedback após 3 segundos
    setTimeout(() => {
      updateSuccess.value = null
    }, 3000)

    // Colapsar o card após atualizar
    const expandedIndex = expandedContacts.value.indexOf(contactId)
    if (expandedIndex > -1) {
      expandedContacts.value.splice(expandedIndex, 1)
    }
  }
}

// Métodos de paginação
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Resetar paginação quando a busca mudar
watch([searchTerm, statusFilter], () => {
  currentPage.value = 1
})

// Meta tags da página
useHead({
  title: 'Contatos - Artemis',
  meta: [
    { name: 'description', content: 'Gerencie sua lista de contatos' }
  ]
})
</script>

<style scoped>
/* Custom scrollbar que só aparece ao passar o mouse */
.custom-scrollbar-container {
  scrollbar-color: transparent transparent;
  overflow: overlay;
  overflow-y: auto;
  transition: scrollbar-color 0.3s ease;
  margin-right: 0;
  padding-right: 0;
  -webkit-overflow-scrolling: touch; /* Melhora a experiência de scroll em iOS */
}

/* Chrome, Safari e Edge */
.custom-scrollbar-container::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}

.custom-scrollbar-container::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-container::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

/* Ao passar o mouse, mostra a scrollbar */
.custom-scrollbar-container:hover {
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar-container:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
}

/* Scrollbar mais visível quando ativamente em uso */
.custom-scrollbar-container:hover::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.7);
}

/* Melhorias para dispositivos móveis */
@media (max-width: 640px) {
  /* Evita zoom horizontal em iOS */
  .custom-scrollbar-container {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  /* Melhora a performance de scroll */
  .custom-scrollbar-container {
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
  }
}

/* Animação fluida de expansão de formulário */
.form-expansion-container {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: max-height, opacity, transform;
  border-top: 1px solid transparent;
  margin-top: 0;
  padding-top: 0;
}

.form-expansion-container.expanded {
  max-height: 600px;
  opacity: 1;
  transform: translateY(0);
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
  padding-top: 1rem;
}

.form-expansion-container.collapsed {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
  border-top: 1px solid transparent;
  margin-top: 0;
  padding-top: 0;
}

/* Animações stagger para campos do formulário */
.form-expansion-container.expanded .form-field {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.form-expansion-container.expanded .form-field:nth-child(1) { animation-delay: 0.05s; }
.form-expansion-container.expanded .form-field:nth-child(2) { animation-delay: 0.1s; }
.form-expansion-container.expanded .form-field:nth-child(3) { animation-delay: 0.15s; }
.form-expansion-container.expanded .form-field:nth-child(4) { animation-delay: 0.2s; }
.form-expansion-container.expanded .form-field:nth-child(5) { animation-delay: 0.25s; }
.form-expansion-container.expanded .form-field:nth-child(6) { animation-delay: 0.3s; }
.form-expansion-container.expanded .form-field:nth-child(7) { animation-delay: 0.35s; }
.form-expansion-container.expanded .form-field:nth-child(8) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Melhorias de performance e micro-interações */
.form-expansion-container input,
.form-expansion-container textarea {
  transition: all 0.2s ease;
  will-change: border-color, box-shadow;
}

.form-expansion-container input:focus,
.form-expansion-container textarea:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.form-expansion-container button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
}

.form-expansion-container button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.form-expansion-container button:active {
  transform: translateY(0);
}

/* Animação para o botão de expandir/colapsar */
.transition-transform {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Melhorias para mobile */
@media (max-width: 640px) {
  .form-expansion-container.expanded {
    max-height: 800px;
  }

  .form-expansion-container input:focus,
  .form-expansion-container textarea:focus {
    transform: none;
  }
}

</style>