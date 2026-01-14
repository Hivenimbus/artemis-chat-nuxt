<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Agendamentos</h1>
        <p class="mt-2 text-gray-600">Gerencie seus compromissos, lembretes e agendamentos de mensagens</p>
      </div>

      <!-- Actions Bar -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          @click="openNewAppointmentModal"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
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
          class="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos os status</option>
          <option value="scheduled">Agendado</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
          <option value="failed">Falhou</option>
          <option value="no_show">Não compareceu</option>
        </select>
        
        <select
          v-model="typeFilter"
          class="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos os tipos</option>
          <option value="reminder">Lembretes</option>
          <option value="message_schedule">Mensagens</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Calendar View -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                'min-h-24 p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors',
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                day.isToday ? 'border-indigo-500 border-2' : 'border-gray-200',
                isSelectedDate(day.date) ? 'bg-red-50' : 'hover:bg-gray-50'
              ]"
            >
              <div class="text-sm font-medium" :class="day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'">
                {{ day.day }}
              </div>
              <div class="mt-1 space-y-1">
                <div
                  v-for="appointment in day.appointments.slice(0, 3)"
                  :key="appointment.id"
                  :class="[
                    'text-xs px-1 py-0.5 rounded truncate flex items-center gap-1',
                    getAppointmentColor(appointment)
                  ]"
                >
                  <span v-if="appointment.type === 'message_schedule'" title="Mensagem">💬</span>
                  <span v-else title="Lembrete">🔔</span>
                  {{ appointment.title }}
                </div>
                <div v-if="day.appointments.length > 3" class="text-xs text-gray-500">
                  +{{ day.appointments.length - 3 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Appointments List -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ selectedDate ? `Agendamentos - ${selectedDate.toLocaleDateString('pt-BR')}` : 'Agendamentos de Hoje' }}
          </h3>

          <div class="space-y-3 flex-1 overflow-y-auto">
            <div
              v-for="appointment in filteredAppointments"
              :key="appointment.id"
              @click="editAppointment(appointment)"
              class="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                     <span v-if="appointment.type === 'message_schedule'" class="text-blue-500" title="Mensagem">💬</span>
                     <span v-else class="text-yellow-500" title="Lembrete">🔔</span>
                     <h4 class="font-medium text-gray-900">{{ appointment.title }}</h4>
                  </div>
                  
                  <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                    {{ appointment.description || appointment.message_text }}
                  </p>
                  
                  <div class="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ formatTime(appointment.start_time) }}
                    <span v-if="appointment.end_time && appointment.type === 'appointment'">
                       - {{ formatTime(appointment.end_time) }}
                    </span>
                  </div>
                  
                  <div v-if="appointment.agendamento_contatos?.length > 0" class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    {{ getContactsNames(appointment) }}
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
      :contacts="contacts"
      :inboxes="inboxes"
      @save="saveAppointment"
      @delete="deleteAppointment"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppointmentModal from '~/components/AppointmentModal.vue'
import { useContatos } from '~/composables/useContatos'
import { useInboxes } from '~/composables/useInboxes'
import { useToast } from '~/composables/useToast'

// State
const currentDate = ref(new Date())
const selectedDate = ref(null)
const showModal = ref(false)
const selectedAppointment = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const loading = ref(false)

const appointments = ref([])
const contacts = ref([])
const inboxes = ref([])

const { fetchContatos } = useContatos()
const { getInboxes } = useInboxes()
const toast = useToast()

// Load data
const loadData = async () => {
  loading.value = true
  try {
    // Parallel fetch
    const [appsRes, contactsRes, inboxesRes] = await Promise.all([
      $fetch('/api/agendamentos'),
      fetchContatos({ limit: 100 }), // Get up to 100 contacts for selection
      getInboxes()
    ])

    if (appsRes.success) {
      appointments.value = appsRes.data
    }
    
    if (contactsRes && contactsRes.contatos) {
      contacts.value = contactsRes.contatos
    }

    if (inboxesRes.success) {
      inboxes.value = inboxesRes.data
    } else if (Array.isArray(inboxesRes)) {
       inboxes.value = inboxesRes
    } else if (inboxesRes.data) {
       inboxes.value = inboxesRes.data
    }

  } catch (error) {
    console.error('Error loading data:', error)
    if (toast) toast.error('Erro ao carregar dados')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Computed
const currentMonth = computed(() => {
  return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0) // Not used directly but good to know

  const days = []
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay()) // Go to Sunday

  const today = new Date()

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const dayAppointments = appointments.value.filter(app => {
      const appDate = new Date(app.start_time)
      return appDate.toDateString() === date.toDateString()
    })

    days.push({
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
      appointments: dayAppointments
    })
  }

  return days
})

const filteredAppointments = computed(() => {
  let filtered = appointments.value

  if (selectedDate.value) {
    filtered = filtered.filter(app => {
      const appDate = new Date(app.start_time)
      return appDate.toDateString() === selectedDate.value.toDateString()
    })
  } else {
    // Default to today if no date selected
    const today = new Date()
    filtered = filtered.filter(app => {
      const appDate = new Date(app.start_time)
      return appDate.toDateString() === today.toDateString()
    })
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(app =>
      app.title.toLowerCase().includes(query) ||
      (app.description && app.description.toLowerCase().includes(query)) ||
      (app.message_text && app.message_text.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(app => app.status === statusFilter.value)
  }
  
  if (typeFilter.value) {
    filtered = filtered.filter(app => app.type === typeFilter.value)
  }

  return filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
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

const saveAppointment = async (appointmentData) => {
  try {
    let result
    if (appointmentData.id) {
      // Update
      const res = await $fetch(`/api/agendamentos/${appointmentData.id}`, {
        method: 'PUT',
        body: appointmentData
      })
      result = res.data
      
      // Update local state
      const index = appointments.value.findIndex(a => a.id === appointmentData.id)
      if (index !== -1) {
        // Need to merge with existing or re-fetch to get contact details resolved
        // For simplicity, just update fields we know, but fetching again is safer for relations
        appointments.value[index] = { ...appointments.value[index], ...result }
        // To get contacts populated properly in list without reload, we might need to manually update:
        // But agendamento_contatos is nested.
        loadData() // Reload to be safe and simple
      }
    } else {
      // Create
      const res = await $fetch('/api/agendamentos', {
        method: 'POST',
        body: appointmentData
      })
      result = res.data
      // Refresh list
      loadData()
    }
    
    closeModal()
    if (toast) toast.success('Agendamento salvo com sucesso')

  } catch (error) {
    console.error('Error saving appointment:', error)
    if (toast) toast.error('Erro ao salvar agendamento')
  }
}

const deleteAppointment = async (id) => {
  try {
    await $fetch(`/api/agendamentos/${id}`, {
      method: 'DELETE'
    })
    
    appointments.value = appointments.value.filter(app => app.id !== id)
    closeModal()
    if (toast) toast.success('Agendamento excluído')

  } catch (error) {
    console.error('Error deleting appointment:', error)
    if (toast) toast.error('Erro ao excluir agendamento')
  }
}

const closeModal = () => {
  showModal.value = false
  selectedAppointment.value = null
}

const getContactsNames = (appointment) => {
  if (!appointment.agendamento_contatos || appointment.agendamento_contatos.length === 0) return ''
  const names = appointment.agendamento_contatos
    .map(ac => ac.contatos?.nome)
    .filter(n => n)
  
  if (names.length === 0) return 'Contato desconhecido'
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1}`
}

const formatTime = (dateTime) => {
  return new Date(dateTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getAppointmentColor = (appointment) => {
  if (appointment.color) {
     // Map color names to classes if needed, or use inline style.
     // Assuming color is one of our preset names:
     const map = {
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        red: 'bg-red-100 text-red-800',
        purple: 'bg-purple-100 text-purple-800'
     }
     if (map[appointment.color]) return map[appointment.color]
  }

  if (appointment.type === 'message_schedule') return 'bg-blue-100 text-blue-800'
  if (appointment.type === 'reminder') return 'bg-yellow-100 text-yellow-800'
  // appointment default
  return getStatusColor(appointment.status)
}

const getStatusColor = (status) => {
  const colors = {
    scheduled: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800',
    no_show: 'bg-orange-100 text-orange-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  const texts = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    failed: 'Falhou',
    no_show: 'Não compareceu'
  }
  return texts[status] || status
}

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

// Meta tags
useHead({
  title: 'Agendamentos',
  meta: [
    { name: 'description', content: 'Gerencie seus agendamentos' }
  ]
})
</script>
