# Integração de Mídias no Webhook WhatsApp

## Overview

O sistema foi atualizado para processar e armazenar mídias (imagens, vídeos, áudios e documentos) recebidas através do webhook do WhatsApp.

## Funcionalidades Implementadas

### ✅ Tipos de Mídia Suportados
- **Imagens**: JPEG, PNG, GIF, WebP
- **Vídeos**: MP4, 3GP, MOV
- **Áudios**: MP3, OGG, WAV
- **Documentos**: PDF, TXT, DOC, etc.

### ✅ Armazenamento
- Bucket `midias` no Supabase Storage
- Organização por empresa: `empresas/{empresaId}/`
- Nome de arquivo único: `{tipo}_{messageId}_{timestamp}.{extensão}`

### ✅ Processamento
- Detecção automática de tipo de mídia
- Download via URL da Evolution API
- Upload para Supabase Storage
- Fallback para base64 (quando disponível)
- Captura de captions/legendas

## Estrutura dos Dados

### Mensagem com Mídia (Exemplo)

```json
{
  "event": "messages.upsert",
  "instance": "IALISSON",
  "data": {
    "key": {
      "remoteJid": "558189951170@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0194B12B8A7F8FD4EAB"
    },
    "pushName": "Juan",
    "messageType": "imageMessage",
    "message": {
      "imageMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "mimetype": "image/jpeg",
        "caption": "Legenda da imagem",
        "base64": "base64_encoded_image_data"
      }
    }
  }
}
```

### Campos Adicionados na Tabela `mensagens`

- `media_url`: URL pública da mídia no Supabase Storage
- `media_type`: MIME type da mídia
- `media_name`: Nome original do arquivo
- `message_type`: Tipo da mensagem (text, image, video, audio, document)

## Fluxo de Processamento

```mermaid
graph TD
    A[Webhook Recebido] --> B{É mensagem de mídia?}
    B -->|Sim| C[Extrair informações da mídia]
    B -->|Não| D[Processar como texto]
    C --> E[Tentar base64 primeiro]
    E -->|Falha| F[Download da URL]
    E -->|Sucesso| G[Upload para Supabase]
    F --> G
    G --> H[Criar mensagem com dados da mídia]
    H --> I[Atualizar atendimento]
    I --> J[Retornar sucesso]
    D --> K[Processamento normal de texto]
    K --> I
```

## Uso

### Endpoint Principal
```
POST /api/webhook/whatsapp
```

### Endpoint de Teste (Antigo)
```
POST /api/test/media
Content-Type: application/json

{
  "type": "image"  // "audio", "image", "video"
}
```

### Endpoint de Teste (Corrigido)
```
POST /api/test/media-fixed
Content-Type: application/json

{
  "type": "image",           // "audio", "image"
  "useRealBase64": true      // true para base64 válido, false para base64 inválido
}
```

**Importante**: Use o endpoint `/api/test/media-fixed` para testar com base64 real e válido. O endpoint antigo usa base64 truncado que causa corrupção.

## Configuração

### Variáveis de Ambiente
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Permissões do Storage
O bucket `midias` foi criado com as seguintes configurações:
- **Privado**: Acesso controlado por políticas RLS
- **Tamanho máximo**: 50MB por arquivo
- **MIME types permitidos**: Imagens, vídeos, áudios e documentos comuns

## Logging

O sistema inclui logs detalhados para monitoramento:
- `📷 Mensagem de mídia detectada`
- `🔽 Baixando mídia da Evolution API`
- `📤 Fazendo upload para Supabase Storage`
- `✅ Upload realizado com sucesso`

## Tratamento de Erros

- **Download falhou**: Tenta usar base64 se disponível
- **Upload falhou**: Continua com processamento de texto apenas
- **Base64 inválido**: Tenta download da URL
- **Storage indisponível**: Log de erro e continuidade do fluxo

## 🔧 Correções de Base64 Implementadas

### Problema Original
As mídias estavam chegando corrompidas porque o sistema não validava o campo `base64` antes de processar, resultando em arquivos inválidos.

### Soluções Implementadas

#### 1. **Validação Robusta de Base64**
```typescript
validateBase64(base64: string): { valid: boolean; error?: string; details?: any }
```
- Verifica estrutura e caracteres válidos
- Valida padding e tamanho mínimo
- Testa decodificação real antes de processar

#### 2. **Múltiplos Métodos de Decodificação**
```typescript
decodeBase64(base64: string): { success: boolean; buffer?: Buffer; error?: string; method?: string }
```
- Método 1: Decodificação direta
- Método 2: Com limpeza e normalização
- Método 3: Sem padding (fallback)

#### 3. **Logging Detalhado**
- Log do base64 bruto recebido
- Resultados da validação
- Método de decodificação utilizado
- Estatísticas do buffer gerado

#### 4. **Fallback Inteligente**
- Base64 validado → usa preferencialmente
- Base64 inválido → tenta download
- Base64 corrompido → múltiplas tentativas de correção
- Todos falham → log detalhado do erro

### Estratégia de Processamento

```mermaid
graph TD
    A[Base64 recebido] --> B[Validar base64]
    B -->|Válido| C[Tentar decodificação]
    B -->|Inválido| D[Log erro + Tentar download]
    C -->|Sucesso| E[Usar base64]
    C -->|Falha| F[Tentar métodos alternativos]
    F -->|Sucesso| E
    F -->|Falha| D
    D -->|Sucesso| G[Usar download]
    D -->|Falha| H[Erro crítico]
    E --> I[Upload para Supabase]
    G --> I
```

### Logs de Diagnóstico

O sistema agora gera logs detalhados como:
```
📷 Processando mídia: { type: 'image', hasBase64: true, base64Length: 12345 }
🔍 Analisando base64 recebido...
📝 Base64 info: { length: 12345, startsWith: 'iVBORw0KGgoA...' }
🔍 Resultado da validação do base64: { valid: true, details: {...} }
✅ Base64 válido, tentando decodificação...
🔍 Tentando decodificação direta do base64...
✅ Mídia carregada do base64 com sucesso: { method: 'direct', size: 1024 }
🎉 Processamento de mídia concluído com sucesso!
```

## Performance

- Prioriza uso de base64 (mais rápido)
- Upload em streaming para arquivos grandes
- Cache control de 1 hora para URLs públicas
- Processamento assíncrono para não bloquear webhook

## Exemplos de Uso

### Processar Imagem com Caption
```javascript
// O sistema automaticamente:
// 1. Detecta que é imageMessage
// 2. Extrai caption como texto da mensagem
// 3. Baixa a imagem ou usa base64
// 4. Faz upload para o bucket midias
// 5. Salva URL e metadados na mensagem
```

### Processar Áudio
```javascript
// Para mensagens de áudio:
// 1. Detecta audioMessage
// 2. Gera texto descritivo "🎵 Áudio"
// 3. Processa arquivo de áudio
// 4. Armazena com extensão .ogg/.mp3/.wav
```

## Monitoramento

### Logs Importantes
- `media.processed`: Mídia processada com sucesso
- `media.processing_failed`: Falha no processamento
- `webhook.media_processed`: Webhook de mídia concluído

### Métricas
- Tempo de processamento por tipo de mídia
- Taxa de sucesso de uploads
- Espaço utilizado no storage
- Volume de mídias por empresa

## Futuras Melhorias

- [ ] Compressão automática de imagens
- [ ] Transcodificação de vídeos
- [ ] Cache local de mídias frequentes
- [ ] Detecção de conteúdo inapropriado
- [ ] Geração de thumbnails para vídeos
- [ ] Suporte a stickers do WhatsApp