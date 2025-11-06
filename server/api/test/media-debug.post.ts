import { processEvolutionMessage, createServiceSupabaseClient } from '~/lib/evolution'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { testType = 'valid' } = body

    console.log(`🧪 Iniciando teste de debug de mídia: ${testType}`)

    // Criar cliente Supabase
    const supabase = createServiceSupabaseClient()

    // Casos de teste para diferentes cenários
    const testCases = {
      'valid-base64': {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_valid_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste Válido)",
          message: {
            imageMessage: {
              url: "https://example.com/test.jpg",
              mimetype: "image/jpeg",
              fileSha256: "IVDRz5HBEMSUprKWjDn9hpB/rJA/4x98zE3/KOZmFYM=",
              fileLength: 147089,
              height: 551,
              width: 831,
              caption: "Imagem válida para teste",
              base64: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=" // Base64 válido minimal
            }
          },
          messageType: "imageMessage",
          messageTimestamp: Math.floor(Date.now() / 1000),
          instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
          source: "web"
        },
        destination: "https://test.webhook.com",
        date_time: new Date().toISOString(),
        sender: "558398071683@s.whatsapp.net",
        server_url: "https://evolution-test.com",
        apikey: "TEST_API_KEY"
      },

      'invalid-base64-truncated': {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_truncated_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste Truncado)",
          message: {
            imageMessage: {
              url: "https://example.com/test.jpg",
              mimetype: "image/jpeg",
              fileSha256: "INVALID_HASH_TEST",
              fileLength: 147089,
              caption: "Base64 truncado para teste",
              base64: "/9j/4AAQSkZJRgABAQAAAQABAAAD..." // Base64 truncado com ...
            }
          },
          messageType: "imageMessage",
          messageTimestamp: Math.floor(Date.now() / 1000),
          instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
          source: "web"
        },
        destination: "https://test.webhook.com",
        date_time: new Date().toISOString(),
        sender: "558398071683@s.whatsapp.net",
        server_url: "https://evolution-test.com",
        apikey: "TEST_API_KEY"
      },

      'invalid-base64-format': {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_invalid_format_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste Formato Inválido)",
          message: {
            imageMessage: {
              url: "https://example.com/test.jpg",
              mimetype: "image/jpeg",
              fileSha256: "INVALID_HASH_TEST",
              fileLength: 147089,
              caption: "Base64 com formato inválido",
              base64: "NOT_BASE64_DATA_AT_ALL_!!!@#$%" // String inválida
            }
          },
          messageType: "imageMessage",
          messageTimestamp: Math.floor(Date.now() / 1000),
          instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
          source: "web"
        },
        destination: "https://test.webhook.com",
        date_time: new Date().toISOString(),
        sender: "558398071683@s.whatsapp.net",
        server_url: "https://evolution-test.com",
        apikey: "TEST_API_KEY"
      },

      'size-mismatch': {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_size_mismatch_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste Size Mismatch)",
          message: {
            imageMessage: {
              url: "https://example.com/test.jpg",
              mimetype: "image/jpeg",
              fileSha256: "IVDRz5HBEMSUprKWjDn9hpB/rJA/4x98zE3/KOZmFYM=",
              fileLength: 1000000, // 1MB esperado
              caption: "Base64 válido mas tamanho não corresponde",
              base64: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=" // Base64 pequeno
            }
          },
          messageType: "imageMessage",
          messageTimestamp: Math.floor(Date.now() / 1000),
          instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
          source: "web"
        },
        destination: "https://test.webhook.com",
        date_time: new Date().toISOString(),
        sender: "558398071683@s.whatsapp.net",
        server_url: "https://evolution-test.com",
        apikey: "TEST_API_KEY"
      },

      'no-base64-no-url': {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_no_data_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste Sem Dados)",
          message: {
            imageMessage: {
              url: "", // URL vazia
              mimetype: "image/jpeg",
              fileSha256: "INVALID_HASH_TEST",
              fileLength: 147089,
              caption: "Sem base64 nem URL",
              // Sem base64
            }
          },
          messageType: "imageMessage",
          messageTimestamp: Math.floor(Date.now() / 1000),
          instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
          source: "web"
        },
        destination: "https://test.webhook.com",
        date_time: new Date().toISOString(),
        sender: "558398071683@s.whatsapp.net",
        server_url: "https://evolution-test.com",
        apikey: "TEST_API_KEY"
      }
    }

    const testCase = testCases[testType]
    if (!testCase) {
      return {
        success: false,
        error: `Tipo de teste não disponível: ${testType}. Use: valid-base64, invalid-base64-truncated, invalid-base64-format, size-mismatch, no-base64-no-url`
      }
    }

    console.log(`🔍 Executando teste: ${testType}`)
    console.log(`📋 Descrição: ${testCase.data.pushName}`)
    console.log(`📏 Tamanho esperado: ${testCase.data.message.imageMessage?.fileLength} bytes`)
    console.log(`🔐 Hash esperado: ${testCase.data.message.imageMessage?.fileSha256}`)

    // Processar a mensagem de teste
    const startTime = Date.now()
    const result = await processEvolutionMessage(supabase, testCase)
    const processingTime = Date.now() - startTime

    const success = !!result
    const hasMedia = !!(result?.mediaUrl)

    console.log(`📊 Resultado do teste ${testType}:`, {
      success,
      hasMedia,
      processingTime: `${processingTime}ms`,
      mediaUrl: result?.mediaUrl,
      mediaType: result?.mediaType,
      mediaName: result?.mediaName
    })

    return {
      success,
      testType,
      processingTime: `${processingTime}ms`,
      result: {
        success: !!result,
        hasMedia,
        contatoId: result?.contatoId,
        atendimentoId: result?.atendimentoId,
        mensagemId: result?.mensagemId,
        inboxId: result?.inboxId,
        empresaId: result?.empresaId,
        mediaUrl: result?.mediaUrl,
        mediaType: result?.mediaType,
        mediaName: result?.mediaName
      },
      testCase: {
        name: testCase.data.pushName,
        expectedSize: testCase.data.message.imageMessage?.fileLength,
        expectedHash: testCase.data.message.imageMessage?.fileSha256,
        hasBase64: !!testCase.data.message.imageMessage?.base64,
        base64Length: testCase.data.message.imageMessage?.base64?.length || 0,
        hasUrl: !!testCase.data.message.imageMessage?.url,
        caption: testCase.data.message.imageMessage?.caption
      },
      expectedBehavior: {
        'valid-base64': 'Deve processar com sucesso usando base64',
        'invalid-base64-truncated': 'Deve detectar base64 truncado e falhar',
        'invalid-base64-format': 'Deve detectar formato inválido e falhar',
        'size-mismatch': 'Deve detectar mismatch de tamanho e falhar',
        'no-base64-no-url': 'Deve falhar por não ter fonte de dados'
      }[testType]
    }

  } catch (error) {
    console.error('❌ Erro no teste de debug:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
})