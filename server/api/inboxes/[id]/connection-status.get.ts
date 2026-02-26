<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, inboxes } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID da caixa de entrada é obrigatório' })

<<<<<<< Updated upstream
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da caixa de entrada é obrigatório'
      })
    }

=======
>>>>>>> Stashed changes
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Erro ao verificar permissões do usuário' })

    const [inbox] = await db.select().from(schema.inboxes).where(eq(schema.inboxes.id, id)).limit(1)
    if (!inbox || inbox.empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Caixa de entrada não encontrada ou sem permissão' })
    }

<<<<<<< Updated upstream
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

=======
    // Buscar status na Evolution API
    try {
      const response: any = await $fetch(`${config.evolutionApiUrl}/instance/status`, {
        method: 'GET', headers: { 'apikey': id }
      })

      const instanceData = response.data || {}
>>>>>>> Stashed changes
      const connected = instanceData.Connected === true || instanceData.connected === true
      const loggedIn = instanceData.LoggedIn === true || instanceData.loggedIn === true
      const name = instanceData.Name || instanceData.name

      const isConnected = connected && loggedIn
      const state = isConnected ? 'open' : (connected ? 'connecting' : 'closed')

<<<<<<< Updated upstream
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
=======
      // Atualizar status no DB
      const newStatus = isConnected ? 'connected' : 'disconnected'
      if (inbox.status !== newStatus) {
        await db.update(schema.inboxes)
          .set({ status: newStatus, updated_at: new Date() })
          .where(eq(schema.inboxes.id, id))
      }

      return { success: true, data: { state, connected: isConnected, instanceName: name } }
>>>>>>> Stashed changes

    } catch (evolutionError: any) {
      console.error('Erro ao buscar status na Evolution API:', evolutionError)

      if (evolutionError.response?.status === 404 || evolutionError.response?.status === 403) {
<<<<<<< Updated upstream
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
=======
        if (inbox.status === 'connected') {
          await db.update(schema.inboxes).set({ status: 'disconnected', updated_at: new Date() }).where(eq(schema.inboxes.id, id))
>>>>>>> Stashed changes
        }
        return { success: true, data: { state: 'not_found', connected: false, instanceName: null } }
      }

<<<<<<< Updated upstream
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
=======
      throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar status da conexão' })
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
