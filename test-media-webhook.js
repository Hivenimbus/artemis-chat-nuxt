#!/usr/bin/env node

// Script para testar webhook de mídias do WhatsApp
const http = require('http');

// Configuração
const WEBHOOK_URL = 'http://localhost:3001/api/webhook/whatsapp';
const INSTANCE_ID = 'IALISSON';

// Dados de teste baseados nos exemplos fornecidos
const testCases = [
  {
    name: 'Mensagem de Áudio',
    data: {
      event: 'messages.upsert',
      instance: INSTANCE_ID,
      data: {
        key: {
          remoteJid: '558189951170@s.whatsapp.net',
          fromMe: false,
          id: '3EB0194B12B8A7F8FD4EAB',
          senderLid: '57595544998007@lid'
        },
        pushName: 'Juan Teste',
        status: 'DELIVERY_ACK',
        message: {
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc?ccb=11-4&oh=01_Q5Aa2wH0HmWXWEyuLkZ9BsnI4cMjJP5xOwyIin8YU8IySASfSA&oe=69343766&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/ogg; codecs=opus",
            fileSha256: "qKQ7KdeS1q+ARUOJp0/OiW26XWlZ7uyaMroMidomR00=",
            fileLength: "6406",
            seconds: 3,
            ptt: true,
            mediaKey: "hlNcuJxKL+ZzTI0GfQkVU78YceBe10aw5MCP8rqy+cc=",
            fileEncSha256: "cU+Wh9Mn+3WaBVzXF7Lo+X7cuO0Y+I7vjQK2Fk7vDjI=",
            directPath: "/v/t62.7117-24/541668652_1357600769103290_5973464008582382895_n.enc?ccb=11-4&oh=01_Q5Aa2wH0HmWXWEyuLkZ9BsnI4cMjJP5xOwyIin8YU8IySASfSA&oe=69343766&_nc_sid=5e03e0",
            mediaKeyTimestamp: "1762442059",
            waveform: "BQUEBQgLCAQAAAARNFhSRkBKVFFIP0BBQkJDR0tQUFBKQDY5PkFBQDw3MjlARUVGPC4jLjk6MCYpLy4aBwAAAA==",
            viewOnce: false,
            base64: "T2dnUwACAAAAAAAAAA..." // Base64 curto para teste
          },
          messageContextInfo: {
            deviceListMetadata: {
              senderKeyHash: "YmYFa+CIAxW5rg==",
              senderTimestamp: "1762114439",
              senderAccountType: "E2EE",
              receiverAccountType: "E2EE",
              recipientKeyHash: "8uMDcHEDhlMQWw==",
              recipientTimestamp: "1761846352"
            },
            deviceListMetadataVersion: 2,
            messageSecret: "dF01JKZ33CjqgsVTgU9yf5/zhgPaWH1YcadsfCGHP5s="
          }
        },
        contextInfo: {
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT"
          }
        },
        messageType: "audioMessage",
        messageTimestamp: 1762442060,
        instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
        source: "web"
      },
      destination: "https://n8n.hivebot.cloud/webhook/agencia-viagens",
      date_time: "2025-11-06T15:14:21.300Z",
      sender: "558398071683@s.whatsapp.net",
      server_url: "https://evolution-hive-evolution.jjqtga.easypanel.host",
      apikey: "FEAC6C4294E7-45DD-822F-AF99C8F471CC"
    }
  },
  {
    name: 'Mensagem de Imagem',
    data: {
      event: 'messages.upsert',
      instance: INSTANCE_ID,
      data: {
        key: {
          remoteJid: '558189951170@s.whatsapp.net',
          fromMe: false,
          id: '3EB0C6236A3EAB29DF4CD1',
          senderLid: '57595544998007@lid'
        },
        pushName: 'Juan Teste',
        status: 'DELIVERY_ACK',
        message: {
          imageMessage: {
            url: "https://mmg.whatsapp.net/o1/v/t24/f2/m235/AQP5JfVe3lcu2CJb3UoDhhsiacCKHSxj1u3BPrdDAJxjpq900bJ7VZ5m3mGxsNCLdW2KGKJRyaQM8GgIi3ohDdmUwRTg2mcL5BB2RMACdQ?ccb=9-4&oh=01_Q5Aa2wFozHyNOpYmXGMlL_gsX7SeSMHLwORpSuBpb5i0mqZDtA&oe=693438A2&_nc_sid=e6ed6c&mms3=true",
            mimetype: "image/jpeg",
            fileSha256: "IVDRz5HBEMSUprKWjDn9hpB/rJA/4x98zE3/KOZmFYM=",
            fileLength: "147089",
            height: 551,
            width: 831,
            mediaKey: "LfxoiQwujVJdB2QQCbQgPTa4AWoxb079MToI8qyKpPU=",
            fileEncSha256: "YfInhw6uMcMISSey6qN/avQwedy6ACfw6Ec/rCGURJo=",
            directPath: "/o1/v/t24/f2/m235/AQP5JfVe3lcu2CJb3UoDhhsiacCKHSxj1u3BPrdDAJxjpq900bJ7VZ5m3mGxsNCLdW2KGKJRyaQM8GgIi3ohDdmUwRTg2mcL5BB2RMACdQ?ccb=9-4&oh=01_Q5Aa2wFozHyNOpYmXGMlL_gsX7SeSMHLwORpSuBpb5i0mqZDtA&oe=693438A2&_nc_sid=e6ed6c",
            mediaKeyTimestamp: "1762443632",
            caption: "Imagem de teste para webhook",
            viewOnce: false,
            base64: "/9j/4AAQSkZJRgABAQAAAQ..." // Base64 curto para teste
          },
          messageContextInfo: {
            deviceListMetadata: {
              senderKeyHash: "YmYFa+CIAxW5rg==",
              senderTimestamp: "1762114439",
              senderAccountType: "E2EE",
              receiverAccountType: "E2EE",
              recipientKeyHash: "8uMDcHEDhlMQWw==",
              recipientTimestamp: "1761846352"
            },
            deviceListMetadataVersion: 2,
            messageSecret: "LgE+ntcv8XRX9u7e1UHKS2DuaD7PXkOi0X2BR6VU6Vg="
          }
        },
        contextInfo: {
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT"
          }
        },
        messageType: "imageMessage",
        messageTimestamp: 1762443634,
        instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
        source: "web"
      },
      destination: "https://n8n.hivebot.cloud/webhook/agencia-viagens",
      date_time: "2025-11-06T15:40:34.809Z",
      sender: "558398071683@s.whatsapp.net",
      server_url: "https://evolution-hive-evolution.jjqtga.easypanel.host",
      apikey: "FEAC6C4294E7-45DD-822F-AF99C8F471CC"
    }
  },
  {
    name: 'Mensagem de Vídeo',
    data: {
      event: 'messages.upsert',
      instance: INSTANCE_ID,
      data: {
        key: {
          remoteJid: '558189951170@s.whatsapp.net',
          fromMe: false,
          id: '3EB009952AEAEFEF085753',
          senderLid: '57595544998007@lid'
        },
        pushName: 'Juan Teste',
        status: 'DELIVERY_ACK',
        message: {
          videoMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/577789098_834715155627761_2088534210563772399_n.enc?ccb=11-4&oh=01_Q5Aa2wFmBFR7IALC__TrdEqZnIkkEWEAwrjaqco1bsCRg8EErQ&oe=69341EBB&_nc_sid=5e03e0&mms3=true",
            mimetype: "video/mp4",
            fileSha256: "T2Kle1zjKcp16a538Hc7M2edo13TWow62eDXD3Nx+ek=",
            fileLength: "3023821",
            seconds: 7,
            mediaKey: "uE7VndUNLy9simC8U+4d20tKuKi9eN1B+jRDZtDaXSE=",
            gifPlayback: false,
            height: 720,
            width: 1280,
            fileEncSha256: "rxuBxi869WTp5wlf8c8vEZjvn3RH3PX+htWWh6+67ms=",
            directPath: "/v/t62.7161-24/577789098_834715155627761_2088534210563772399_n.enc?ccb=11-4&oh=01_Q5Aa2wFmBFR7IALC__TrdEqZnIkkEWEAwrjaqco1bsCRg8EErQ&oe=69341EBB&_nc_sid=5e03e0",
            mediaKeyTimestamp: "1762443917",
            caption: "Vídeo de teste para webhook",
            viewOnce: false,
            base64: "AAAAGGZ0eXBtcD..." // Base64 curto para teste
          },
          messageContextInfo: {
            deviceListMetadata: {
              senderKeyHash: "YmYFa+CIAxW5rg==",
              senderTimestamp: "1762114439",
              senderAccountType: "E2EE",
              receiverAccountType: "E2EE",
              recipientKeyHash: "8uMDcHEDhlMQWw==",
              recipientTimestamp: "1761846352"
            },
            deviceListMetadataVersion: 2,
            messageSecret: "7ZIsf8LQNH2g3zRSxif0ve3LSP4VV9/HOQTqNeoyHz8="
          }
        },
        contextInfo: {
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT"
          }
        },
        messageType: "videoMessage",
        messageTimestamp: 1762443919,
        instanceId: "11b9fc50-a13f-4288-a426-23e8864d4101",
        source: "web"
      },
      destination: "https://n8n.hivebot.cloud/webhook/agencia-viagens",
      date_time: "2025-11-06T15:45:19.726Z",
      sender: "558398071683@s.whatsapp.net",
      server_url: "https://evolution-hive-evolution.jjqtga.easypanel.host",
      apikey: "FEAC6C4294E7-45DD-822F-AF99C8F471CC"
    }
  }
];

// Função para enviar requisição HTTP
function sendWebhook(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testCase.data);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/whatsapp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🚀 Enviando teste: ${testCase.name}`);
    console.log(`📋 MessageType: ${testCase.data.data.messageType}`);
    console.log(`📞 RemoteJid: ${testCase.data.data.key.remoteJid}`);
    console.log(`👤 PushName: ${testCase.data.data.pushName}`);

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`✅ Resposta (${res.statusCode}):`, response);
          resolve(response);
        } catch (error) {
          console.log(`❌ Erro ao parsear resposta:`, error.message);
          console.log(`📄 Resposta bruta:`, body);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Erro na requisição:`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Executar testes
async function runTests() {
  console.log('🧪 Iniciando testes do webhook de mídias WhatsApp\n');

  for (const testCase of testCases) {
    try {
      await sendWebhook(testCase);
      console.log('⏳ Aguardando 2 segundos antes do próximo teste...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Falha no teste "${testCase.name}":`, error.message);
    }
  }

  console.log('\n🏁 Testes concluídos!');
}

// Verificar se o servidor está rodando
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/whatsapp',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log('✅ Servidor está rodando na porta 3001');
      resolve();
    });

    req.on('error', () => {
      console.error('❌ Servidor não está rodando na porta 3001');
      console.error('💡 Execute "npm run dev" antes de rodar este script');
      reject(new Error('Servidor não encontrado'));
    });

    req.end();
  });
}

// Executar script
if (require.main === module) {
  checkServer()
    .then(runTests)
    .catch(error => {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    });
}

module.exports = { testCases, sendWebhook };