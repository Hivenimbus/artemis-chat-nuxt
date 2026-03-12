import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

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

    // Desconectar na API-MEOW
    try {
      await $fetch(`${config.meowApiUrl}/api/instances/${id}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.meowApiKey}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (meowError: any) {
      console.error('Erro ao desconectar na API-MEOW:', meowError)

      if (meowError.response?.status !== 404 && meowError.response?.status !== 403) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao desconectar WhatsApp. Tente novamente.'
        })
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
