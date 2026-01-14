<template>
  <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
    <div class="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
      <h3 class="text-sm font-semibold text-gray-900">Notificações</h3>
      <button 
        v-if="unreadCount > 0"
        @click="markAllAsRead"
        class="text-xs text-red-600 hover:text-red-800"
      >
        Marcar todas como lidas
      </button>
    </div>

    <div class="max-h-96 overflow-y-auto">
      <div v-if="loading" class="p-4 text-center text-gray-500 text-sm">
        Carregando...
      </div>
      <div v-else-if="notifications.length === 0" class="p-4 text-center text-gray-500 text-sm">
        Nenhuma notificação
      </div>
      <div v-else>
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors cursor-pointer group relative"
          :class="{ 'bg-red-50/50': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start gap-3 pr-6">
             <div class="flex-shrink-0 mt-0.5">
               <!-- Icon based on type -->
               <span v-if="notification.type === 'reminder'" class="text-yellow-500">🔔</span>
               <span v-else-if="notification.type === 'campaign'" class="text-red-500">📢</span>
               <span v-else class="text-gray-500">ℹ️</span>
             </div>
             <div class="flex-1 min-w-0">
               <p class="text-sm font-medium text-gray-900" :class="{ 'font-semibold': !notification.read }">
                 {{ notification.title }}
               </p>
               <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">
                 {{ notification.message }}
               </p>
               <p class="text-xs text-gray-400 mt-1">
                 {{ formatDate(notification.created_at) }}
               </p>
             </div>
             <div v-if="!notification.read" class="w-2 h-2 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
          </div>
          
          <button
            @click.stop="handleDelete(notification.id)"
            class="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-red-50"
            title="Excluir notificação"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <div class="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
      <button 
        @click="handleClearNotifications"
        class="text-xs text-red-600 hover:text-red-800 font-medium w-full py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="notifications.length === 0"
      >
        Limpar notificações
      </button>
    </div>
  </div>
</template>

<script setup>
import { useNotifications } from '~/composables/useNotifications'
import { useRouter } from 'vue-router'

const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, deleteNotification, loading } = useNotifications()
const router = useRouter()

const emit = defineEmits(['close'])

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    await markAsRead(notification.id)
  }
  
  if (notification.link) {
    router.push(notification.link)
  }
  
  emit('close')
}

const handleDelete = async (id) => {
  await deleteNotification(id)
}

const handleClearNotifications = async () => {
  if (notifications.value.length === 0) return
  await clearNotifications()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}m atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays}d atrás`
  
  return date.toLocaleDateString('pt-BR')
}
</script>

