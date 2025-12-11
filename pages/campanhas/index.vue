<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Campanhas</h1>
        <p class="mt-2 text-gray-600">Crie campanhas de disparo em massa no WhatsApp para seus contatos</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Formulário de Campanha -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-8">
        <!-- Seção 1: Seleção de Destinatários -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Destinatários</h2>
              <p class="text-sm text-gray-500">Selecione quem receberá a campanha</p>
            </div>
          </div>

          <!-- Opções de seleção -->
          <div class="space-y-4">
            <label class="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-indigo-500 bg-indigo-50': recipientType === 'all' }">
              <input
                type="radio"
                v-model="recipientType"
                value="all"
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div class="flex-1">
                <span class="block text-sm font-medium text-gray-900">Todos os contatos</span>
                <span class="block text-sm text-gray-500">Enviar para toda a base de contatos cadastrados</span>
              </div>
              <span class="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full">
                {{ totalContacts }} contatos
              </span>
            </label>

            <label class="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-indigo-500 bg-indigo-50': recipientType === 'tags' }">
              <input
                type="radio"
                v-model="recipientType"
                value="tags"
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div class="flex-1">
                <span class="block text-sm font-medium text-gray-900">Contatos com tags específicas</span>
                <span class="block text-sm text-gray-500">Filtrar por etiquetas para segmentar o envio</span>
              </div>
            </label>
          </div>

          <!-- Seleção de Tags -->
          <div v-if="recipientType === 'tags'" class="mt-4 ml-7">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Selecione as tags
            </label>
            <div class="flex flex-wrap gap-3 p-1">
              <button
                v-for="tag in availableTags"
                :key="getTagId(tag)"
                type="button"
                @click="toggleTag(tag)"
                class="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200"
                :class="isTagSelected(tag) 
                  ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' 
                  : 'hover:scale-105 opacity-80 hover:opacity-100'"
                :style="getTagStyle(tag)"
              >
                {{ getTagName(tag) }}
              </button>
            </div>
            
            <!-- Contador de contatos filtrados -->
            <div v-if="selectedTags.length > 0" class="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ filteredContactsCount }} contatos serão impactados</span>
            </div>
          </div>
        </div>

        <!-- Seção 2: Mensagem -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Mensagem</h2>
              <p class="text-sm text-gray-500">Escreva o conteúdo da sua campanha</p>
            </div>
          </div>

          <CampaignMessageEditor
            v-model="messageText"
            placeholder="Olá {{nome}}, temos uma novidade especial para você..."
            :rows="8"
            :error="errors.message"
            :show-preview="true"
            :sample-contact="sampleContact"
            @save-template="handleSaveTemplate"
          />
        </div>

        <!-- Seção 3: Anexos -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Anexo</h2>
              <p class="text-sm text-gray-500">Adicione uma mídia à sua mensagem (opcional)</p>
            </div>
          </div>

          <CampaignAttachmentUploader
            v-model="attachment"
            v-model:caption="attachmentCaption"
            :max-file-size-m-b="16"
          />
        </div>

        <!-- Seção 4: Agendamento -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Envio</h2>
              <p class="text-sm text-gray-500">Configure quando a campanha será enviada</p>
            </div>
          </div>

          <!-- Toggle de agendamento -->
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  v-model="sendType"
                  value="now"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span class="text-sm font-medium text-gray-900">Enviar agora</span>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  v-model="sendType"
                  value="scheduled"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span class="text-sm font-medium text-gray-900">Agendar envio</span>
              </label>
            </div>

            <!-- Campos de agendamento -->
            <div v-if="sendType === 'scheduled'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Data e hora do envio *
                </label>
                <input
                  v-model="scheduledDateTime"
                  type="datetime-local"
                  :min="minDateTime"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <!-- Seleção de Inbox -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Caixa de entrada para envio *
              </label>
              <select
                v-model="selectedInboxId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione uma caixa de entrada</option>
                <option
                  v-for="inbox in inboxes"
                  :key="inbox.id"
                  :value="inbox.id"
                >
                  {{ inbox.name }} {{ inbox.status === 'connected' ? '(Conectado)' : '(Desconectado)' }}
                </option>
              </select>
              <p v-if="errors.inbox" class="mt-1 text-sm text-red-600">{{ errors.inbox }}</p>
            </div>
          </div>
        </div>

        <!-- Resumo e Ações -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumo da Campanha</h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Destinatários</p>
              <p class="text-xl font-semibold text-gray-900">
                {{ recipientType === 'all' ? totalContacts : filteredContactsCount }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Mensagem</p>
              <p class="text-xl font-semibold text-gray-900">
                {{ messageText ? messageText.length : 0 }} chars
              </p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Anexo</p>
              <p class="text-xl font-semibold text-gray-900">
                {{ attachment ? 'Sim' : 'Não' }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Envio</p>
              <p class="text-xl font-semibold text-gray-900">
                {{ sendType === 'now' ? 'Imediato' : 'Agendado' }}
              </p>
            </div>
          </div>

          <!-- Botões de ação -->
          <div class="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              @click="resetForm"
              class="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Limpar
            </button>
            <button
              type="submit"
              :disabled="submitting || !canSubmit"
              class="px-6 py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-if="sendType === 'now'">
                {{ submitting ? 'Enviando...' : 'Iniciar Campanha' }}
              </span>
              <span v-else>
                {{ submitting ? 'Agendando...' : 'Agendar Campanha' }}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Modal de Confirmação -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 backdrop-blur-[2px] bg-black/20 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Confirmar Campanha</h3>
            <p class="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-700">
            Você está prestes a enviar uma campanha para 
            <strong>{{ recipientType === 'all' ? totalContacts : filteredContactsCount }} contatos</strong>
            <span v-if="sendType === 'scheduled'">
              agendada para <strong>{{ formatDateTime(scheduledDateTime) }}</strong>
            </span>
            <span v-else>
              <strong>imediatamente</strong>
            </span>.
          </p>
        </div>

        <div class="flex gap-3 justify-end">
          <button
            type="button"
            @click="showConfirmModal = false"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmSubmit"
            :disabled="submitting"
            class="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ submitting ? 'Processando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CampaignMessageEditor from '~/components/CampaignMessageEditor.vue'
import CampaignAttachmentUploader from '~/components/CampaignAttachmentUploader.vue'
import { useContatos } from '~/composables/useContatos'
import { useInboxes } from '~/composables/useInboxes'
import { useToast } from '~/composables/useToast'

// Composables
const { fetchContatos, fetchEtiquetas } = useContatos()
const { getInboxes } = useInboxes()
const toast = useToast()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// State
const loading = ref(true)
const submitting = ref(false)
const showConfirmModal = ref(false)
// const showTemplateModal = ref(false) // Removido
// const newTemplateName = ref('') // Removido

// Dados carregados
const contacts = ref([])
const availableTags = ref([])
const inboxes = ref([])
const realFilteredCount = ref(0)

// Formulário
const recipientType = ref('all')
const selectedTags = ref([])
const messageText = ref('')
const attachment = ref(null)
const attachmentCaption = ref('')
const sendType = ref('now')
const scheduledDateTime = ref('')
const selectedInboxId = ref('')

// Erros
const errors = ref({
  message: '',
  inbox: ''
})

// Watchers para contagem de contatos
watch([recipientType, selectedTags], async () => {
  if (recipientType.value === 'all') {
    realFilteredCount.value = totalContacts.value
    return
  }
  
  if (selectedTags.value.length === 0) {
    realFilteredCount.value = 0
    return
  }

  try {
    const tagsIds = selectedTags.value.map(t => t.id || t)
    const { count } = await $fetch('/api/contatos/count', {
      query: {
        type: 'tags',
        tags: tagsIds
      }
    })
    realFilteredCount.value = count
  } catch (error) {
    console.error('Erro ao contar contatos:', error)
  }
}, { deep: true })

// Computed
const totalContacts = computed(() => contacts.value.length) // Nota: Isso conta apenas os carregados na memória (limit 1000). Idealmente deveria vir do backend também.

const filteredContactsCount = computed(() => {
  if (recipientType.value === 'all') return realFilteredCount.value
  if (selectedTags.value.length === 0) return 0
  return realFilteredCount.value
})

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5) // Mínimo 5 minutos no futuro
  return now.toISOString().slice(0, 16)
})

const canSubmit = computed(() => {
  // Verificar se tem mensagem ou anexo
  if (!messageText.value && !attachment.value) return false
  
  // Verificar inbox selecionado
  if (!selectedInboxId.value) return false
  
  // Verificar agendamento se for agendado
  if (sendType.value === 'scheduled' && !scheduledDateTime.value) return false
  
  // Verificar se há destinatários
  if (recipientType.value === 'tags' && selectedTags.value.length === 0) return false
  
  return true
})

const sampleContact = computed(() => {
  if (contacts.value.length > 0) {
    const c = contacts.value[0]
    return {
      nome: c.name || c.nome || 'Cliente',
      sobrenome: c.lastName || c.sobrenome || '',
      email: c.email || 'email@exemplo.com',
      telefone: c.phone || c.telefone || '11999999999',
      cidade: c.city || c.cidade || 'São Paulo',
      empresa: c.company || c.empresa || 'Empresa'
    }
  }
  return {
    nome: 'João Silva',
    sobrenome: 'Silva',
    email: 'joao@email.com',
    telefone: '11999998888',
    cidade: 'São Paulo',
    empresa: 'Empresa ABC'
  }
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const [contactsRes, tagsRes, inboxesRes, countRes, templateRes] = await Promise.all([
      fetchContatos({ limit: 1000 }),
      fetchEtiquetas(),
      getInboxes(),
      $fetch('/api/contatos/count?type=all'),
      $fetch('/api/templates')
    ])

    if (contactsRes?.contatos) {
      contacts.value = contactsRes.contatos
    }

    if (countRes && typeof countRes.count === 'number') {
       realFilteredCount.value = countRes.count
       // Se recipientType for all, o watcher pode não disparar inicialmente se já for o padrão
       if (recipientType.value === 'all') {
         realFilteredCount.value = countRes.count
       }
    }

    if (templateRes?.data?.content) {
      messageText.value = templateRes.data.content
    }

    if (Array.isArray(tagsRes)) {
      availableTags.value = tagsRes
    }

    if (inboxesRes?.success) {
      inboxes.value = inboxesRes.data
    } else if (Array.isArray(inboxesRes)) {
      inboxes.value = inboxesRes
    } else if (inboxesRes?.data) {
      inboxes.value = inboxesRes.data
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    toast.showToast('Erro ao carregar dados', 'error')
  } finally {
    loading.value = false
  }
}

// Funções auxiliares para tags
const getTagId = (tag) => {
  if (typeof tag === 'string') return tag
  // Tenta usar ID, nome ou name como identificador único
  // Se for objeto sem esses campos, usa JSON.stringify para garantir unicidade e evitar [object Object]
  return tag?.id || tag?.nome || tag?.name || JSON.stringify(tag)
}

const getTagName = (tag) => {
  if (typeof tag === 'string') return tag
  return tag?.nome || tag?.name || 'Tag'
}

const getTagColor = (tag) => {
  if (typeof tag === 'string') return '#6366f1' // indigo default
  return tag?.cor || tag?.color || '#6366f1'
}

const getContrastColor = (hexColor) => {
  // Remove o # se existir
  const hex = hexColor.replace('#', '')
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calcula luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Retorna cor escura ou clara baseado na luminância
  return luminance > 0.5 ? '#1f2937' : '#ffffff'
}

const getTagStyle = (tag) => {
  const bgColor = getTagColor(tag)
  const textColor = getContrastColor(bgColor)
  
  return {
    backgroundColor: bgColor,
    color: textColor
  }
}

const toggleTag = (tag) => {
  const tagId = getTagId(tag)
  const index = selectedTags.value.findIndex(t => getTagId(t) === tagId)
  
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const isTagSelected = (tag) => {
  const tagId = getTagId(tag)
  return selectedTags.value.some(t => getTagId(t) === tagId)
}

const validateForm = () => {
  errors.value = { message: '', inbox: '' }
  let isValid = true

  if (!messageText.value && !attachment.value) {
    errors.value.message = 'Digite uma mensagem ou adicione um anexo'
    isValid = false
  }

  if (!selectedInboxId.value) {
    errors.value.inbox = 'Selecione uma caixa de entrada'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) return
  showConfirmModal.value = true
}

const confirmSubmit = async () => {
  submitting.value = true
  
  try {
    let attachmentUrl = null
    let attachmentType = null

    // Upload anexo se existir
    if (attachment.value) {
      const file = attachment.value
      // Garantir que é um arquivo
      if (file instanceof File) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `campaigns/${user.value.id}/${fileName}`

        const { error: uploadError } = await supabase
          .storage
          .from('midias')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase
          .storage
          .from('midias')
          .getPublicUrl(filePath)

        attachmentUrl = publicUrl
        attachmentType = file.type
        
        // Salvar metadados do anexo
        await $fetch('/api/attachments', {
          method: 'POST',
          body: {
            fileUrl: attachmentUrl,
            fileType: attachmentType,
            fileName: file.name,
            caption: attachmentCaption.value
          }
        })
      }
    }

    // Preparar dados da campanha
    const campaignData = {
      recipientType: recipientType.value,
      selectedTags: recipientType.value === 'tags' ? selectedTags.value.map(t => t.id || t) : [],
      messageText: messageText.value || attachmentCaption.value, // Fallback para caption se messageText vazio
      attachmentUrl: attachmentUrl,
      attachmentType: attachmentType,
      sendType: sendType.value,
      scheduledDateTime: sendType.value === 'scheduled' ? scheduledDateTime.value : null,
      inboxId: selectedInboxId.value
    }

    await $fetch('/api/campanhas', {
      method: 'POST',
      body: campaignData
    })
    
    toast.showToast(
      sendType.value === 'now' 
        ? 'Campanha iniciada com sucesso!' 
        : 'Campanha agendada com sucesso!',
      'success'
    )
    
    showConfirmModal.value = false
    resetForm()
    
  } catch (error) {
    console.error('Erro ao enviar campanha:', error)
    toast.showToast('Erro ao processar campanha', 'error')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  recipientType.value = 'all'
  selectedTags.value = []
  messageText.value = ''
  attachment.value = null
  attachmentCaption.value = ''
  sendType.value = 'now'
  scheduledDateTime.value = ''
  selectedInboxId.value = ''
  errors.value = { message: '', inbox: '' }
}

const handleSaveTemplate = async () => {
  if (!messageText.value.trim()) return
  
  submitting.value = true
  try {
    await $fetch('/api/templates', {
      method: 'POST',
      body: {
        content: messageText.value
      }
    })
    
    toast.showToast('Mensagem salva com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error)
    toast.showToast('Erro ao salvar mensagem', 'error')
  } finally {
    submitting.value = false
  }
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  loadData()
})

// Page meta
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Campanhas - Artemis',
  meta: [
    { name: 'description', content: 'Crie campanhas de disparo em massa no WhatsApp' }
  ]
})
</script>

