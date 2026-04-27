import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

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

    const hiveId = inbox.hive_instance_id
    if (!hiveId) {
      return { success: true, data: { state: 'not_found', connected: false, phone: null } }
    }

    // Buscar status na Hive API via endpoint geral da instância
    try {
      const instance: any = await $fetch(`${config.hiveApiUrl}/api/instances/${hiveId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${config.hiveApiKey}` }
      })

      const hiveStatus = instance?.status || 'disconnected'
      const phone = instance?.phone ?? instance?.number ?? null

      const stateMap: Record<string, string> = {
        'connected': 'open',
        'connecting': 'connecting',
        'disconnected': 'closed'
      }
      const state = stateMap[hiveStatus] || 'closed'
      const isConnected = hiveStatus === 'connected'

      const newStatus = isConnected ? 'connected' : 'disconnected'
      if (inbox.status !== newStatus) {
        await db.update(schema.inboxes)
          .set({ status: newStatus, updated_at: new Date() })
          .where(eq(schema.inboxes.id, id))
      }

      return { success: true, data: { state, connected: isConnected, phone } }

    } catch (hiveError: any) {
      console.error('Erro ao buscar status na Hive API:', hiveError)

      if (hiveError.response?.status === 404 || hiveError.statusCode === 404) {
        if (inbox.status === 'connected') {
          await db.update(schema.inboxes).set({ status: 'disconnected', updated_at: new Date() }).where(eq(schema.inboxes.id, id))
        }
        return { success: true, data: { state: 'not_found', connected: false, phone: null } }
      }

      throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar status da conexão' })
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
