<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Agendamentos</h1>
        <p class="mt-2 text-gray-600">Gerencie seus compromissos e tarefas</p>
      </div>

      <!-- Actions Bar -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          @click="openNewAppointmentModal"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Novo Agendamento
        </button>

        <div class="flex-1 max-w-md">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar agendamentos..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>

        <select
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos os status</option>
          <option value="scheduled">Agendado</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
          <option value="no_show">Não compareceu</option>
        </select>
      </div>

      <!-- Calendar View -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Calendar -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ currentMonth }}
            </h2>
            <div class="flex gap-2">
              <button
                @click="previousMonth"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button
                @click="nextMonth"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1 mb-2">
            <div class="text-center text-sm font-medium text-gray-500 py-2">Dom</div>
            <div class="text-center text-sm font-medium text-gray-500 py-2">Seg</div>
            <div class="text-center text-sm font-medium text-gray-500 py-2">Ter</div>
            <div class="text-center text-sm font-medium text-gray-500 py-2">Qua</div>
            <div class="text-center text-sm font-medium text-gray-500 py-2">Qui</div>
            <div class="text-center text-sm font-medium text-gray-500 py-2">Sex</div>
            <div class="text-center text-sm font-medium text-gray-500 py-2">Sáb</div>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="day in calendarDays"
              :key="day.date"
              @click="selectDate(day)"
              :class="[
                'min-h-20 p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors',
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                day.isToday ? 'border-indigo-500 border-2' : 'border-gray-200',
                isSelectedDate(day.date) ? 'bg-indigo-50' : 'hover:bg-gray-50'
              ]"
            >
              <div class="text-sm font-medium" :class="day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'">
                {{ day.day }}
              </div>
              <div class="mt-1 space-y-1">
                <div
                  v-for="appointment in day.appointments.slice(0, 2)"
                  :key="appointment.id"
                  @click.stop="editAppointment(appointment)"
                  :class="[
                    'text-xs px-1 py-0.5 rounded truncate',
                    getStatusColor(appointment.status)
                  ]"
                >
                  {{ appointment.title }}
                </div>
                <div v-if="day.appointments.length > 2" class="text-xs text-gray-500">
                  +{{ day.appointments.length - 2 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Appointments List -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ selectedDate ? `Agendamentos - ${selectedDate.toLocaleDateString('pt-BR')}` : 'Agendamentos de Hoje' }}
          </h3>

          <div class="space-y-3">
            <div
              v-for="appointment in filteredAppointments"
              :key="appointment.id"
              @click="editAppointment(appointment)"
              class="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{{ appointment.title }}</h4>
                  <p class="text-sm text-gray-600 mt-1">{{ appointment.description }}</p>
                  <div class="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ formatTime(appointment.date_time) }}
                  </div>
                  <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    {{ getContactName(appointment.contact_id) }}
                  </div>
                </div>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getStatusColor(appointment.status)
                  ]"
                >
                  {{ getStatusText(appointment.status) }}
                </span>
              </div>
            </div>

            <div v-if="filteredAppointments.length === 0" class="text-center text-gray-500 py-8">
              Nenhum agendamento encontrado
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Appointment Modal -->
    <AppointmentModal
      v-if="showModal"
      :appointment="selectedAppointment"
      :contacts="mockContacts"
      @save="saveAppointment"
      @delete="deleteAppointment"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppointmentModal from '~/components/AppointmentModal.vue'

// State
const currentDate = ref(new Date())
const selectedDate = ref(null)
const showModal = ref(false)
const selectedAppointment = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')

// Mock data
const mockContacts = ref([
  { id: 1, name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-0001' },
  { id: 2, name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 99999-0002' },
  { id: 3, name: 'Pedro Oliveira', email: 'pedro@email.com', phone: '(11) 99999-0003' },
  { id: 4, name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-0004' },
  { id: 5, name: 'Carlos Lima', email: 'carlos@email.com', phone: '(11) 99999-0005' }
])

const mockAppointments = ref([
  {
    id: 1,
    contact_id: 1,
    title: 'Reunião de acompanhamento',
    description: 'Discutir andamento do projeto',
    date_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    status: 'scheduled'
  },
  {
    id: 2,
    contact_id: 2,
    title: 'Apresentação de proposta',
    description: 'Apresentar proposta comercial',
    date_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    status: 'scheduled'
  },
  {
    id: 3,
    contact_id: 3,
    title: 'Follow-up vendas',
    description: 'Contato pós-venda',
    date_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 15,
    status: 'completed'
  }
])

// Load from localStorage on mount
onMounted(() => {
  const savedAppointments = localStorage.getItem('appointments')
  if (savedAppointments) {
    mockAppointments.value = JSON.parse(savedAppointments)
  }
})

// Computed
const currentMonth = computed(() => {
  return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const today = new Date()

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const appointments = mockAppointments.value.filter(app => {
      const appDate = new Date(app.date_time)
      return appDate.toDateString() === date.toDateString()
    })

    days.push({
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
      appointments
    })
  }

  return days
})

const filteredAppointments = computed(() => {
  let filtered = mockAppointments.value

  if (selectedDate.value) {
    filtered = filtered.filter(app => {
      const appDate = new Date(app.date_time)
      return appDate.toDateString() === selectedDate.value.toDateString()
    })
  } else {
    filtered = filtered.filter(app => {
      const appDate = new Date(app.date_time)
      return appDate.toDateString() === new Date().toDateString()
    })
  }

  if (searchQuery.value) {
    filtered = filtered.filter(app =>
      app.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(app => app.status === statusFilter.value)
  }

  return filtered.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
})

// Methods
const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

const selectDate = (day) => {
  selectedDate.value = day.date
}

const isSelectedDate = (date) => {
  return selectedDate.value && date.toDateString() === selectedDate.value.toDateString()
}

const openNewAppointmentModal = () => {
  selectedAppointment.value = null
  showModal.value = true
}

const editAppointment = (appointment) => {
  selectedAppointment.value = appointment
  showModal.value = true
}

const saveAppointment = (appointment) => {
  if (appointment.id) {
    // Update existing
    const index = mockAppointments.value.findIndex(app => app.id === appointment.id)
    if (index !== -1) {
      mockAppointments.value[index] = appointment
    }
  } else {
    // Create new
    appointment.id = Date.now()
    mockAppointments.value.push(appointment)
  }

  localStorage.setItem('appointments', JSON.stringify(mockAppointments.value))
  closeModal()
}

const deleteAppointment = (id) => {
  mockAppointments.value = mockAppointments.value.filter(app => app.id !== id)
  localStorage.setItem('appointments', JSON.stringify(mockAppointments.value))
  closeModal()
}

const closeModal = () => {
  showModal.value = false
  selectedAppointment.value = null
}

const getContactName = (contactId) => {
  const contact = mockContacts.value.find(c => c.id === contactId)
  return contact ? contact.name : 'Contato não encontrado'
}

const formatTime = (dateTime) => {
  return new Date(dateTime).toLocaleTimeString('pt-BR', {
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