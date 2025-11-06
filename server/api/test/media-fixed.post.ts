import { processEvolutionMessage, createServiceSupabaseClient, validateBase64, decodeBase64 } from '~/lib/evolution'

// Base64 real de uma imagem PNG 1x1 pixel (vermelho) - totalmente válida
const REAL_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

// Base64 real de um arquivo WAV pequeno (silêncio de 0.1 segundos)
const REAL_AUDIO_BASE64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { type = 'image', useRealBase64 = true } = body

    console.log(`🧪 Testando processamento de mídia do tipo: ${type} (base64 real: ${useRealBase64})`)

    // Criar cliente Supabase
    const supabase = createServiceSupabaseClient()

    // Primeiro, testar nossas funções de validação
    let testBase64 = ""
    let expectedMimeType = ""

    if (type === 'image') {
      testBase64 = useRealBase64 ? REAL_IMAGE_BASE64 : "base64_invalido_teste"
      expectedMimeType = "image/png"
    } else if (type === 'audio') {
      testBase64 = useRealBase64 ? REAL_AUDIO_BASE64 : "base64_invalido_teste"
      expectedMimeType = "audio/wav"
    } else {
      testBase64 = REAL_IMAGE_BASE64
      expectedMimeType = "image/png"
    }

    console.log('🔍 Testando validação do base64...')
    const validation = validateBase64(testBase64)
    console.log('Resultado da validação:', validation)

    if (validation.valid) {
      console.log('✅ Base64 validado com sucesso!')

      console.log('🔍 Testando decodificação...')
      const decodeResult = decodeBase64(testBase64)
      console.log('Resultado da decodificação:', {
        success: decodeResult.success,
        method: decodeResult.method,
        bufferSize: decodeResult.buffer?.length || 0
      })

      if (decodeResult.success && decodeResult.buffer) {
        console.log('✅ Decodificação bem-sucedida!')
      }
    } else {
      console.warn('⚠️ Base64 inválido, mas vamos continuar o teste...')
    }

    // Dados de teste baseados nos exemplos fornecidos, mas com base64 real
    const testCases = {
      image: {
        event: "messages.upsert",
        instance: "IALISSON_TEST_FIXED",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_image_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste Corrigido)",
          status: "DELIVERY_ACK",
          message: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m235/test-image.jpg",
              mimetype: expectedMimeType,
              fileSha256: "IVDRz5HBEMSUprKWjDn9hpB/rJA/4x98zE3/KOZmFYM=",
              fileLength: testBase64.length,
              height: 1,
              width: 1,
              mediaKey: "LfxoiQwujVJdB2QQCbQgPTa4AWoxb079MToI8qyKpPU=",
              fileEncSha256: "YfInhw6uMcMISSey6qN/avQwedy6ACfw6Ec/rCGURJo=",
              directPath: "/o1/v/t24/f2/m235/test-image.jpg",
              mediaKeyTimestamp: Math.floor(Date.now() / 1000).toString(),
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQA...",
              caption: "Imagem de teste com base64 real para o sistema",
              viewOnce: false,
              base64: testBase64 // Base64 real!
            },
            messageContextInfo: {
              deviceListMetadata: {
                senderKeyHash: "YmYFa+CIAxW5rg==",
                senderTimestamp: "1762114439"
              }
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
        apikey: "TEST_API_KEY_FIXED"
      },
      audio: {
        event: "messages.upsert",
        instance: "IALISSON_TEST_FIXED",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_audio_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste Corrigido)",
          status: "DELIVERY_ACK",
          message: {
            audioMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc",
              mimetype: expectedMimeType,
              fileSha256: "qKQ7KdeS1q+ARUOJp0/OiW26XWlZ7uyaMroMidomR00=",
              fileLength: testBase64.length,
              seconds: 0,
              ptt: false,
              mediaKey: "hlNcuJxKL+ZzTI0GfQkVU78YceBe10aw5MCP8rqy+cc=",
              fileEncSha256: "cU+Wh9Mn+3WaBVzXF7Lo+X7cuO0Y+I7vjQK2Fk7vDjI=",
              directPath: "/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc",
              mediaKeyTimestamp: Math.floor(Date.now() / 1000).toString(),
              waveform: "BQUEBQgLCAQAAAARNFhSRkBKVFFIP0BBQkJDR0tQUFBKQDY5PkFBQDw3MjlARUVGPC4jLjk6MCYpLy4aBwAAAA==",
              viewOnce: false,
              base64: testBase64 // Base64 real!
            },
            messageContextInfo: {
              deviceListMetadata: {
                senderKeyHash: "YmYFa+CIAxW5rg==",
                senderTimestamp: "1762114439"
              }
            }
          },
          messageType: "audioMessage",
          messageTimestamp: Math.floor(Date.now() / 1000),
          instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
          source: "web"
        },
        destination: "https://test.webhook.com",
        date_time: new Date().toISOString(),
        sender: "558398071683@s.whatsapp.net",
        server_url: "https://evolution-test.com",
        apikey: "TEST_API_KEY_FIXED"
      }
    }

    const testCase = testCases[type]
    if (!testCase) {
      return {
        success: false,
        error: `Tipo de mídia não suportado: ${type}. Use: image, audio`
      }
    }

    console.log(`🚀 Iniciando processamento completo do webhook...`)

    // Processar a mensagem de teste
    const result = await processEvolutionMessage(supabase, testCase)

    if (!result) {
      return {
        success: false,
        error: "Falha ao processar mensagem de mídia"
      }
    }

    console.log(`🎉 Processamento concluído com sucesso!`)

    return {
      success: true,
      message: `Teste de mídia do tipo '${type}' processado com sucesso`,
      validation: validation,
      result: {
        contatoId: result.contatoId,
        atendimentoId: result.atendimentoId,
        mensagemId: result.mensagemId,
        inboxId: result.inboxId,
        empresaId: result.empresaId,
        hasMedia: !!result.mediaUrl,
        mediaUrl: result.mediaUrl,
        mediaType: result.mediaType,
        mediaName: result.mediaName
      },
      testCase: {
        messageType: testCase.data.messageType,
        hasCaption: !!testCase.data.message.imageMessage?.caption,
        base64Length: testBase64.length,
        useRealBase64
      },
      nextSteps: [
        "1. Verifique os logs no console para detalhes do processamento",
        "2. A mídia foi salva no bucket 'midias' do Supabase",
        "3. Verifique se a mídia está acessível via URL retornada",
        "4. Teste com mensagens reais da Evolution API"
      ]
    }

  } catch (error) {
    console.error('❌ Erro no teste de mídia corrigida:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
})