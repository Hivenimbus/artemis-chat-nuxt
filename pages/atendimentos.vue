<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- Conteúdo principal -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Seção esquerda - Lista de contatos -->
      <ContactList
        :contacts="atendimentos"
        :selected-contact-id="selectedContact?.id"
        :available-tags="availableTags"
        :caixas-entrada-options="caixasEntradaOptions"
        :loading="loading"
        :error="error"
        :selected-inbox-id="selectedCaixaEntrada"
        @select-contact="selectContact"
        @assign-to-me="assignToMe"
        @select-inbox="selectCaixaEntrada = $event"
      />

      <!-- Seção direita - Área de chat -->
      <ChatArea
        :selected-contact="selectedContact"
        :system-tags="systemTags"
        @send-message="sendMessage"
        @toggle-tag="toggleTag"
        @add-tag="addNewSystemTag"
        @resolve-chat="handleResolveChat"
        @export-chat="handleExportChat"
        @transfer-chat="handleTransferChat"
        @block-contact="handleBlockContact"
        @delete-chat="handleDeleteChat"
      />
    </div>

    <!-- Modal de Confirmação para Resolver -->
    <div
      v-if="showResolveModal"
      class="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
      @click.self="cancelResolveChat"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div class="flex items-start mb-4">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-lg font-medium text-gray-900">Resolver Atendimento</h3>
            <p class="mt-2 text-sm text-gray-500">
              Deseja marcar o atendimento de <strong>{{ selectedContact?.name }}</strong> como resolvido?
            </p>
          </div>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            @click="cancelResolveChat"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            @click="confirmResolveChat"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'

// Dados carregados da API
const atendimentos = ref([])
const loading = ref(true)
const error = ref(null)

const selectedContact = ref(null)
const showResolveModal = ref(false)
const selectedCaixaEntrada = ref(null)

// Carregar caixas de entrada do Supabase
const { getInboxes, loading: inboxesLoading } = useInboxes()
const inboxesData = ref([])
const caixasEntradaOptions = computed(() => {
  // Se está carregando, retorna array vazio ou estado de loading
  if (inboxesLoading.value) {
    return [{ label: 'Carregando...', value: 'loading', count: 0, disabled: true }]
  }

  // Se não há inboxes carregadas, retorna array vazio ou mensagem
  if (!inboxesData.value || !Array.isArray(inboxesData.value)) {
    return [{ label: 'Nenhuma caixa de entrada disponível', value: 'none', count: 0, disabled: true }]
  }

  // Contar atendimentos por caixa de entrada usando os IDs das inboxes
  const caixaCounts = {}

  // Inicializar contadores para cada inbox
  inboxesData.value.forEach(inbox => {
    caixaCounts[inbox.id] = atendimentos.value.filter(a =>
      a.caixa_entrada === inbox.id
    ).length
  })

  // Mapear inboxes para o formato esperado pelo ContactList
  return inboxesData.value.map(inbox => ({
    label: inbox.name,
    value: inbox.id,
    count: caixaCounts[inbox.id] || 0,
    description: inbox.description,
    status: inbox.status
  }))
})

// Tags do sistema carregadas da API
const systemTags = ref([])
const loadingTags = ref(true)

// Obter tags disponíveis
const availableTags = computed(() => {
  if (!atendimentos.value || !Array.isArray(atendimentos.value)) {
    return []
  }

  const allTags = atendimentos.value
    .filter(atendimento => atendimento && atendimento.tags && Array.isArray(atendimento.tags))
    .flatMap(atendimento => atendimento.tags)

  return [...new Set(allTags)].sort()
})

// Selecionar contato
const selectContact = (contact) => {
  selectedContact.value = contact
  // Resetar contador de mensagens não lidas
  contact.unreadCount = 0
}

// Enviar mensagem
const sendMessage = async (messageText) => {
  if (!messageText.trim() || !selectedContact.value) return

  try {
    const response = await $fetch(`/api/atendimentos/${selectedContact.value.id}/mensagens`, {
      method: 'POST',
      body: {
        texto: messageText
      }
    })

    if (response?.success) {
      // Atualizar atendimento local
      const atendimentoIndex = atendimentos.value.findIndex(a => a.id === selectedContact.value.id)
      if (atendimentoIndex > -1) {
        atendimentos.value[atendimentoIndex].lastMessage = messageText
        atendimentos.value[atendimentoIndex].lastMessageTime = new Date()
      }
    } else {
      console.error('Erro ao enviar mensagem:', response)
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
  }
}

// Funções de gerenciamento de tags
const toggleTag = (tag) => {
  if (!selectedContact.value) return

  const tagIndex = selectedContact.value.tags.indexOf(tag)
  if (tagIndex > -1) {
    selectedContact.value.tags.splice(tagIndex, 1)
  } else {
    selectedContact.value.tags.push(tag)
  }
}

const addNewSystemTag = (tagName) => {
  if (!tagName.trim()) return

  const cleanTagName = tagName.trim()

  // Adicionar às tags do sistema se não existir
  if (!systemTags.value.includes(cleanTagName)) {
    systemTags.value.push(cleanTagName)
  }

  // Adicionar ao contato selecionado
  if (selectedContact.value && !selectedContact.value.tags.includes(cleanTagName)) {
    selectedContact.value.tags.push(cleanTagName)
  }
}

// Funções de gerenciamento de status
const updateStatus = (newStatus) => {
  if (!selectedContact.value) return
  selectedContact.value.status = newStatus
}

// Função para resolver atendimento
const handleResolveChat = () => {
  if (!selectedContact.value) return
  
  showResolveModal.value = true
}

const confirmResolveChat = async () => {
  if (!selectedContact.value) return

  try {
    const response = await $fetch(`/api/atendimentos/${selectedContact.value.id}/resolve`, {
      method: 'PATCH'
    })

    if (response?.success) {
      // Atualizar atendimento local
      const atendimentoIndex = atendimentos.value.findIndex(a => a.id === selectedContact.value.id)
      if (atendimentoIndex > -1) {
        atendimentos.value[atendimentoIndex].status = 'concluido'
        atendimentos.value[atendimentoIndex].unreadCount = 0
      }

      showResolveModal.value = false
      alert('Atendimento resolvido com sucesso!')
    } else {
      console.error('Erro ao resolver atendimento:', response)
      alert('Erro ao resolver atendimento')
    }
  } catch (error) {
    console.error('Erro ao resolver atendimento:', error)
    alert('Erro ao resolver atendimento')
  }
}

const cancelResolveChat = () => {
  showResolveModal.value = false
}

// Função para atribuir atendimento a mim
const assignToMe = async (atendimento) => {
  if (!atendimento) return

  try {
    console.log('Atribuindo atendimento a mim:', atendimento.name)

    const response = await $fetch(`/api/atendimentos/${atendimento.id}/assign`, {
      method: 'PATCH'
    })

    if (response?.success) {
      // Atualizar atendimento local
      const atendimentoIndex = atendimentos.value.findIndex(a => a.id === atendimento.id)
      if (atendimentoIndex > -1) {
        atendimentos.value[atendimentoIndex].status = 'ativo'
        atendimentos.value[atendimentoIndex].responsavel_name = 'Você'
      }

      // Exibir mensagem de sucesso
      alert(`Atendimento de ${atendimento.name} atribuído a você!`)
    } else {
      console.error('Erro ao atribuir atendimento:', response)
      alert('Erro ao atribuir atendimento')
    }
  } catch (error) {
    console.error('Erro ao atribuir atendimento:', error)
    alert('Erro ao atribuir atendimento')
  }
}

// Funções do menu kebab (sidebar)
const handleExportChat = () => {
  if (!selectedContact.value) return
  console.log('Exportar conversa:', selectedContact.value.name)
  alert(`Exportando conversa com ${selectedContact.value.name}...`)
}

const handleBlockContact = () => {
  if (!selectedContact.value) return
  const confirmBlock = confirm(`Deseja realmente bloquear ${selectedContact.value.name}?`)
  if (confirmBlock) {
    console.log('Bloquear contato:', selectedContact.value.name)
    alert(`Contato ${selectedContact.value.name} bloqueado.`)
  }
}

const handleTransferChat = () => {
  if (!selectedContact.value) return
  console.log('Transferir atendimento:', selectedContact.value.name)
  alert(`Transferindo atendimento de ${selectedContact.value.name}...`)
}

const handleDeleteChat = () => {
  if (!selectedContact.value) return
  const confirmDelete = confirm(`Deseja realmente excluir a conversa com ${selectedContact.value.name}?`)
  if (confirmDelete) {
    console.log('Excluir conversa:', selectedContact.value.name)
    const index = contacts.value.findIndex(c => c.id === selectedContact.value.id)
    if (index > -1) {
      contacts.value.splice(index, 1)
    }
    selectedContact.value = null
    alert('Conversa excluída com sucesso.')
  }
}

// Carregar inboxes do Supabase
const loadInboxes = async () => {
  try {
    const response = await getInboxes()
    if (response?.success && response?.data) {
      inboxesData.value = response.data
      console.log('Inboxes carregadas:', response.data)
    } else {
      console.warn('Resposta inválida da API de inboxes:', response)
      inboxesData.value = []
    }
  } catch (error) {
    console.error('Erro ao carregar inboxes:', error)
    inboxesData.value = []
  }
}

// Carregar atendimentos do Supabase
const loadAtendimentos = async (inboxId = null) => {
  try {
    loading.value = true
    error.value = null

    const params = new URLSearchParams()
    if (inboxId) {
      params.append('inbox_id', inboxId)
    }

    const response = await $fetch(`/api/atendimentos?${params.toString()}`)

    if (response?.success && response?.data) {
      atendimentos.value = response.data.atendimentos
      console.log('Atendimentos carregados:', response.data.atendimentos)
    } else {
      console.warn('Resposta inválida da API de atendimentos:', response)
      atendimentos.value = []
    }
  } catch (err) {
    console.error('Erro ao carregar atendimentos:', err)
    error.value = err.message || 'Erro ao carregar atendimentos'
    atendimentos.value = []
  } finally {
    loading.value = false
  }
}

// Carregar tags do sistema
const loadTags = async () => {
  try {
    loadingTags.value = true
    const response = await $fetch('/api/etiquetas')

    if (response?.success && response?.data) {
      systemTags.value = response.data.map(tag => tag.nome)
      console.log('Tags carregadas:', response.data)
    } else {
      systemTags.value = []
    }
  } catch (err) {
    console.error('Erro ao carregar tags:', err)
    systemTags.value = []
  } finally {
    loadingTags.value = false
  }
}

// Carregar dados ao montar a página
onMounted(async () => {
  await nextTick()
  await Promise.all([
    loadInboxes(),
    loadTags()
  ])
  // Carregar atendimentos após carregar inboxes
  await loadAtendimentos()
})

// Watcher para atualizar atendimentos quando a caixa de entrada mudar
watch(selectedCaixaEntrada, async (newInboxId) => {
  if (newInboxId) {
    await loadAtendimentos(newInboxId)
  }
})

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

// Meta tags da página
useHead({
  title: 'Atendimentos - Artemis',
  meta: [
    { name: 'description', content: 'Painel de atendimentos e chat com clientes' }
  ]
})
</script>
