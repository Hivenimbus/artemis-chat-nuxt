export const useInboxes = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const createInbox = async (data: { name: string; description?: string }) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/inboxes', {
        method: 'POST',
        body: data
      })

      return response
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Erro ao criar caixa de entrada'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getInboxes = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/inboxes')
      return response
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Erro ao buscar caixas de entrada'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteInbox = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch(`/api/inboxes/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Erro ao deletar caixa de entrada'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    createInbox,
    getInboxes,
    deleteInbox
  }
}