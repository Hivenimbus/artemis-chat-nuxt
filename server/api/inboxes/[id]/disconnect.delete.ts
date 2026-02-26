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

    // Fazer logout na Evolution API
    try {
      await $fetch(`${config.evolutionApiUrl}/instance/disconnect`, {
        method: 'POST',
        headers: {
          'apikey': id
        },
        body: {}
      })
    } catch (evolutionError: any) {
      console.error('Erro ao fazer logout na Evolution API:', evolutionError)

      if (evolutionError.response?.status !== 404 && evolutionError.response?.status !== 403) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao desconectar WhatsApp. Tente novamente.'
        })
      }
    }

    // Atualizar status no banco
    await db
      .update(inboxes)
      .set({ status: 'disconnected', updated_at: new Date() })
      .where(eq(inboxes.id, id))

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
