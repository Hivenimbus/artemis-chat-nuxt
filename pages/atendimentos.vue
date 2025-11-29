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
        :server-counts="serverCounts"
        @select-contact="selectContact"
        @assign-to-me="assignToMe"
        @select-inbox="selectCaixaEntrada = $event"
      />

      <!-- Seção direita - Área de chat -->
      <ChatArea
        :selected-contact="selectedContact"
        :system-tags="systemTags"
        :caixas-entrada-map="caixasEntradaMap"
        @send-message="sendMessage"
        @toggle-tag="toggleTag"
        @add-tag="addNewSystemTag"
        @resolve-chat="handleResolveChat"
        @export-chat="handleExportChat"
        @transfer-chat="handleTransferChat"
        @block-contact="handleBlockContact"
        @delete-chat="handleDeleteChat"
        @update-contact="handleUpdateContact"
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
// useDocumentVisibility é auto-importado via @vueuse/nuxt

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

// Criar mapa de caixas de entrada para fácil acesso ao nome
const caixasEntradaMap = computed(() => {
  if (!inboxesData.value || !Array.isArray(inboxesData.value)) {
    return {}
  }

  const map = {}
  inboxesData.value.forEach(inbox => {
    map[inbox.id] = inbox.name
  })
  return map
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
// Função para salvar tags do contato no banco de dados
const saveContactTags = async (contatoId, tags) => {
  if (!contatoId) return

  try {
    console.log('Salvando tags para contato:', contatoId, tags)

    const response = await $fetch(`/api/contatos/${contatoId}`, {
      method: 'PUT',
      body: {
        nome: selectedContact.value.name,
        telefone: selectedContact.value.phone,
        email: selectedContact.value.email || null,
        tags: tags
      }
    })

    if (response?.success) {
      console.log('Tags salvas com sucesso:', response.data)
      console.log('Estrutura das tags recebidas:', response.data.tags)
      // Atualizar tags no contato selecionado com os dados retornados da API
      if (selectedContact.value) {
        selectedContact.value.tags = response.data.tags || []
        console.log('Tags atualizadas no contato:', selectedContact.value.tags)
      }
      // Opcional: mostrar feedback visual para o usuário
      return true
    } else {
      console.error('Erro ao salvar tags:', response?.message || 'Erro desconhecido')
      return false
    }
  } catch (error) {
    console.error('Erro ao salvar tags do contato:', error)
    return false
  }
}

const toggleTag = async (tagName) => {
  if (!selectedContact.value) return

  // Encontrar a tag na lista de systemTags para obter o objeto completo
  const systemTag = systemTags.value.find(tag => tag.nome === tagName)

  // Verificar se a tag já está selecionada
  const existingTagIndex = selectedContact.value.tags.findIndex(contactTag => {
    const contactTagName = typeof contactTag === 'object' ? contactTag.nome : contactTag
    return contactTagName === tagName
  })

  if (existingTagIndex > -1) {
    // Remover tag
    selectedContact.value.tags.splice(existingTagIndex, 1)
  } else {
    // Adicionar tag - usar o objeto completo se encontrado, caso contrário usar string
    if (systemTag) {
      selectedContact.value.tags.push({
        id: systemTag.id,
        nome: systemTag.nome,
        cor: systemTag.cor
      })
    } else {
      selectedContact.value.tags.push(tagName)
    }
  }

  // Salvar as tags no banco de dados - enviar apenas nomes das tags
  const tagNames = selectedContact.value.tags.map(tag => {
    return typeof tag === 'object' ? tag.nome : tag
  })
  await saveContactTags(selectedContact.value.contato_id, tagNames)
}

const addNewSystemTag = async (tagName) => {
  if (!tagName.trim()) return

  const cleanTagName = tagName.trim()

  try {
    // Verificar se a etiqueta já existe no sistema (agora systemTags é array de objetos)
    const existingTag = systemTags.value.find(tag => tag.nome === cleanTagName)

    if (!existingTag) {
      console.log('Criando nova etiqueta:', cleanTagName)

      const etiquetaResponse = await $fetch('/api/etiquetas', {
        method: 'POST',
        body: {
          nome: cleanTagName,
          descricao: `Etiqueta criada via chat: ${cleanTagName}`,
          cor: '#' + Math.floor(Math.random()*16777215).toString(16) // Cor aleatória
        }
      })

      if (etiquetaResponse?.success) {
        console.log('Etiqueta criada com sucesso:', etiquetaResponse.data)
        // Adicionar à lista local de tags do sistema com estrutura completa
        systemTags.value.push({
          id: etiquetaResponse.data.id,
          nome: etiquetaResponse.data.nome,
          cor: etiquetaResponse.data.cor
        })
      } else {
        console.error('Erro ao criar etiqueta:', etiquetaResponse?.message || 'Erro desconhecido')
        // Mesmo se falhar a criação da etiqueta, continuar tentando adicionar ao contato
      }
    }

    // Encontrar a tag na lista (recarregada ou existente) para adicionar ao contato
    const tagToAdd = systemTags.value.find(tag => tag.nome === cleanTagName)

    // Adicionar ao contato selecionado
    if (selectedContact.value && tagToAdd) {
      // Verificar se a tag já não está no contato
      const alreadyExists = selectedContact.value.tags.some(contactTag => {
        const contactTagName = typeof contactTag === 'object' ? contactTag.nome : contactTag
        return contactTagName === cleanTagName
      })

      if (!alreadyExists) {
        selectedContact.value.tags.push({
          id: tagToAdd.id,
          nome: tagToAdd.nome,
          cor: tagToAdd.cor
        })
      }
    }

    // Salvar as tags no banco de dados - enviar apenas nomes das tags
    const tagNames = selectedContact.value.tags.map(tag => {
      return typeof tag === 'object' ? tag.nome : tag
    })
    await saveContactTags(selectedContact.value.contato_id, tagNames)

  } catch (error) {
    console.error('Erro ao adicionar nova etiqueta:', error)
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

// Função para atualizar contato localmente
const handleUpdateContact = (updatedContact) => {
  if (!updatedContact || !selectedContact.value) return
  
  // Atualizar contato selecionado
  selectedContact.value = updatedContact
  
  // Atualizar lista de atendimentos
  const index = atendimentos.value.findIndex(a => a.id === updatedContact.id)
  if (index > -1) {
    atendimentos.value[index] = {
      ...atendimentos.value[index],
      name: updatedContact.name
    }
  }
}

// Funções do menu kebab (sidebar)
const handleExportChat = () => {
  if (!selectedContact.value) return
  console.log('Exportar conversa:', selectedContact.value.name)
  // TODO: Implementar funcionalidade de exportação de conversa
}

const handleBlockContact = () => {
  if (!selectedContact.value) return
  const confirmBlock = confirm(`Deseja realmente bloquear ${selectedContact.value.name}?`)
  if (confirmBlock) {
    console.log('Bloquear contato:', selectedContact.value.name)
    // TODO: Implementar funcionalidade de bloqueio de contato
  }
}

const handleTransferChat = () => {
  if (!selectedContact.value) return
  console.log('Transferir atendimento:', selectedContact.value.name)
  // TODO: Implementar funcionalidade de transferência de atendimento
}

const handleDeleteChat = async () => {
  if (!selectedContact.value) return
  
  const confirmDelete = confirm(`Deseja realmente excluir a conversa com ${selectedContact.value.name}?`)
  if (confirmDelete) {
    try {
      const contactId = selectedContact.value.id
      
      // Chamada ao endpoint de exclusão
      await $fetch(`/api/atendimentos/${contactId}`, {
        method: 'DELETE'
      })
      
      console.log('Excluir conversa:', selectedContact.value.name)
      const index = atendimentos.value.findIndex(c => c.id === contactId)
      if (index > -1) {
        atendimentos.value.splice(index, 1)
      }
      selectedContact.value = null
      alert('Conversa excluída com sucesso.')
    } catch (error) {
      console.error('Erro ao excluir conversa:', error)
      alert('Erro ao excluir a conversa. Tente novamente.')
    }
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
      // Preservar dados completos: id, nome, cor
      systemTags.value = response.data.map(tag => ({
        id: tag.id,
        nome: tag.nome,
        cor: tag.cor || '#6B7280' // Cor padrão cinza se não tiver
      }))
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

// Sistema de atualização automática para novas mensagens
let pollingInterval = null

const startPolling = () => {
  // Limpar intervalo existente
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }

  // Atualizar a cada 10 segundos
  pollingInterval = setInterval(async () => {
    // Só atualizar se não estiver carregando
    if (!loading.value) {
      await loadAtendimentos(selectedCaixaEntrada.value)

      // Se há um contato selecionado, atualizar também as mensagens
      if (selectedContact.value) {
        // TODO: Implementar atualização de mensagens do contato selecionado
        // Isso pode ser feito via $fetch para /api/atendimentos/[id]/mensagens
      }
    }
  }, 10000) // 10 segundos
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
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

  // Iniciar polling
  startPolling()
})

// Parar polling quando a página for destruída
onUnmounted(() => {
  stopPolling()
})

// Watcher para atualizar atendimentos quando a caixa de entrada mudar
watch(selectedCaixaEntrada, async (newInboxId) => {
  if (newInboxId) {
    await loadAtendimentos(newInboxId)
    // Reiniciar polling com novo filtro
    stopPolling()
    nextTick(() => {
      startPolling()
    })
  }
})

// Pausar polling quando a aba não estiver visível
const isVisible = useDocumentVisibility()

watch(isVisible, (visible) => {
  if (visible) {
    // Quando a aba ficar visível, atualizar imediatamente e continuar polling
    loadAtendimentos(selectedCaixaEntrada.value)
    startPolling()
  } else {
    // Quando a aba não estiver visível, parar polling para economizar recursos
    stopPolling()
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
