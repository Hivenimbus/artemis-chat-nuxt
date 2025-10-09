import type { Inbox, InboxInsert, InboxUpdate } from '~/types/database.types'

export const useInboxes = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * Obtém o ID do usuário atual de forma confiável
   */
  const getCurrentUserId = async () => {
    // Tentar pegar do user.value primeiro
    if (user.value?.id) {
      return user.value.id
    }
    
    // Se não estiver disponível, buscar da sessão
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      return session.user.id
    }
    
    throw new Error('Usuário não autenticado')
  }

  /**
   * Busca todas as caixas de entrada do usuário atual
   */
  const fetchInboxes = async () => {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('inboxes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar caixas de entrada:', error)
      throw error
    }

    return data as Inbox[]
  }

  /**
   * Busca uma caixa de entrada específica por ID
   */
  const fetchInboxById = async (id: string) => {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('inboxes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar caixa de entrada:', error)
      throw error
    }

    return data as Inbox
  }

  /**
   * Cria uma nova caixa de entrada
   */
  const createInbox = async (inboxData: Omit<InboxInsert, 'user_id'>) => {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('inboxes')
      .insert({
        ...inboxData,
        user_id: userId,
        status: 'disconnected'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar caixa de entrada:', error)
      throw error
    }

    return data as Inbox
  }

  /**
   * Atualiza uma caixa de entrada existente
   */
  const updateInbox = async (id: string, inboxData: InboxUpdate) => {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('inboxes')
      .update(inboxData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar caixa de entrada:', error)
      throw error
    }

    return data as Inbox
  }

  /**
   * Deleta uma caixa de entrada
   */
  const deleteInbox = async (id: string) => {
    const userId = await getCurrentUserId()

    const { error } = await supabase
      .from('inboxes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao deletar caixa de entrada:', error)
      throw error
    }

    return true
  }

  /**
   * Conecta uma caixa de entrada ao WhatsApp usando Evolution API
   * Cria uma instância do WhatsApp e retorna o QR Code para escaneamento
   */
  const connectInbox = async (id: string, name: string, phoneNumber?: string) => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    try {
      // Call our Nuxt API endpoint to create Evolution instance
      const response = await $fetch('/api/evolution/create-instance', {
        method: 'POST',
        body: {
          inboxId: id,
          name,
          phone: phoneNumber
        }
      })

      return response.inbox as Inbox
    } catch (error: any) {
      console.error('Erro ao conectar caixa de entrada:', error)
      throw new Error(error.data?.message || error.message || 'Falha ao conectar ao WhatsApp')
    }
  }

  /**
   * Desconecta uma caixa de entrada do WhatsApp usando Evolution API
   */
  const disconnectInbox = async (id: string) => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    try {
      // Call our Nuxt API endpoint to disconnect Evolution instance
      const response = await $fetch('/api/evolution/disconnect', {
        method: 'POST',
        body: { inboxId: id }
      })

      return response.inbox as Inbox
    } catch (error: any) {
      console.error('Erro ao desconectar caixa de entrada:', error)
      throw new Error(error.data?.message || error.message || 'Falha ao desconectar do WhatsApp')
    }
  }

  /**
   * Verifica o status de conexão de uma caixa de entrada
   * Obtém o status atualizado da Evolution API
   */
  const checkInboxStatus = async (id: string) => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const response = await $fetch(`/api/evolution/status/${id}`, {
        method: 'GET'
      })

      return response.inbox as Inbox
    } catch (error: any) {
      console.error('Erro ao verificar status da caixa de entrada:', error)
      throw new Error(error.data?.message || error.message || 'Falha ao verificar status')
    }
  }

  /**
   * Realtime subscription para mudanças nas caixas de entrada
   */
  const subscribeToInboxChanges = (callback: (payload: any) => void) => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    const channel = supabase
      .channel('inboxes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inboxes',
          filter: `user_id=eq.${user.value.id}`
        },
        callback
      )
      .subscribe()

    return channel
  }

  return {
    fetchInboxes,
    fetchInboxById,
    createInbox,
    updateInbox,
    deleteInbox,
    connectInbox,
    disconnectInbox,
    checkInboxStatus,
    subscribeToInboxChanges
  }
}
