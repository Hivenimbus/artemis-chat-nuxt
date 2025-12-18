import { processEvolutionMessage, validateWebhookOrigin, createServiceSupabaseClient } from '~/lib/evolution'
// import { webhookLogger } from '~/lib/logger'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const body = await readBody(event)
    const headers = getHeaders(event)

    // Criar cliente Supabase com service role (webhooks não têm usuário autenticado)
    const supabase = createServiceSupabaseClient()

    // Extrair instance do formato antigo ou novo
    const instanceName = body.instance || body.instanceName || body.instanceId
    console.log(`🔔 [${startTime}] Webhook recebido: ${body.event} (${instanceName})`)
    console.log(`📋 [webhook] Payload:`, JSON.stringify(body, null, 2)) // Log completo para debug

    // Validar origem do webhook (básico por enquanto)
    if (!validateWebhookOrigin(headers, body.apikey)) {
      console.log('⚠️ Webhook sem validação de origem')
    }

    // Verificar se é um evento de mensagem (suporta formato antigo e novo)
    if (body.event === 'messages.upsert' || body.event === 'Message') {
      const result = await processEvolutionMessage(supabase, body)

      const processingTime = Date.now() - startTime
      console.log(`⚡ [${processingTime}ms] Webhook processado com sucesso`)

      return {
        success: true,
        message: 'Webhook processado com sucesso',
        processingTime: `${processingTime}ms`
      }
    }
    else if (body.event === 'messages.edit') {
      console.log('📝 Processando edição de mensagem:', body.instance)
      // TODO: Implementar lógica de edição de mensagens
    }
    else if (body.event === 'status.instance') {
      console.log('📱 Processando status da instância:', body.instance)
      // TODO: Implementar atualização de status da instância
    }
    else {
      console.log('📝 Evento não processado:', body.event)
    }

    // Retornar sucesso rapidamente para a Evolution API
    const processingTime = Date.now() - startTime
    return {
      success: true,
      message: 'Webhook recebido',
      event: body.event,
      processingTime: `${processingTime}ms`
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ [${processingTime}ms] Erro ao processar webhook:`, error)

    // Mesmo com erro, retornar sucesso para não bloquear a Evolution API
    return {
      success: false,
      message: 'Erro ao processar webhook',
      error: error.message,
      processingTime: `${processingTime}ms`
    }
  }
})

