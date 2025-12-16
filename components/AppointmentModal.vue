<template>
  <div class="fixed inset-0 backdrop-blur-[2px] bg-opacity-20 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ appointment ? 'Editar ' + getTypeText(appointment.type) : 'Novo Agendamento' }}
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Type Selector (only for new appointments) -->
          <div v-if="!appointment" class="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              v-for="type in types"
              :key="type.value"
              @click="formData.type = type.value"
              :class="[
                'flex-1 py-2 text-sm font-medium border-b-2 transition-colors',
                formData.type === type.value
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ type.label }}
            </button>
          </div>

          <!-- Common Fields -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              v-model="formData.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Título"
            />
          </div>

          <!-- Fields for Reminder -->
          <div v-if="formData.type === 'reminder'">
             <label class="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descrição"
            ></textarea>
          </div>

          <!-- Fields for Message Schedule -->
          <div v-if="formData.type === 'message_schedule'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Mensagem *
            </label>
            <textarea
              v-model="formData.message_text"
              required
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Digite a mensagem a ser enviada..."
            ></textarea>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Enviar de (Inbox) *
              </label>
              <select
                v-model="formData.inbox_id"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione uma caixa de entrada</option>
                <option
                  v-for="inbox in inboxes"
                  :key="inbox.id"
                  :value="inbox.id"
                >
                  {{ inbox.name }}
                </option>
              </select>
            </div>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Contatos (Destinatários) *
              </label>
              
              <!-- Contact Filters -->
              <div class="flex flex-col sm:flex-row gap-2 mb-2">
                 <div class="relative flex-1">
                    <input 
                      v-model="contactSearch" 
                      type="text" 
                      placeholder="Buscar contatos..." 
                      class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <svg class="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                 </div>
                 <select 
                    v-model="selectedTagFilter" 
                    class="py-1.5 pl-2 pr-8 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                 >
                    <option value="">Todas as tags</option>
                    <option v-for="tag in availableTags" :key="tag.name" :value="tag.name">
                       {{ tag.name }}
                    </option>
                 </select>
              </div>

              <div class="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2 space-y-2">
                <div v-if="filteredContacts.length === 0" class="text-sm text-gray-500 text-center py-2">
                  {{ contacts.length === 0 ? 'Nenhum contato disponível' : 'Nenhum contato encontrado' }}
                </div>
                <div v-for="contact in filteredContacts" :key="contact.id" class="flex items-center">
                  <input
                    type="checkbox"
                    :id="'contact-' + contact.id"
                    :value="contact.id"
                    v-model="formData.contact_ids"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label :for="'contact-' + contact.id" class="ml-2 block text-sm text-gray-900 flex-1 flex items-center gap-2">
                    <span>{{ contact.name }} {{ contact.sobrenome || '' }}</span>
                    <span v-if="contact.tags && contact.tags.length" class="inline-flex gap-1">
                      <span 
                        v-for="(tag, idx) in contact.tags.slice(0, 2)" 
                        :key="idx"
                        class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        :class="[
                           typeof tag === 'object' && tag.color ? `text-white` : 'bg-gray-100 text-gray-600'
                        ]"
                        :style="typeof tag === 'object' && tag.color ? { backgroundColor: tag.color } : {}"
                      >
                        {{ typeof tag === 'object' ? tag.name : tag }}
                      </span>
                      <span v-if="contact.tags.length > 2" class="text-xs text-gray-400">+{{ contact.tags.length - 2 }}</span>
                    </span>
                  </label>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ formData.contact_ids.length }} contatos selecionados</p>
            </div>
          </div>

          <!-- Date/Time Fields -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora *
              </label>
              <input
                v-model="formData.date_time"
                type="datetime-local"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Color for Reminder -->
          <div v-if="formData.type === 'reminder'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cor
            </label>
            <div class="flex gap-2">
              <button
                type="button"
                v-for="color in colors"
                :key="color.value"
                @click="formData.color = color.value"
                :class="[
                  'w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                  color.class,
                  formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                ]"
                :title="color.label"
              ></button>
            </div>
          </div>

           <!-- Status -->
          <div v-if="appointment">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              v-model="formData.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="scheduled">Agendado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="failed" v-if="formData.type === 'message_schedule'">Falhou</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              v-if="appointment"
              type="button"
              @click="handleDelete"
              class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {{ appointment ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
        @click.self="cancelDelete"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
          <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
            Excluir Agendamento
          </h3>
          <p class="text-sm text-gray-600 text-center mb-6">
            Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              @click="cancelDelete"
              class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="confirmDelete"
              class="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  appointment: {
    type: Object,
    default: null
  },
  contacts: {
    type: Array,
    required: true
  },
  inboxes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'delete', 'close'])

const types = [
  { value: 'reminder', label: 'Lembrete' },
  { value: 'message_schedule', label: 'Agendar Mensagem' }
]

const colors = [
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' }
]

const formData = ref({
  id: null,
  type: 'reminder',
  contact_id: '',
  contact_ids: [],
  title: '',
  description: '',
  message_text: '',
  inbox_id: '',
  date_time: '',
  status: 'scheduled',
  color: 'blue'
})

const getTypeText = (type) => {
  const t = types.find(x => x.value === type)
  return t ? t.label : 'Agendamento'
}

const resetForm = () => {
  formData.value = {
    id: null,
    type: 'reminder',
    contact_id: '',
    contact_ids: [],
    title: '',
    description: '',
    message_text: '',
    inbox_id: '',
    date_time: '',
    status: 'scheduled',
    color: 'blue'
  }
}

// Watch for appointment changes to populate form
watch(() => props.appointment, (newAppointment) => {
  if (newAppointment) {
    formData.value = {
      ...newAppointment,
      contact_id: newAppointment.agendamento_contatos?.[0]?.contato_id || '',
      contact_ids: newAppointment.agendamento_contatos?.map(ac => ac.contato_id) || [],
      date_time: new Date(newAppointment.start_time).toISOString().slice(0, 16)
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const handleSubmit = () => {
  // Prepare data for API
  const start = new Date(formData.value.date_time)
  const end = new Date(start.getTime() + 30 * 60000) // Default 30 min duration for backend compatibility

  const appointmentData = {
    ...formData.value,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  }

  // Handle contacts based on type
  if (formData.value.type === 'message_schedule') {
      // contact_ids is already bound
  } else {
      appointmentData.contact_ids = []
  }
  
  // Clean up
  delete appointmentData.date_time
  delete appointmentData.contact_id // we send contact_ids array to API
  delete appointmentData.agendamento_contatos // remove if editing

  emit('save', appointmentData)
}

// Delete confirmation modal state
const showDeleteConfirm = ref(false)

// Contact Filters
const contactSearch = ref('')
const selectedTagFilter = ref('')

// Computed properties for filters
const availableTags = computed(() => {
  const tags = new Set()
  const tagObjects = []
  
  props.contacts.forEach(contact => {
    if (contact.tags && Array.isArray(contact.tags)) {
      contact.tags.forEach(tag => {
        // Handle both object tags and simple string tags if any
        const tagName = typeof tag === 'object' ? tag.name : tag
        const tagColor = typeof tag === 'object' ? tag.color : '#6B7280'
        
        if (!tags.has(tagName)) {
          tags.add(tagName)
          tagObjects.push({ name: tagName, color: tagColor })
        }
      })
    }
  })
  
  return tagObjects.sort((a, b) => a.name.localeCompare(b.name))
})

const filteredContacts = computed(() => {
  let filtered = props.contacts

  // Filter by name
  if (contactSearch.value) {
    const searchLower = contactSearch.value.toLowerCase()
    filtered = filtered.filter(contact => {
      const fullName = `${contact.name || ''} ${contact.sobrenome || ''}`.toLowerCase()
      return fullName.includes(searchLower)
    })
  }

  // Filter by tag
  if (selectedTagFilter.value) {
    filtered = filtered.filter(contact => {
      if (!contact.tags || !Array.isArray(contact.tags)) return false
      return contact.tags.some(tag => {
        const tagName = typeof tag === 'object' ? tag.name : tag
        return tagName === selectedTagFilter.value
      })
    })
  }

  return filtered
})

const handleDelete = () => {
  if (props.appointment) {
    showDeleteConfirm.value = true
  }
}

const confirmDelete = () => {
  if (props.appointment) {
    emit('delete', props.appointment.id)
  }
  showDeleteConfirm.value = false
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

