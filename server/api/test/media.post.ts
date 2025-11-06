import { processEvolutionMessage, createServiceSupabaseClient } from '~/lib/evolution'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { type = 'image' } = body

    console.log(`🧪 Testando processamento de mídia do tipo: ${type}`)

    // Criar cliente Supabase
    const supabase = createServiceSupabaseClient()

    // Dados de teste baseados nos exemplos fornecidos
    const testCases = {
      audio: {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_audio_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste)",
          status: "DELIVERY_ACK",
          message: {
            audioMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc",
              mimetype: "audio/ogg; codecs=opus",
              fileSha256: "qKQ7KdeS1q+ARUOJp0/OiW26XWlZ7uyaMroMidomR00=",
              fileLength: 6406,
              seconds: 3,
              ptt: true,
              mediaKey: "hlNcuJxKL+ZzTI0GfQkVU78YceBe10aw5MCP8rqy+cc=",
              fileEncSha256: "cU+Wh9Mn+3WaBVzXF7Lo+X7cuO0Y+I7vjQK2Fk7vDjI=",
              directPath: "/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc",
              mediaKeyTimestamp: "1762442059",
              waveform: "BQUEBQgLCAQAAAARNFhSRkBKVFFIP0BBQkJDR0tQUFBKQDY5PkFBQDw3MjlARUVGPC4jLjk6MCYpLy4aBwAAAA==",
              viewOnce: false,
              base64: "T2dnUwACAAAAAAAAAA..." // Base64 truncado para teste
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
        apikey: "TEST_API_KEY"
      },
      image: {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_image_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste)",
          status: "DELIVERY_ACK",
          message: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m235/test-image.jpg",
              mimetype: "image/jpeg",
              fileSha256: "IVDRz5HBEMSUprKWjDn9hpB/rJA/4x98zE3/KOZmFYM=",
              fileLength: 147089,
              height: 551,
              width: 831,
              mediaKey: "LfxoiQwujVJdB2QQCbQgPTa4AWoxb079MToI8qyKpPU=",
              fileEncSha256: "YfInhw6uMcMISSey6qN/avQwedy6ACfw6Ec/rCGURJo=",
              directPath: "/o1/v/t24/f2/m235/test-image.jpg",
              mediaKeyTimestamp: "1762443632",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQA...",
              caption: "Imagem de teste para o sistema",
              viewOnce: false,
              base64: "/9j/4AAQSkZJRgABAQAAAQ..." // Base64 truncado para teste
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
        apikey: "TEST_API_KEY"
      },
      video: {
        event: "messages.upsert",
        instance: "IALISSON_TEST",
        data: {
          key: {
            remoteJid: "558189951170@s.whatsapp.net",
            fromMe: false,
            id: `test_video_${Date.now()}`,
            senderLid: "57595544998007@lid"
          },
          pushName: "Juan (Teste)",
          status: "DELIVERY_ACK",
          message: {
            videoMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7161-24/577789098_834715155627761_2088534210563772399_n.enc",
              mimetype: "video/mp4",
              fileSha256: "T2Kle1zjKcp16a538Hc7M2edo13TWow62eDXD3Nx+ek=",
              fileLength: 3023821,
              seconds: 7,
              mediaKey: "uE7VndUNLy9simC8U+4d20tKuKi9eN1B+jRDZtDaXSE=",
              gifPlayback: false,
              height: 720,
              width: 1280,
              fileEncSha256: "rxuBxi869WTp5wlf8c8vEZjvn3RH3PX+htWWh6+67ms=",
              directPath: "/v/t62.7161-24/577789098_834715155627761_2088534210563772399_n.enc",
              mediaKeyTimestamp: "1762443917",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQ...",
              caption: "Vídeo de teste para o sistema",
              viewOnce: false,
              base64: "AAAAGGZ0eXBtcD..." // Base64 truncado para teste
            },
            messageContextInfo: {
              deviceListMetadata: {
                senderKeyHash: "YmYFa+CIAxW5rg==",
                senderTimestamp: "1762114439"
              }
            }
          },
          messageType: "videoMessage",
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

    const testCase = testCases[type]
    if (!testCase) {
      return {
        success: false,
        error: `Tipo de mídia não suportado: ${type}. Use: audio, image, video`
      }
    }

    // Processar a mensagem de teste
    const result = await processEvolutionMessage(supabase, testCase)

    if (!result) {
      return {
        success: false,
        error: "Falha ao processar mensagem de mídia"
      }
    }

    return {
      success: true,
      message: `Teste de mídia do tipo '${type}' processado com sucesso`,
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
        hasCaption: !!(testCase.data.message.audioMessage ||
                       testCase.data.message.imageMessage?.caption ||
                       testCase.data.message.videoMessage?.caption)
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste de mídia:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
})