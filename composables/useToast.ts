import { ref, readonly } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: Date
}

// Estado global compartilhado entre todos os componentes
const notifications = ref<Toast[]>([])

/**
 * Composable global para gerenciar toast notifications
 *
 * @example
 * const { showToast } = useToast()
 * showToast('Operação concluída!', 'success')
 * showToast('Erro ao processar', 'error')
 */
export const useToast = () => {
  /**
   * Exibe uma notificação toast
   * @param message - Mensagem a ser exibida
   * @param type - Tipo da notificação (success, error, warning, info)
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    const id = Date.now() + Math.random() // Garante ID único mesmo em chamadas rápidas

    notifications.value.push({
      id,
      message,
      type,
      timestamp: new Date()
    })

    // Auto-remoção: 3s para success, 5s para outros tipos
    const timeout = type === 'success' ? 3000 : 5000

    setTimeout(() => {
      removeToast(id)
    }, timeout)
  }

  /**
   * Remove uma notificação específica
   * @param id - ID da notificação a ser removida
   */
  const removeToast = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Remove todas as notificações
   */
  const clearAll = () => {
    notifications.value = []
  }

  return {
    notifications: readonly(notifications),
    showToast,
    removeToast,
    clearAll
  }
}
