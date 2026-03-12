#!/usr/bin/env node

/**
 * Script para testar o processamento de mídias no webhook
 */

// Mock dos dados da Evolution API para diferentes tipos de mídia
// ESTRUTURA REAL BASEADA NOS EXEMPLOS FORNECIDOS
const testCases = [
  {
    name: 'Mensagem de Áudio (estrutura real)',
    data: {
      event: 'messages.upsert',
      instance: 'IALISSON',
      data: {
        key: {
          remoteJid: '558189951170@s.whatsapp.net',
          fromMe: false,
          id: '3EB0194B12B8A7F8FD4EAB',
          senderLid: '57595544998007@lid'
        },
        pushName: 'Juan',
        status: 'DELIVERY_ACK',
        message: {
          audioMessage: {
            url: 'https://mmg.whatsapp.net/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc',
            mimetype: 'audio/ogg; codecs=opus',
            fileSha256: 'qKQ7KdeS1q+ARUOJp0/OiW26XWlZ7uyaMroMidomR00=',
            fileLength: '6406',
            seconds: 3,
            ptt: true,
            mediaKey: 'hlNcuJxKL+ZzTI0GfQkVU78YceBe10aw5MCP8rqy+cc=',
            fileEncSha256: 'cU+Wh9Mn+3WaBVzXF7Lo+X7cuO0Y+I7vjQK2Fk7vDjI=',
            directPath: '/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc',
            mediaKeyTimestamp: '1762442059',
            waveform: 'BQUEBQgLCAQAAAARNFhSRkBKVFFIP0BBQkJDR0tQUFBKQDY5PkFBQDw3MjlARUVGPC4jLjk6MCYpLy4aBwAAAA==',
            viewOnce: false
          },
          messageContextInfo: {
            deviceListMetadata: {
              senderKeyHash: 'YmYFa+CIAxW5rg==',
              senderTimestamp: '1762114439',
              senderAccountType: 'E2EE',
              receiverAccountType: 'E2EE',
              recipientKeyHash: '8uMDcHEDhlMQWw==',
              recipientTimestamp: '1761846352'
            },
            deviceListMetadataVersion: 2,
            messageSecret: 'dF01JKZ33CjqgsVTgU9yf5/zhgPaWH1YcadsfCGHP5s='
          },
          base64: 'T2dnUwACAAAAAAAAAA...' // ← ESTRUTURA CORRETA: base64 fora do audioMessage
        },
        contextInfo: {
          disappearingMode: {
            initiator: 'CHANGED_IN_CHAT'
          }
        },
        messageType: 'audioMessage',
        messageTimestamp: 1762442060,
        instanceId: '11b9fc50-a13f-4288-a426-23e8864d4101',
        source: 'web'
      }
    }
  },
  {
    name: 'Mensagem de Imagem (estrutura real)',
    data: {
      event: 'messages.upsert',
      instance: 'IALISSON',
      data: {
        key: {
          remoteJid: '558189951170@s.whatsapp.net',
          fromMe: false,
          id: '3EB0C6236A3EAB29DF4CD1',
          senderLid: '57595544998007@lid'
        },
        pushName: 'Juan',
        status: 'DELIVERY_ACK',
        message: {
          imageMessage: {
            url: 'https://mmg.whatsapp.net/o1/v/t24/f2/m235/AQP5JfVe3lcu2CJb3UoDhhsiacCKHSxj1u3BPrdDAJxjpq900bJ7VZ5m3mGxsNCLdW2KGKJRyaQM8GgIi3ohDdmUwRTg2mcL5BB2RMACdQ',
            mimetype: 'image/jpeg',
            fileSha256: 'IVDRz5HBEMSUprKWjDn9hpB/rJA/4x98zE3/KOZmFYM=',
            fileLength: '147089',
            height: 551,
            width: 831,
            mediaKey: 'LfxoiQwujVJdB2QQCbQgPTa4AWoxb079MToI8qyKpPU=',
            fileEncSha256: 'YfInhw6uMcMISSey6qN/avQwedy6ACfw6Ec/rCGURJo=',
            directPath: '/o1/v/t24/f2/m235/AQP5JfVe3lcu2CJb3UoDhhsiacCKHSxj1u3BPrdDAJxjpq900bJ7VZ5m3mGxsNCLdW2KGKJRyaQM8GgIi3ohDdmUwRTg2mcL5BB2RMACdQ',
            mediaKeyTimestamp: '1762443632',
            jpegThumbnail: '/9j/4AAQSkZJRgABAQAAAQA...',
            contextInfo: {
              disappearingMode: {
                initiator: 'CHANGED_IN_CHAT'
              }
            },
            viewOnce: false
          },
          messageContextInfo: {
            deviceListMetadata: {
              senderKeyHash: 'YmYFa+CIAxW5rg==',
              senderTimestamp: '1762114439',
              senderAccountType: 'E2EE',
              receiverAccountType: 'E2EE',
              recipientKeyHash: '8uMDcHEDhlMQWw==',
              recipientTimestamp: '1761846352'
            },
            deviceListMetadataVersion: 2,
            messageSecret: 'LgE+ntcv8XRX9u7e1UHKS2DuaD7PXkOi0X2BR6VU6Vg='
          },
          base64: '/9j/4AAQSkZJRgABAQAAAQ...' // ← ESTRUTURA CORRETA: base64 fora do imageMessage
        },
        contextInfo: {
          disappearingMode: {
            initiator: 'CHANGED_IN_CHAT'
          }
        },
        messageType: 'imageMessage',
        messageTimestamp: 1762443634,
        instanceId: '11b9fc50-a13f-4288-a426-23e8864d4101',
        source: 'web'
      }
    }
  },
  {
    name: 'Mensagem de Vídeo (estrutura real)',
    data: {
      event: 'messages.upsert',
      instance: 'IALISSON',
      data: {
        key: {
          remoteJid: '558189951170@s.whatsapp.net',
          fromMe: false,
          id: '3EB009952AEAEFEF085753',
          senderLid: '57595544998007@lid'
        },
        pushName: 'Juan',
        status: 'DELIVERY_ACK',
        message: {
          videoMessage: {
            url: 'https://mmg.whatsapp.net/v/t62.7161-24/577789098_834715155627761_2088534210563772399_n.enc',
            mimetype: 'video/mp4',
            fileSha256: 'T2Kle1zjKcp16a538Hc7M2edo13TWow62eDXD3Nx+ek=',
            fileLength: '3023821',
            seconds: 7,
            gifPlayback: false,
            height: 720,
            width: 1280,
            fileEncSha256: 'rxuBxi869WTp5wlf8c8vEZjvn3RH3PX+htWWh6+67ms=',
            directPath: '/v/t62.7161-24/577789098_834715155627761_2088534210563772399_n.enc',
            mediaKeyTimestamp: '1762443917',
            jpegThumbnail: '/9j/4AAQSkZJRgABAQ...',
            contextInfo: {
              disappearingMode: {
                initiator: 'CHANGED_IN_CHAT'
              }
            },
            streamingSidecar: 'qA+NeuDaIIsT9Ym7178KzMfV8AEVygaP6UKy4gF4OGjMWwWH4jMTlG6MvYLojNGFX97WJqA3f/xzp1mfVXZHbrJjWJokOnZJIZwHVc65xztGXYcbTUM2ud4OsH8eVDG98kKf9KbSfhBGVtfMe7p47QXecM5JjaEuCMMDdloTKNROt6/uNOTpWoC4YxjyqlObMYBQZ0j0Cxn62xnQ2zgrekb4t6M6bmJNNg5NQMtoDedLSYAc+Krc0S/5qTlJPG7z4JAQaPTNFqLQrm4ohtD3zhN1HcG7rQ5xlCdu/5kei7T0jr2q8KGTVGPsnVW2oJSjtKJlnpQISrgTSHA56ILJyn8bH/E7NHtcea6Qr4Y7G1Y37jHhjV5wqYlf2o5d5yvrp1OCBtOAP8pVzk+eUV5AH6eQyQT0M9NVmGUXbC+j93iAgX0xJ2sMQw9HDmwqsQJ8n58bexLrSpOmF+VS/GbuSLlJtq4gyAbEyeATDbMIprPEFp6zaxNgdUPdqf9Mv44QbXUShxWaXgPFqeHy0NBvfO1BC+WKeTIFeHzw+GzkhKot7XPlzllB/w+0tv6sR2IpInei7tGpX9yhCQRCp2f/W4aDMGznPwi5u830rDXNRxAsC/dt2yY=',
            viewOnce: false
          },
          messageContextInfo: {
            deviceListMetadata: {
              senderKeyHash: 'YmYFa+CIAxW5rg==',
              senderTimestamp: '1762114439',
              senderAccountType: 'E2EE',
              receiverAccountType: 'E2EE',
              recipientKeyHash: '8uMDcHEDhlMQWw==',
              recipientTimestamp: '1761846352'
            },
            deviceListMetadataVersion: 2,
            messageSecret: '7ZIsf8LQNH2g3zRSxif0ve3LSP4VV9/HOQTqNeoyHz8='
          },
          base64: 'AAAAGGZ0eXBtcD...' // ← ESTRUTURA CORRETA: base64 fora do videoMessage
        },
        contextInfo: {
          disappearingMode: {
            initiator: 'CHANGED_IN_CHAT'
          }
        },
        messageType: 'videoMessage',
        messageTimestamp: 1762443919,
        instanceId: '11b9fc50-a13f-4288-a426-23e8864d4101',
        source: 'web'
      }
    }
  },
  {
    name: 'Mensagem de Texto (controle)',
    data: {
      event: 'messages.upsert',
      instance: 'IALISSON',
      data: {
        key: {
          remoteJid: '558189951170@s.whatsapp.net',
          fromMe: false,
          id: '3EB0C6236A3EAB29DF4CD2',
          senderLid: '57595544998007@lid'
        },
        pushName: 'Juan',
        status: 'DELIVERY_ACK',
        message: {
          conversation: 'Olá! Esta é uma mensagem de texto normal.'
        },
        messageType: 'conversation',
        messageTimestamp: 1762443635,
        instanceId: '11b9fc50-a13f-4288-a426-23e8864d4101',
        source: 'web'
      }
    }
  }
]

console.log('🧪 Testes para processamento de mídias no webhook')
console.log('=' * 50)

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`)
  console.log(`   Tipo: ${testCase.data.data.messageType}`)
  console.log(`   Contato: ${testCase.data.data.pushName}`)
  console.log(`   Telefone: ${testCase.data.data.key.remoteJid}`)

  // Verificar se a estrutura de dados está correta
  if (testCase.data.data.messageType !== 'conversation') {
    const messageKey = Object.keys(testCase.data.data.message).find(key =>
      key.includes('Message') && key !== 'messageContextInfo'
    )
    const mediaData = testCase.data.data.message[messageKey]
    const messageBase64 = testCase.data.data.message.base64 // ← ESTRUTURA CORRETA

    if (mediaData) {
      console.log(`   ✓ Mídia detectada: ${messageKey}`)
      console.log(`   ✓ MIME Type: ${mediaData.mimetype}`)
      console.log(`   ✓ Tamanho: ${mediaData.fileLength} bytes`)
      console.log(`   ✓ Base64 em ${messageKey}: ${!!mediaData.base64}`)
      console.log(`   ✓ Base64 em message.base64: ${!!messageBase64} ← ESTRUTURA CORRETA!`)

      if (!mediaData.base64 && messageBase64) {
        console.log(`   ✅ Base64 encontrado na posição correta (message.base64)`)
      }
    } else {
      console.log(`   ❌ Mídia não encontrada na estrutura`)
    }
  } else {
    console.log(`   ✓ Mensagem de texto: ${testCase.data.data.message.conversation}`)
  }
})

console.log('\n✅ Testes de estrutura concluídos!')
console.log('\n📋 Próximos passos:')
console.log('1. Enviar mensagens reais para o webhook')
console.log('2. Verificar logs do servidor')
console.log('3. Confirmar upload das mídias no Minio Storage')
console.log('4. Validar registros na tabela mensagens')

console.log('\n🌐 Webhook endpoint: http://localhost:3000/api/webhook/whatsapp')