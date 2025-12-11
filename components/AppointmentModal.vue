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
              <div class="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2 space-y-2">
                <div v-if="contacts.length === 0" class="text-sm text-gray-500 text-center py-2">
                  Nenhum contato disponível
                </div>
                <div v-for="contact in contacts" :key="contact.id" class="flex items-center">
                  <input
                    type="checkbox"
                    :id="'contact-' + contact.id"
                    :value="contact.id"
                    v-model="formData.contact_ids"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label :for="'contact-' + contact.id" class="ml-2 block text-sm text-gray-900">
                    {{ contact.name }} {{ contact.sobrenome || '' }}
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

const handleDelete = () => {
  if (props.appointment && confirm('Tem certeza que deseja excluir este agendamento?')) {
    emit('delete', props.appointment.id)
  }
}
</script>

