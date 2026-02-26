import { db } from '~/server/db'
import { users, inboxes } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da caixa de entrada é obrigatório'
      })
    }

    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Buscar empresa do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      console.error('Erro ao buscar dados do usuário')
      throw createError({
        statusCode: 403,
        statusMessage: 'Erro ao verificar permissões do usuário'
      })
    }

    // Verificar se o inbox existe e pertence à empresa do usuário
    const inbox = await db
      .select()
      .from(inboxes)
      .where(and(eq(inboxes.id, id), eq(inboxes.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Buscar status da conexão na Evolution API
    try {
      const response = await $fetch(`${config.evolutionApiUrl}/instance/status`, {
        method: 'GET',
        headers: {
          'apikey': id
        }
      })

      const instanceData = (response as any).data || {}

      const connected = instanceData.Connected === true || instanceData.connected === true
      const loggedIn = instanceData.LoggedIn === true || instanceData.loggedIn === true
      const name = instanceData.Name || instanceData.name

      const isConnected = connected && loggedIn
      const state = isConnected ? 'open' : (connected ? 'connecting' : 'closed')

      // Atualizar status no banco se mudou
      if (isConnected && inbox.status !== 'connected') {
        await db
          .update(inboxes)
          .set({ status: 'connected', updated_at: new Date() })
          .where(eq(inboxes.id, id))
      } else if (!isConnected && inbox.status === 'connected') {
        await db
          .update(inboxes)
          .set({ status: 'disconnected', updated_at: new Date() })
          .where(eq(inboxes.id, id))
      }

      return {
        success: true,
        data: {
          state,
          connected: isConnected,
          instanceName: name
        }
      }

    } catch (evolutionError: any) {
      console.error('Erro ao buscar status na Evolution API:', evolutionError)

      if (evolutionError.response?.status === 404 || evolutionError.response?.status === 403) {
        // Se estava marcado como conectado, atualizar para desconectado
        if (inbox.status === 'connected') {
          await db
            .update(inboxes)
            .set({ status: 'disconnected', updated_at: new Date() })
            .where(eq(inboxes.id, id))
        }

        return {
          success: true,
          data: {
            state: 'not_found',
            connected: false,
            instanceName: null
          }
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao verificar status da conexão'
      })
    }

  } catch (error: any) {
    console.error('Erro no handler de status de conexão:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
