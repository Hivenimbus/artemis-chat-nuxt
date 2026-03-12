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

    // Iniciar conexão na API-MEOW
    try {
      console.log(`Iniciando conexão da instância ${id}...`)
      await $fetch(`${config.meowApiUrl}/api/instances/${id}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.meowApiKey}`,
          'Content-Type': 'application/json'
        }
      })
      console.log(`Conexão iniciada para instância ${id}`)
    } catch (connectError: any) {
      console.warn('⚠️ Aviso ao iniciar conexão (pode já estar conectado):', connectError.message)
    }

    // Buscar QR Code na API-MEOW
    try {
      const response: any = await $fetch(`${config.meowApiUrl}/api/instances/${id}/qrcode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.meowApiKey}`
        }
      })

      const qrCodeRaw = response?.qrCode || null
      // API-MEOW retorna base64 puro; o <img> precisa de data URI completa
      const qrCodeDataUri = qrCodeRaw
        ? (qrCodeRaw.startsWith('data:') ? qrCodeRaw : `data:image/png;base64,${qrCodeRaw}`)
        : null

      return {
        success: true,
        data: {
          base64: qrCodeDataUri,
          status: response?.status || 'connecting',
          phone: response?.phone || null
        }
      }

    } catch (meowError: any) {
      console.error('Erro ao buscar QR Code na API-MEOW:', meowError)

      if (meowError.response?.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Instância não encontrada na API-MEOW'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar QR Code. Tente novamente em instantes.'
      })
    }

  } catch (error: any) {
    console.error('Erro no handler de QR Code:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
