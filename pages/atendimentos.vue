<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- Conteúdo principal -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Seção esquerda - Lista de contatos -->
      <ContactList
        :contacts="contacts"
        :selected-contact-id="selectedContact?.id"
        :available-tags="availableTags"
        :caixas-entrada-options="caixasEntradaOptions"
        @select-contact="selectContact"
        @assign-to-me="assignToMe"
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

// Dados mockados para demonstração
const contacts = ref([
  {
    id: 1,
    name: 'João Silva',
    phone: '11999999999',
    lastMessage: 'Olá, preciso de ajuda com meu pedido',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
    tags: ['Prioridade', 'VIP'],
    unreadCount: 2,
    status: 'ativo',
    caixa_entrada: null, // Será atribuído dinamicamente baseado nas inboxes carregadas
    messages: [
      { id: 1, text: 'Olá, preciso de ajuda com meu pedido', sender: 'contact', timestamp: new Date(Date.now() - 25 * 60 * 1000) },
      { id: 2, text: 'Olá João! Como posso ajudar?', sender: 'user', timestamp: new Date(Date.now() - 24 * 60 * 1000) },
      { id: 3, text: 'Meu pedido #1234 está atrasado', sender: 'contact', timestamp: new Date(Date.now() - 23 * 60 * 1000) },
      { id: 4, text: 'Vou verificar seu pedido agora mesmo', sender: 'user', timestamp: new Date(Date.now() - 22 * 60 * 1000) },
      { id: 5, text: 'Obrigado pelo atendimento rápido', sender: 'contact', timestamp: new Date(Date.now() - 21 * 60 * 1000) },
      { id: 6, text: 'Verifiquei seu pedido e ele já foi despachado', sender: 'user', timestamp: new Date(Date.now() - 20 * 60 * 1000) },
      { id: 7, text: 'Que bom! Quando ele deve chegar?', sender: 'contact', timestamp: new Date(Date.now() - 19 * 60 * 1000) },
      { id: 8, text: 'A previsão de entrega é até sexta-feira', sender: 'user', timestamp: new Date(Date.now() - 18 * 60 * 1000) },
      { id: 9, text: 'Perfeito, obrigado pela informação', sender: 'contact', timestamp: new Date(Date.now() - 17 * 60 * 1000) },
      { id: 10, text: 'De nada! Se precisar de mais algo, é só chamar', sender: 'user', timestamp: new Date(Date.now() - 16 * 60 * 1000) },
      { id: 11, text: 'Só mais uma dúvida, o pedido vem com nota fiscal?', sender: 'contact', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
      { id: 12, text: 'Sim, todos os nossos pedidos vêm com nota fiscal eletrônica', sender: 'user', timestamp: new Date(Date.now() - 14 * 60 * 1000) },
      { id: 13, text: 'Excelente, isso é muito importante para mim', sender: 'contact', timestamp: new Date(Date.now() - 13 * 60 * 1000) },
      { id: 14, text: 'A nota fiscal será enviada para seu e-mail cadastrado', sender: 'user', timestamp: new Date(Date.now() - 12 * 60 * 1000) },
      { id: 15, text: 'Perfeito, já anotei isso. Obrigado mais uma vez!', sender: 'contact', timestamp: new Date(Date.now() - 11 * 60 * 1000) },
      { id: 16, text: 'Foi um prazer ajudar! Estou à disposição', sender: 'user', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
      { id: 17, text: 'Tenha um ótimo dia!', sender: 'contact', timestamp: new Date(Date.now() - 9 * 60 * 1000) },
      { id: 18, text: 'Você também! Até logo!', sender: 'user', timestamp: new Date(Date.now() - 8 * 60 * 1000) },
      { id: 19, text: 'Oi, só para confirmar, meu pedido já saiu para entrega?', sender: 'contact', timestamp: new Date(Date.now() - 7 * 60 * 1000) },
      { id: 20, text: 'Sim! Seu pedido já foi despachado hoje de manhã.', sender: 'user', timestamp: new Date(Date.now() - 6 * 60 * 1000) },
      { id: 21, text: 'Que ótimo! Você tem o código de rastreamento?', sender: 'contact', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
      { id: 22, text: 'Claro! O código é: BR123456789BR', sender: 'user', timestamp: new Date(Date.now() - 4 * 60 * 1000) },
      { id: 23, text: 'Perfeito, já vou rastrear no site dos Correios.', sender: 'contact', timestamp: new Date(Date.now() - 3 * 60 * 1000) },
      { id: 24, text: 'Ótima ideia! Qualquer dúvida é só me chamar.', sender: 'user', timestamp: new Date(Date.now() - 2 * 60 * 1000) },
      { id: 25, text: 'Obrigado pela ajuda! Vocês são incríveis!', sender: 'contact', timestamp: new Date(Date.now() - 1 * 60 * 1000) },
      { id: 26, text: 'Foi um prazer ajudar! Volte sempre!', sender: 'user', timestamp: new Date() }
    ]
  },
  {
    id: 2,
    name: 'Maria Santos',
    phone: '21988888888',
    lastMessage: 'Obrigado pela ajuda!',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
    tags: ['Resolvido'],
    unreadCount: 0,
    status: 'concluido',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Preciso de ajuda com meu produto', sender: 'contact', timestamp: new Date(Date.now() - 60 * 60 * 1000) },
      { id: 2, text: 'Claro, qual o problema?', sender: 'user', timestamp: new Date(Date.now() - 55 * 60 * 1000) },
      { id: 3, text: 'Já resolveu, obrigado pela ajuda!', sender: 'contact', timestamp: new Date(Date.now() - 30 * 60 * 1000) }
    ]
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    phone: '31977777777',
    lastMessage: 'Quando meu produto será entregue?',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    tags: ['Entrega', 'Urgente'],
    unreadCount: 1,
    status: 'aguardando',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Quando meu produto será entregue?', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 4,
    name: 'Ana Costa',
    phone: '11966666666',
    lastMessage: 'Quero fazer um pedido',
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    tags: ['Novo Cliente'],
    unreadCount: 0,
    status: 'ativo',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Quero fazer um pedido', sender: 'contact', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { id: 2, text: 'Claro! O que você gostaria de pedir?', sender: 'user', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 5,
    name: 'Carlos Mendes',
    phone: '11955555555',
    lastMessage: 'Produto chegou com defeito',
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
    tags: ['Reclamação', 'Troca'],
    unreadCount: 1,
    status: 'aguardando',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Produto chegou com defeito', sender: 'contact', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 6,
    name: 'Fernanda Souza',
    phone: '21944444444',
    lastMessage: 'Obrigado pelo atendimento rápido',
    lastMessageTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
    tags: ['Elogio', 'Resolvido'],
    unreadCount: 0,
    status: 'concluido',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Preciso de ajuda com meu pedido', sender: 'contact', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
      { id: 2, text: 'Vou verificar seu pedido agora mesmo', sender: 'user', timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000) },
      { id: 3, text: 'Obrigado pelo atendimento rápido', sender: 'contact', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 7,
    name: 'Ricardo Alves',
    phone: '31933333333',
    lastMessage: 'Quero cancelar meu pedido',
    lastMessageTime: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
    tags: ['Cancelamento', 'Urgente'],
    unreadCount: 2,
    status: 'ativo',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Quero cancelar meu pedido', sender: 'contact', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 8,
    name: 'Juliana Lima',
    phone: '11922222222',
    lastMessage: 'Gostaria de fazer uma sugestão',
    lastMessageTime: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 horas atrás
    tags: ['Sugestão', 'Feedback'],
    unreadCount: 0,
    status: 'concluido',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Gostaria de fazer uma sugestão', sender: 'contact', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000) },
      { id: 2, text: 'Claro! Adoraria ouvir sua sugestão', sender: 'user', timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 9,
    name: 'Roberto Silva',
    phone: '21911111111',
    lastMessage: 'Quando vai ter promoção novamente?',
    lastMessageTime: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 horas atrás
    tags: ['Dúvida', 'Promoção'],
    unreadCount: 0,
    status: 'aguardando',
    caixa_entrada: null, // Será atribuído dinamicamente
    messages: [
      { id: 1, text: 'Quando vai ter promoção novamente?', sender: 'contact', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000) },
      { id: 2, text: 'Temos promoções mensais, fique de olho!', sender: 'user', timestamp: new Date(Date.now() - 35 * 60 * 60 * 1000) }
    ]
  }
])

const selectedContact = ref(null)
const showResolveModal = ref(false)

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

  // Contar contatos por caixa de entrada usando os IDs das inboxes
  const caixaCounts = {}

  // Inicializar contadores para cada inbox
  inboxesData.value.forEach(inbox => {
    caixaCounts[inbox.id] = contacts.value.filter(c =>
      c.caixa_entrada === inbox.id
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

// Tags do sistema disponíveis
const systemTags = ref([
  'Prioridade',
  'VIP',
  'Resolvido',
  'Entrega',
  'Urgente',
  'Novo Cliente',
  'Reclamação',
  'Elogio',
  'Dúvida',
  'Sugestão',
  'Cancelamento',
  'Promoção',
  'Feedback',
  'Troca'
])

// Obter tags disponíveis
const availableTags = computed(() => {
  if (!contacts.value || !Array.isArray(contacts.value)) {
    return []
  }

  const allTags = contacts.value
    .filter(contact => contact && contact.tags && Array.isArray(contact.tags))
    .flatMap(contact => contact.tags)

  return [...new Set(allTags)].sort()
})

// Selecionar contato
const selectContact = (contact) => {
  selectedContact.value = contact
  // Resetar contador de mensagens não lidas
  contact.unreadCount = 0
}

// Enviar mensagem
const sendMessage = (messageText) => {
  if (!messageText.trim() || !selectedContact.value) return

  const message = {
    id: Date.now(),
    text: messageText,
    sender: 'user',
    timestamp: new Date()
  }

  selectedContact.value.messages.push(message)
  selectedContact.value.lastMessage = message.text
  selectedContact.value.lastMessageTime = message.timestamp
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

const confirmResolveChat = () => {
  if (!selectedContact.value) return
  
  updateStatus('concluido')
  showResolveModal.value = false
}

const cancelResolveChat = () => {
  showResolveModal.value = false
}

// Função para atribuir contato a mim
const assignToMe = (contact) => {
  if (!contact) return
  
  console.log('Atribuindo contato a mim:', contact.name)
  contact.status = 'ativo'
  alert(`Atendimento de ${contact.name} atribuído a você!`)
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

      // Atribuir contatos às inboxes carregadas (lógica temporária para demo)
      assignContactsToInboxes()
    } else {
      console.warn('Resposta inválida da API de inboxes:', response)
      inboxesData.value = []
    }
  } catch (error) {
    console.error('Erro ao carregar inboxes:', error)
    // Em caso de erro, definir array vazio para mostrar mensagem apropriada
    inboxesData.value = []
  }
}

// Atribuir contatos às inboxes disponíveis (lógica para demonstração)
const assignContactsToInboxes = () => {
  if (!inboxesData.value || inboxesData.value.length === 0) return

  // Distribuir contatos entre as inboxes disponíveis
  contacts.value.forEach((contact, index) => {
    const inboxIndex = index % inboxesData.value.length
    contact.caixa_entrada = inboxesData.value[inboxIndex].id
  })

  console.log('Contatos distribuídos entre as inboxes')
}

// Carregar inboxes ao montar a página
onMounted(async () => {
  await nextTick()
  await loadInboxes()
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
