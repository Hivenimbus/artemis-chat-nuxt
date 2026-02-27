import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID da caixa de entrada é obrigatório' })

    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Erro ao verificar permissões do usuário' })

    const [inbox] = await db.select().from(schema.inboxes).where(eq(schema.inboxes.id, id)).limit(1)
    if (!inbox || inbox.empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Caixa de entrada não encontrada ou sem permissão' })
    }

    // Buscar status na Evolution API
    try {
      const response: any = await $fetch(`${config.evolutionApiUrl}/instance/status`, {
        method: 'GET', headers: { 'apikey': id }
      })

      const instanceData = response.data || {}
      const connected = instanceData.Connected === true || instanceData.connected === true
      const loggedIn = instanceData.LoggedIn === true || instanceData.loggedIn === true
      const name = instanceData.Name || instanceData.name

      const isConnected = connected && loggedIn
      const state = isConnected ? 'open' : (connected ? 'connecting' : 'closed')

      // Atualizar status no DB
      const newStatus = isConnected ? 'connected' : 'disconnected'
      if (inbox.status !== newStatus) {
        await db.update(schema.inboxes)
          .set({ status: newStatus, updated_at: new Date() })
          .where(eq(schema.inboxes.id, id))
      }

      return { success: true, data: { state, connected: isConnected, instanceName: name } }

    } catch (evolutionError: any) {
      console.error('Erro ao buscar status na Evolution API:', evolutionError)

      if (evolutionError.response?.status === 404 || evolutionError.response?.status === 403) {
        if (inbox.status === 'connected') {
          await db.update(schema.inboxes).set({ status: 'disconnected', updated_at: new Date() }).where(eq(schema.inboxes.id, id))
        }
        return { success: true, data: { state: 'not_found', connected: false, instanceName: null } }
      }

      throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar status da conexão' })
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
