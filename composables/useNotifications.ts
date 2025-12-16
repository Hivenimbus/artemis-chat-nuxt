export const useNotifications = () => {
  const notifications = useState('notifications', () => [])
  const loading = useState('notifications:loading', () => false)
  const user = useSupabaseUser() // We might not strictly need this if we rely on server context user, but good for local checks
  const { userData } = useUser() // Better to use useUser from the app
  
  // Use a ref for polling interval to clear it on unmount if needed
  const pollingInterval = useState('notifications:polling', () => null)

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const fetchNotifications = async () => {
    // If we don't have user data locally, the server call will likely fail 401, but that's handled
    if (!userData.value && !user.value) return 

    loading.value = true
    try {
      const response = await $fetch('/api/notifications')
      if (response.success) {
        notifications.value = response.data
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (id) => {
    try {
      await $fetch('/api/notifications/mark-read', {
        method: 'POST',
        body: { id }
      })

      // Update local state
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value[index].read = true
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await $fetch('/api/notifications/mark-read', {
        method: 'POST',
        body: { all: true }
      })

      // Update local state
      notifications.value.forEach(n => n.read = true)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const startPolling = () => {
     if (process.client && !pollingInterval.value) {
        // Initial fetch
        fetchNotifications()
        
        // Poll every 30 seconds
        pollingInterval.value = setInterval(() => {
           // Only fetch if tab is visible to save resources
           if (document.visibilityState === 'visible') {
              fetchNotifications()
           }
        }, 30000)
     }
  }

  const clearNotifications = async () => {
    try {
      await $fetch('/api/notifications/clear', {
        method: 'DELETE'
      })
      notifications.value = []
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  // Watch for user changes to fetch notifications
  watch(() => userData.value, (newUser) => {
    if (newUser) {
      fetchNotifications()
    } else {
      notifications.value = []
    }
  }, { immediate: true })

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    startPolling
  }
}
