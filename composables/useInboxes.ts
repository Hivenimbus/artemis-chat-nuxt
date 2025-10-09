import type { Inbox, InboxInsert, InboxUpdate } from '~/types/database.types'

export const useInboxes = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * Busca todas as caixas de entrada do usuário atual
   */
  const fetchInboxes = async () => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('inboxes')
      .select('*')
      .eq('user_id', user.value.id)
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
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('inboxes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.value.id)
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
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('inboxes')
      .insert({
        ...inboxData,
        user_id: user.value.id,
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
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('inboxes')
      .update(inboxData)
      .eq('id', id)
      .eq('user_id', user.value.id)
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
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('inboxes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id)

    if (error) {
      console.error('Erro ao deletar caixa de entrada:', error)
      throw error
    }

    return true
  }

  /**
   * Conecta uma caixa de entrada ao WhatsApp
   * Esta função será expandida quando integrar com a biblioteca do WhatsApp
   */
  const connectInbox = async (id: string, phoneNumber: string) => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    // Por enquanto, apenas atualiza o status
    // TODO: Implementar lógica de conexão real com WhatsApp
    const { data, error } = await supabase
      .from('inboxes')
      .update({
        status: 'connected',
        phone_number: phoneNumber,
        connected_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.value.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao conectar caixa de entrada:', error)
      throw error
    }

    return data as Inbox
  }

  /**
   * Desconecta uma caixa de entrada do WhatsApp
   */
  const disconnectInbox = async (id: string) => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    // TODO: Implementar lógica de desconexão real com WhatsApp
    const { data, error } = await supabase
      .from('inboxes')
      .update({
        status: 'disconnected',
        phone_number: null,
        qr_code: null,
        session_data: null
      })
      .eq('id', id)
      .eq('user_id', user.value.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao desconectar caixa de entrada:', error)
      throw error
    }

    return data as Inbox
  }

  /**
   * Gera um QR Code para conexão do WhatsApp
   * Esta função será expandida quando integrar com a biblioteca do WhatsApp
   */
  const generateQRCode = async (id: string) => {
    if (!user.value) {
      throw new Error('Usuário não autenticado')
    }

    // TODO: Implementar lógica de geração de QR Code real
    // Por enquanto, retorna um placeholder
    const qrCode = 'QR_CODE_PLACEHOLDER_' + Date.now()

    const { data, error } = await supabase
      .from('inboxes')
      .update({
        qr_code: qrCode
      })
      .eq('id', id)
      .eq('user_id', user.value.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao gerar QR Code:', error)
      throw error
    }

    return data as Inbox
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
    generateQRCode,
    subscribeToInboxChanges
  }
}
