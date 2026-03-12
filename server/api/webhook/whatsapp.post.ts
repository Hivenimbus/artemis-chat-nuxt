import { processMeowMessage } from '~/server/lib/meow'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const body = await readBody(event)
    const instanceName = body.instance

    console.log(`[${startTime}] Webhook recebido: ${body.event} (${instanceName})`)

    if (body.event === 'message.received') {
      const result = await processMeowMessage(body)

      const processingTime = Date.now() - startTime
      console.log(`[${processingTime}ms] Webhook processado com sucesso`)

      return {
        success: true,
        message: 'Webhook processado com sucesso',
        processingTime: `${processingTime}ms`
      }
    }
    else if (body.event === 'connection.connected') {
      console.log(`✅ Instância conectada: ${instanceName} (telefone: ${body.data?.phoneNumber})`)
    }
    else if (body.event === 'connection.disconnected') {
      console.log(`⚠️ Instância desconectada: ${instanceName}`)
    }
    else if (body.event === 'connection.logged_out') {
      console.log(`🚪 Instância deslogada: ${instanceName}`)
    }
    else {
      console.log('Evento não processado:', body.event)
    }

    const processingTime = Date.now() - startTime
    return {
      success: true,
      message: 'Webhook recebido',
      event: body.event,
      processingTime: `${processingTime}ms`
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error(`[${processingTime}ms] Erro ao processar webhook:`, error)

    // Retornar sucesso para não bloquear a API-MEOW
    return {
      success: false,
      message: 'Erro ao processar webhook',
      error: error.message,
      processingTime: `${processingTime}ms`
    }
  }
})
