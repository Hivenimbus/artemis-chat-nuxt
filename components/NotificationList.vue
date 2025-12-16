<template>
  <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
    <div class="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
      <h3 class="text-sm font-semibold text-gray-900">Notificações</h3>
      <button 
        v-if="unreadCount > 0"
        @click="markAllAsRead"
        class="text-xs text-indigo-600 hover:text-indigo-800"
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
          class="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors cursor-pointer"
          :class="{ 'bg-indigo-50/50': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start gap-3">
             <div class="flex-shrink-0 mt-0.5">
               <!-- Icon based on type -->
               <span v-if="notification.type === 'reminder'" class="text-yellow-500">🔔</span>
               <span v-else-if="notification.type === 'campaign'" class="text-indigo-500">📢</span>
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
             <div v-if="!notification.read" class="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotifications } from '~/composables/useNotifications'
import { useRouter } from 'vue-router'

const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()
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

