<template>
  <div class="fixed inset-0 backdrop-blur-[2px] bg-opacity-20 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ appointment ? 'Editar Agendamento' : 'Novo Agendamento' }}
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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              v-model="formData.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Título do agendamento"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descrição do agendamento"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Contato *
            </label>
            <select
              v-model="formData.contact_id"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecione um contato</option>
              <option
                v-for="contact in contacts"
                :key="contact.id"
                :value="contact.id"
              >
                {{ contact.name }}
              </option>
            </select>
          </div>

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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Duração (minutos)
            </label>
            <select
              v-model="formData.duration"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1h 30min</option>
              <option value="120">2 horas</option>
            </select>
          </div>

          <div>
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
              <option value="no_show">Não compareceu</option>
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
import { ref, watch } from 'vue'

const props = defineProps({
  appointment: {
    type: Object,
    default: null
  },
  contacts: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['save', 'delete', 'close'])

const formData = ref({
  id: null,
  contact_id: '',
  title: '',
  description: '',
  date_time: '',
  duration: 30,
  status: 'scheduled'
})

// Watch for appointment changes to populate form
watch(() => props.appointment, (newAppointment) => {
  if (newAppointment) {
    formData.value = {
      ...newAppointment,
      date_time: new Date(newAppointment.date_time).toISOString().slice(0, 16)
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  formData.value = {
    id: null,
    contact_id: '',
    title: '',
    description: '',
    date_time: '',
    duration: 30,
    status: 'scheduled'
  }
}

const handleSubmit = () => {
  const appointmentData = {
    ...formData.value,
    date_time: new Date(formData.value.date_time).toISOString()
  }

  emit('save', appointmentData)
}

const handleDelete = () => {
  if (props.appointment && confirm('Tem certeza que deseja excluir este agendamento?')) {
    emit('delete', props.appointment.id)
  }
}
</script>