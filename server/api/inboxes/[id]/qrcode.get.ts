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

<<<<<<< Updated upstream
    // Buscar empresa do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])
=======
    // Buscar dados do usuário para obter empresa_id
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)
>>>>>>> Stashed changes

    if (!userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Erro ao verificar permissões do usuário'
      })
    }

    // Verificar se o inbox existe e pertence à empresa do usuário
<<<<<<< Updated upstream
    const inbox = await db
      .select()
      .from(inboxes)
      .where(and(eq(inboxes.id, id), eq(inboxes.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!inbox) {
=======
    const [inbox] = await db.select().from(schema.inboxes)
      .where(eq(schema.inboxes.id, id))
      .limit(1)

    if (!inbox || inbox.empresa_id !== userData.empresa_id) {
>>>>>>> Stashed changes
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Tentar conectar e configurar webhook antes de buscar QR Code
    try {
      console.log(`Iniciando conexão da instância ${id}...`)
      await $fetch(`${config.evolutionApiUrl}/instance/connect`, {
        method: 'POST',
        headers: {
          'apikey': id,
          'Content-Type': 'application/json'
        },
        body: {
          webhookUrl: `${config.public.siteUrl}/api/webhook/whatsapp`,
          subscribe: [
            'messages.upsert',
            'messages.update',
            'messages.delete',
            'send.message',
            'connection.update'
          ]
        }
      })
      console.log(`Conexão iniciada e webhook configurado para instância ${id}`)
    } catch (connectError: any) {
<<<<<<< Updated upstream
      console.warn('Aviso ao iniciar conexão (pode já estar conectado):', connectError.message)
=======
      console.warn('⚠️ Aviso ao iniciar conexão (pode já estar conectado):', connectError.message)
>>>>>>> Stashed changes
    }

    // Buscar QR Code na Evolution API
    try {
      const response: any = await $fetch(`${config.evolutionApiUrl}/instance/qr`, {
        method: 'GET',
        headers: {
          'apikey': id
        }
      })

      const qrData = response.data || response

      return {
        success: true,
        data: {
          base64: qrData?.Qrcode,
          code: qrData?.Code,
          pairingCode: qrData?.pairingCode
        }
      }

    } catch (evolutionError: any) {
      console.error('Erro ao buscar QR Code na Evolution API:', evolutionError)

      if (evolutionError.response?.status === 404 || evolutionError.response?.status === 403) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Instância não encontrada ou não autorizada na Evolution API'
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
