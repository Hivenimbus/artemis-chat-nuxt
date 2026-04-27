import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getHivePanelHeaders } from '~/server/lib/hive'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

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

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (!userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Erro ao verificar permissões do usuário'
      })
    }

    const [inbox] = await db.select().from(schema.inboxes)
      .where(eq(schema.inboxes.id, id))
      .limit(1)

    if (!inbox || inbox.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Desconectar na Hive API
    const hiveId = inbox.hive_instance_id
    try {
      if (!hiveId) throw new Error('Sem hive_instance_id')
      const panelHeaders = await getHivePanelHeaders()
      await $fetch(`${config.hiveApiUrl}/api/instances/${hiveId}/disconnect`, {
        method: 'POST',
        headers: panelHeaders
      })
    } catch (hiveError: any) {
      const status = hiveError.response?.status
      if (status !== 404 && status !== 403 && hiveId) {
        console.error('Erro ao desconectar na Hive API:', hiveError)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao desconectar WhatsApp. Tente novamente.' })
      }
    }

    // Atualizar status no DB
    await db.update(schema.inboxes)
      .set({
        status: 'disconnected',
        phone_number: null,
        updated_at: new Date()
      })
      .where(eq(schema.inboxes.id, id))

    return {
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    }

  } catch (error: any) {
    console.error('Erro no handler de desconexão:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
