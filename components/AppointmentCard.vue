<template>
  <div
    class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between mb-2">
      <h3 class="font-medium text-gray-900">{{ appointment.title }}</h3>
      <span
        :class="[
          'px-2 py-1 text-xs font-medium rounded-full',
          getStatusColor(appointment.status)
        ]"
      >
        {{ getStatusText(appointment.status) }}
      </span>
    </div>

    <p v-if="appointment.description" class="text-sm text-gray-600 mb-3">
      {{ appointment.description }}
    </p>

    <div class="space-y-1 text-sm text-gray-500">
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{{ formatDateTime(appointment.date_time) }}</span>
        <span class="text-gray-400">•</span>
        <span>{{ appointment.duration }} min</span>
      </div>

      <div class="flex items-center gap-2">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <span>{{ contactName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  appointment: {
    type: Object,
    required: true
  },
  contactName: {
    type: String,
    default: 'Contato não encontrado'
  }
})

const emit = defineEmits(['click'])

const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusColor = (status) => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-yellow-100 text-yellow-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  const texts = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu'
  }
  return texts[status] || status
}
</script>