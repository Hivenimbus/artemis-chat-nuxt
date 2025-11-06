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

### Endpoints de Teste

#### Teste Básico
```
POST /api/test/media
Content-Type: application/json

{
  "type": "image"  // "audio", "image", "video"
}
```

#### Teste de Debug (Cenários de Corrupção)
```
POST /api/test/media-debug
Content-Type: application/json

{
  "testType": "valid-base64"           // Base64 válido - deve funcionar
  "testType": "invalid-base64-truncated"  // Base64 truncado - deve falhar
  "testType": "invalid-base64-format"    // Formato inválido - deve falhar
  "testType": "size-mismatch"           // Tamanho não corresponde - deve falhar
  "testType": "no-base64-no-url"        // Sem dados - deve falhar
}
```

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

## Tratamento de Erros e Validação Robusta

### Validações Implementadas

1. **Validação de Base64**
   - Verificação de formato regex
   - Validação de padding (máximo 2 =)
   - Comparação de tamanho esperado
   - Teste de decodificação para confirmar validade

2. **Validação de Hash SHA256**
   - Compara hash do arquivo com hash esperado
   - Detecta corrupção ou truncamento
   - Falha rápida se hash não corresponder

3. **Validação de Imagem**
   - Verificação de magic numbers (JPEG, PNG, GIF, WebP)
   - Validação de tamanho mínimo
   - Detecção de cabeçalhos inválidos

4. **Validação de Download**
   - Verificação de Content-Type
   - Validação de Content-Length
   - Timeout de 30 segundos
   - User-Agent personalizado

### Fluxo de Recuperação

- **Base64 inválido**: Tenta download da URL
- **Download falhou**: Log detalhado do erro
- **Hash não corresponde**: Falha imediata para evitar corrupção
- **Buffer inválido**: Detecta magic numbers incorretos
- **Size mismatch**: Verifica diferença > 20% do esperado
- **Upload falhou**: Continua com processamento de texto apenas

### Logs Detalhados

Sistema de logging em múltiplas etapas:
- `🔍 [INÍCIO]`: Início do processamento
- `📷 Informações da mídia`: Metadados completos
- `🔍 [BASE64]`: Validação e processamento de base64
- `🔍 [DOWNLOAD]`: Download da URL com validações
- `✅ [SUCESSO]`: Buffer validado com sucesso
- `📤 [UPLOAD]`: Upload para Supabase
- `✅ [COMPLETO]`: Processamento concluído
- `❌ [FALHA]`: Erros específicos com contexto

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