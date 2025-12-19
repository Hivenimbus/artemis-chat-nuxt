import { ref, readonly } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

// Global state
const isVisible = ref(false)
const state = ref<ConfirmOptions>({
  message: '',
  title: 'Confirmação',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  type: 'warning'
})

let resolvePromise: ((value: boolean) => void) | null = null

export const useConfirm = () => {
  const confirm = (msgOrOptions: string | ConfirmOptions): Promise<boolean> => {
    if (typeof msgOrOptions === 'string') {
      state.value = {
        message: msgOrOptions,
        title: 'Confirmação',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'warning'
      }
    } else {
      state.value = {
        title: 'Confirmação',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'warning',
        ...msgOrOptions
      }
    }
    
    isVisible.value = true
    
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    isVisible.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  const handleCancel = () => {
    isVisible.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    isVisible: readonly(isVisible),
    options: readonly(state),
    confirm, // The function to call from components
    handleConfirm, // Internal use by dialog
    handleCancel   // Internal use by dialog
  }
}

