<template>
  <div class="h-full bg-gray-50">
    <div class="max-w-7xl mx-auto h-full py-4 px-3 sm:py-6 sm:px-6 lg:px-8">
      <!-- Cabeçalho -->
      <div class="mb-4 sm:mb-6">
        <NuxtLink
          to="/contatos"
          class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar para Contatos
        </NuxtLink>

        <!-- Ações rápidas -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Detalhes do Contato</h1>
          <div class="flex items-center space-x-2">
            <NuxtLink
              :to="`/atendimentos?contact=${contact?.id}`"
              class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Novo Atendimento
            </NuxtLink>
            <button
              @click="toggleEditMode"
              class="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {{ editMode ? 'Cancelar' : 'Editar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Mensagem de sucesso -->
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

      <!-- Estado de Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center space-y-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span class="text-sm text-gray-500">Carregando contato...</span>
        </div>
      </div>

      <!-- Estado de Erro -->
      <div v-else-if="error" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center space-y-4 text-center">
          <svg class="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-gray-900">Erro ao carregar contato</h3>
            <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
          </div>
          <div class="flex space-x-3">
            <NuxtLink
              to="/contatos"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Voltar para Contatos
            </NuxtLink>
            <button
              @click="loadContact"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div v-else-if="contact" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Coluna principal - Informações básicas -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Card informações básicas -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Informações Básicas</h2>
            </div>
            <div class="px-4 sm:px-6 py-4 sm:py-5">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div class="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {{ getInitials(contact.name) }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ contact.name }}</h3>
                  <div class="mb-3">
                    <TagEditor
                      :tags="contact.tags"
                      :available-tags="availableTags"
                      :editing="editingTags"
                      @toggle-edit="toggleTagsEdit"
                      @update-tags="updateContactTags"
                    />
                  </div>
                </div>
              </div>

              <!-- Formulário de edição ou visualização -->
              <form v-if="editMode" @submit.prevent="updateContact" class="mt-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      v-model="contact.name"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
                    <input
                      v-model="contact.lastName"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      v-model="contact.email"
                      type="email"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      v-model="contact.phone"
                      type="tel"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input
                      v-model="contact.city"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">País</label>
                    <input
                      v-model="contact.country"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <input
                      v-model="contact.company"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                      v-model="contact.address"
                      type="text"
                      placeholder="Rua, número, complemento..."
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
                  <textarea
                    v-model="contact.biography"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  ></textarea>
                </div>

                <div class="flex justify-end space-x-3">
                  <button
                    type="button"
                    @click="toggleEditMode"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>

              <!-- Visualização dos dados -->
              <div v-else class="mt-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Email</h4>
                    <p class="mt-1 text-sm text-gray-900">{{ contact.email }}</p>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Telefone</h4>
                    <p class="mt-1 text-sm text-gray-900">{{ formatPhone(contact.phone) }}</p>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Cidade</h4>
                    <p class="mt-1 text-sm text-gray-900">{{ contact.city || 'Não informado' }}</p>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">País</h4>
                    <p class="mt-1 text-sm text-gray-900">{{ contact.country || 'Não informado' }}</p>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Empresa</h4>
                    <p class="mt-1 text-sm text-gray-900">{{ contact.company || 'Não informado' }}</p>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Endereço</h4>
                    <p class="mt-1 text-sm text-gray-900">{{ contact.address || 'Não informado' }}</p>
                  </div>
                                  </div>

                <div v-if="contact.biography">
                  <h4 class="text-sm font-medium text-gray-500">Biografia</h4>
                  <p class="mt-1 text-sm text-gray-900">{{ contact.biography }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card de histórico de interações -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Histórico de Interações</h2>
            </div>
            <div class="px-4 sm:px-6 py-4 sm:py-5">
              <div class="text-center py-8 text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="mt-2 text-sm">Nenhuma interação registrada ainda</p>
                <NuxtLink
                  :to="`/atendimentos?contact=${contact.id}`"
                  class="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Registrar primeiro atendimento
                  <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna lateral - Informações adicionais -->
        <div class="space-y-6">
          <!-- Card de estatísticas -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Estatísticas</h2>
            </div>
            <div class="px-4 sm:px-6 py-4 sm:py-5">
              <dl class="space-y-3">
                <div class="flex items-center justify-between">
                  <dt class="text-sm font-medium text-gray-500">Total de Atendimentos</dt>
                  <dd class="text-sm font-semibold text-gray-900">0</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-sm font-medium text-gray-500">Tempo de Cadastro</dt>
                  <dd class="text-sm font-semibold text-gray-900">30 dias</dd>
                </div>
                              </dl>
            </div>
          </div>

          <!-- Card de ações rápidas -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
            </div>
            <div class="px-4 sm:px-6 py-4 sm:py-5 space-y-3">
              <a
                :href="`mailto:${contact.email}`"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Enviar Email
              </a>

              <a
                :href="`tel:${contact.phone}`"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                Fazer Chamada
              </a>

              <NuxtLink
                :to="`/atendimentos?contact=${contact.id}`"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Novo Atendimento
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Contato não encontrado -->
      <div v-else class="bg-white shadow rounded-lg">
        <div class="px-4 sm:px-6 py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Contato não encontrado</h3>
          <p class="mt-1 text-sm text-gray-500">O contato que você está procurando não existe ou foi removido.</p>
          <div class="mt-6">
            <NuxtLink
              to="/contatos"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Voltar para Contatos
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Componentes
import TagEditor from '~/components/TagEditor.vue'

// Composables
const { fetchContatoById, updateContato, fetchEtiquetas } = useContatos()

// Estado
const route = useRoute()
const contact = ref(null)
const editMode = ref(false)
const updateSuccess = ref(null)
const loading = ref(false)
const error = ref(null)

// Tags
const editingTags = ref(false)
const availableTags = ref([])

// Carregar contato
const loadContact = async () => {
  try {
    loading.value = true
    error.value = null

    const contactId = route.params.id
    const data = await fetchContatoById(contactId)
    contact.value = data

  } catch (err) {
    console.error('Erro ao carregar contato:', err)
    error.value = err.message || 'Contato não encontrado'
  } finally {
    loading.value = false
  }
}

const loadEtiquetas = async () => {
  try {
    availableTags.value = await fetchEtiquetas()
  } catch (err) {
    console.error('Erro ao carregar etiquetas:', err)
    // Usar tags padrão em caso de erro
    availableTags.value = ['VIP', 'Cliente', 'Novo Lead', 'Empresa']
  }
}

// Carregar dados iniciais
onMounted(async () => {
  await Promise.all([
    loadEtiquetas(),
    loadContact()
  ])
})

// Métodos utilitários (mesmos da página de contatos)
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

// Métodos de edição
const toggleEditMode = () => {
  editMode.value = !editMode.value
}

const updateContact = async () => {
  try {
    if (!contact.value) {
      throw new Error('Nenhum contato para atualizar')
    }

    // Preparar dados para API
    const updateData = {
      nome: contact.value.name,
      sobrenome: contact.value.lastName,
      email: contact.value.email,
      telefone: contact.value.phone,
      cidade: contact.value.city,
      pais: contact.value.country,
      biografia: contact.value.biography,
      empresa: contact.value.company,
      endereco: contact.value.address,
      tags: contact.value.tags
    }

    // Chamar API de atualização
    const updatedContact = await updateContato(contact.value.id, updateData)

    // Atualizar contato local
    contact.value = updatedContact

    // Mostrar feedback de sucesso
    updateSuccess.value = `Contato "${updatedContact.name}" atualizado com sucesso!`

    // Remover o feedback após 3 segundos
    setTimeout(() => {
      updateSuccess.value = null
    }, 3000)

    // Sair do modo de edição
    editMode.value = false

  } catch (err) {
    console.error('Erro ao atualizar contato:', err)
    error.value = err.message || 'Erro ao atualizar contato'
  }
}

// Métodos de edição de tags
const toggleTagsEdit = () => {
  editingTags.value = !editingTags.value
}

const updateContactTags = async (newTags) => {
  try {
    if (!contact.value) {
      throw new Error('Nenhum contato para atualizar')
    }

    // Preparar dados para API (apenas tags)
    const updateData = {
      nome: contact.value.name,
      sobrenome: contact.value.lastName,
      email: contact.value.email,
      telefone: contact.value.phone,
      cidade: contact.value.city,
      pais: contact.value.country,
      biografia: contact.value.biography,
      empresa: contact.value.company,
      endereco: contact.value.address,
      tags: newTags
    }

    // Chamar API de atualização
    const updatedContact = await updateContato(contact.value.id, updateData)

    // Atualizar contato local
    contact.value = updatedContact

    // Sair do modo de edição de tags
    editingTags.value = false

    // Não mostrar mensagem de sucesso para evitar poluição visual
    // O feedback visual é a própria atualização das tags

  } catch (err) {
    console.error('Erro ao atualizar tags do contato:', err)
    error.value = err.message || 'Erro ao atualizar tags'
  }
}

// Meta tags da página
useHead({
  title: contact.value ? `${contact.value.name} - Contatos - Artemis` : 'Contato não encontrado - Artemis',
  meta: [
    { name: 'description', content: contact.value ? `Detalhes do contato ${contact.value.name}` : 'Contato não encontrado' }
  ]
})
</script>

<style scoped>
/* Animações */
.animate-in {
  animation: slideInFromTop 0.3s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transições suaves */
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>