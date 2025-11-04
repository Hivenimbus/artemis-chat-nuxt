export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Simular dados da Evolution API com base no que foi enviado no teste
    const webhookData = {
      event: "messages.upsert",
      instance: body.instance || "test-instance",
      data: {
        key: {
          remoteJid: body.remoteJid || "558189951170@s.whatsapp.net",
          fromMe: false,
          id: "3EB034659FFA002B63F8BB",
          senderLid: "57595544998007@lid"
        },
        pushName: body.pushName || "Juan Test",
        status: "DELIVERY_ACK",
        message: {
          conversation: body.message || "Mensagem de teste do webhook"
        },
        messageType: "conversation",
        messageTimestamp: Math.floor(Date.now() / 1000),
        instanceId: body.instance || "test-instance",
        source: "web"
      },
      destination: "https://test-endpoint.com",
      date_time: new Date().toISOString(),
      sender: "558386575305@s.whatsapp.net",
      server_url: "https://evolution-test.jjqtga.easypanel.host",
      apikey: "test-api-key"
    }

    console.log('🧪 Enviando dados de teste para webhook...')

    // Fazer a requisição para o webhook real
    const response = await $fetch('/api/webhook/whatsapp', {
      method: 'POST',
      body: webhookData
    })

    console.log('✅ Resposta do webhook:', response)

    return {
      success: true,
      message: 'Teste de webhook enviado com sucesso',
      testData: webhookData,
      webhookResponse: response
    }

  } catch (error) {
    console.error('❌ Erro no teste de webhook:', error)
    return {
      success: false,
      message: 'Erro ao testar webhook',
      error: error.message
    }
  }
})