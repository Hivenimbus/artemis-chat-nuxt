<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Histórico de Campanhas</h1>
          <p class="mt-2 text-gray-600">Acompanhe o status e resultados das suas campanhas</p>
        </div>
        <NuxtLink
          to="/campanhas"
          class="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nova Campanha
        </NuxtLink>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por status</label>
            <select
              v-model="statusFilter"
              @change="loadCampaigns"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todas</option>
              <option value="scheduled">Agendadas</option>
              <option value="in_progress">Em Progresso</option>
              <option value="paused">Pausadas</option>
              <option value="completed">Concluídas</option>
              <option value="failed">Falhadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="campaigns.length === 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
        <p class="text-gray-500 mb-4">
          {{ statusFilter === 'all' ? 'Você ainda não criou nenhuma campanha.' : 'Não há campanhas com este status.' }}
        </p>
        <NuxtLink
          to="/campanhas"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Criar primeira campanha
        </NuxtLink>
      </div>

      <!-- Campaign List -->
      <div v-else class="space-y-4">
        <div
          v-for="campaign in campaigns"
          :key="campaign.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div class="p-6">
            <!-- Header Row -->
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div class="flex items-center gap-3">
                <!-- Status Badge -->
                <span
                  :class="getStatusBadgeClass(campaign.status)"
                  class="px-3 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getStatusLabel(campaign.status) }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ formatDate(campaign.created_at) }}
                </span>
              </div>

              <!-- Stats Summary -->
              <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-1 text-gray-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{{ campaign.stats?.total || 0 }} contatos</span>
                </div>

                <div v-if="campaign.status === 'completed' || campaign.status === 'failed'" class="flex items-center gap-3">
                  <div class="flex items-center gap-1 text-green-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ campaign.stats?.sent || 0 }} enviados</span>
                  </div>
                  <div v-if="campaign.stats?.failed > 0" class="flex items-center gap-1 text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{{ campaign.stats?.failed || 0 }} falhas</span>
                  </div>
                </div>

                <div v-if="campaign.scheduled_at" class="flex items-center gap-1 text-yellow-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ formatDate(campaign.scheduled_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Message Content -->
            <div class="mb-4">
              <p class="text-gray-800" :class="{ 'line-clamp-2': !expandedCampaigns.includes(campaign.id) }">
                {{ campaign.message_text || '(Sem mensagem de texto)' }}
              </p>
              <button
                v-if="campaign.message_text && campaign.message_text.length > 100"
                @click="toggleExpand(campaign.id)"
                class="text-indigo-600 text-sm mt-1 hover:text-indigo-700"
              >
                {{ expandedCampaigns.includes(campaign.id) ? 'Ver menos' : 'Ver mais' }}
              </button>
            </div>

            <!-- Attachments -->
            <div v-if="getAttachments(campaign).length > 0" class="flex flex-wrap gap-2 mb-4">
              <div
                v-for="(att, index) in getAttachments(campaign)"
                :key="index"
                class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
              >
                <svg v-if="att.type?.startsWith('image')" class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <svg v-else-if="att.type?.startsWith('video')" class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else-if="att.type?.startsWith('audio')" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <svg v-else class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{{ getAttachmentLabel(att.type) }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div v-if="canShowActions(campaign.status)" class="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              <!-- Scheduled: Cancel only -->
              <button
                v-if="campaign.status === 'scheduled'"
                @click="handleAction(campaign.id, 'cancel')"
                :disabled="actionLoading === campaign.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>

              <!-- Processing/Sending: Pause + Cancel -->
              <template v-if="campaign.status === 'processing' || campaign.status === 'sending'">
                <button
                  @click="handleAction(campaign.id, 'pause')"
                  :disabled="actionLoading === campaign.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pausar
                </button>
                <button
                  @click="handleAction(campaign.id, 'cancel')"
                  :disabled="actionLoading === campaign.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
              </template>

              <!-- Paused: Resume + Cancel -->
              <template v-if="campaign.status === 'paused'">
                <button
                  @click="handleAction(campaign.id, 'resume')"
                  :disabled="actionLoading === campaign.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Retomar
                </button>
                <button
                  @click="handleAction(campaign.id, 'cancel')"
                  :disabled="actionLoading === campaign.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
              </template>
            </div>
          </div>

          <!-- Progress Bar for In-Progress -->
          <div v-if="campaign.status === 'processing' || campaign.status === 'sending'" class="px-6 pb-4">
            <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{{ getProgressPercent(campaign) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: getProgressPercent(campaign) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '~/composables/useToast'

const toast = useToast()

// State
const loading = ref(true)
const campaigns = ref([])
const statusFilter = ref('all')
const expandedCampaigns = ref([])
const actionLoading = ref(null)

// Load campaigns
const loadCampaigns = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (statusFilter.value !== 'all') {
      params.append('status', statusFilter.value)
    }

    const response = await $fetch(`/api/campanhas?${params.toString()}`)
    
    if (response.success) {
      campaigns.value = response.data
    }
  } catch (error) {
    console.error('Erro ao carregar campanhas:', error)
    toast.showToast('Erro ao carregar campanhas', 'error')
  } finally {
    loading.value = false
  }
}

// Methods
const getStatusLabel = (status) => {
  const labels = {
    draft: 'Rascunho',
    scheduled: 'Agendada',
    processing: 'Processando',
    sending: 'Enviando',
    completed: 'Concluída',
    failed: 'Falhou',
    paused: 'Pausada',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

const getStatusBadgeClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    sending: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    paused: 'bg-orange-100 text-orange-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getAttachments = (campaign) => {
  if (campaign.attachments && Array.isArray(campaign.attachments)) {
    return campaign.attachments
  }
  // Legacy fallback
  if (campaign.attachment_url) {
    return [{ url: campaign.attachment_url, type: campaign.attachment_type }]
  }
  return []
}

const getAttachmentLabel = (type) => {
  if (!type) return 'Arquivo'
  if (type.startsWith('image')) return 'Imagem'
  if (type.startsWith('video')) return 'Vídeo'
  if (type.startsWith('audio')) return 'Áudio'
  return 'Documento'
}

const getProgressPercent = (campaign) => {
  if (!campaign.stats?.total || campaign.stats.total === 0) return 0
  const processed = campaign.stats.processed || 0
  return Math.round((processed / campaign.stats.total) * 100)
}

const toggleExpand = (id) => {
  const index = expandedCampaigns.value.indexOf(id)
  if (index > -1) {
    expandedCampaigns.value.splice(index, 1)
  } else {
    expandedCampaigns.value.push(id)
  }
}

const canShowActions = (status) => {
  return ['scheduled', 'processing', 'sending', 'paused'].includes(status)
}

const handleAction = async (campaignId, action) => {
  actionLoading.value = campaignId
  
  const actionLabels = {
    cancel: 'cancelar',
    pause: 'pausar',
    resume: 'retomar'
  }
  
  try {
    const response = await $fetch(`/api/campanhas/${campaignId}`, {
      method: 'PATCH',
      body: { action }
    })
    
    if (response.success) {
      // Update local state
      const index = campaigns.value.findIndex(c => c.id === campaignId)
      if (index > -1) {
        campaigns.value[index] = response.data
      }
      
      const successMessages = {
        cancel: 'Campanha cancelada com sucesso',
        pause: 'Campanha pausada com sucesso',
        resume: 'Campanha retomada com sucesso'
      }
      toast.showToast(successMessages[action], 'success')
    }
  } catch (error) {
    console.error(`Erro ao ${actionLabels[action]} campanha:`, error)
    toast.showToast(`Erro ao ${actionLabels[action]} campanha`, 'error')
  } finally {
    actionLoading.value = null
  }
}

// Lifecycle
onMounted(() => {
  loadCampaigns()
})

// Page meta
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Histórico de Campanhas - Artemis',
  meta: [
    { name: 'description', content: 'Acompanhe o status e resultados das suas campanhas' }
  ]
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

