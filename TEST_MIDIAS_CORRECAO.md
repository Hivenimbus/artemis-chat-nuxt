# 🧪 Teste Rápido - Correções de Mídia

## Problema Resolvido
✅ **Mídias corrompidas por processamento incorreto de base64**

## Como Testar as Correções

### 1. Teste com Base64 Real (Recomendado)

```bash
# Testar imagem com base64 válido
curl -X POST http://localhost:3000/api/test/media-fixed \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "useRealBase64": true
  }'

# Testar áudio com base64 válido
curl -X POST http://localhost:3000/api/test/media-fixed \
  -H "Content-Type: application/json" \
  -d '{
    "type": "audio",
    "useRealBase64": true
  }'

# Testar com base64 inválido (deve fazer fallback)
curl -X POST http://localhost:3000/api/test/media-fixed \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "useRealBase64": false
  }'
```

### 2. Verificar nos Logs

Procure por estes logs no console:

```
📷 Processando mídia: { type: 'image', hasBase64: true, base64Length: 67 }
🔍 Analisando base64 recebido...
📝 Base64 info: { length: 67, startsWith: 'iVBORw0KGgoAAAANSUhEUgAAAAEA...' }
🔍 Resultado da validação do base64: { valid: true, details: {...} }
✅ Base64 válido, tentando decodificação...
🔍 Tentando decodificação direta do base64...
✅ Mídia carregada do base64 com sucesso: { method: 'direct', size: 67 }
🎉 Processamento de mídia concluído com sucesso!
```

### 3. Resultados Esperados

#### ✅ Sucesso
```json
{
  "success": true,
  "message": "Teste de mídia do tipo 'image' processado com sucesso",
  "validation": {
    "valid": true,
    "details": {
      "originalLength": 67,
      "cleanLength": 67,
      "bufferSize": 67,
      "cleaned": false
    }
  },
  "result": {
    "contatoId": "...",
    "atendimentoId": "...",
    "mensagemId": "...",
    "hasMedia": true,
    "mediaUrl": "https://gphjqwibtdkqxtuwtncz.supabase.co/storage/v1/object/public/midias/empresas/...",
    "mediaType": "image/png",
    "mediaName": "image_1234567890_1234567890.png"
  }
}
```

#### ❌ Base64 Inválido (com fallback)
```json
{
  "success": true,
  "message": "Teste processado com sucesso",
  "validation": {
    "valid": false,
    "error": "Base64 contém caracteres inválidos"
  },
  "result": {
    "hasMedia": true,  // Ainda funciona via download
    "sourceMethod": "download"
  }
}
```

## Pontos de Verificação

### ✅ Indicadores de Sucesso
1. **Validation = true**: Base64 validado com sucesso
2. **Method = "direct"**: Decodificação sem correções
3. **MediaUrl presente**: Upload realizado com sucesso
4. **BufferSize > 0**: Arquivo gerado corretamente
5. **Sem erros de corrupção**: Arquivo funcional

### ⚠️ Indicadores de Alerta
1. **Validation = false**: Base64 inválido, tentando fallback
2. **Method = "cleaned"**: Base64 precisou de correção
3. **SourceMethod = "download"**: Usou download em vez de base64
4. **Erros nos logs**: Problemas no processamento

## Validar Arquivos Gerados

1. **Acesse a URL retornada** em `mediaUrl`
2. **Verifique se a imagem/áudio abre corretamente**
3. **Confirme que não está corrompido**
4. **Verifique o tamanho do arquivo** no bucket do Supabase

## Comandos Úteis

```bash
# Verificar bucket do Supabase
curl -X POST http://localhost:3000/api/test/storage-check

# Testar webhook com payload real
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '...payload completo...'
```

## Troubleshooting

### Mídia continua corrompida?
1. Verifique os logs para ver qual método foi usado
2. Confirme se `validation.valid = true`
3. Teste com `useRealBase64 = true`
4. Verifique se o arquivo no Supabase tem tamanho > 0

### Base64 sempre falha?
1. O payload da Evolution API pode estar truncado
2. Verifique se `base64Length > 1000` (base64 real é maior)
3. O sistema fará fallback automático para download

### Upload falha?
1. Verifique as variáveis de ambiente do Supabase
2. Confirme se o bucket 'midias' existe
3. Verifique as permissões de storage

## Próximo Passos

1. ✅ Testar com os comandos acima
2. ✅ Verificar os logs detalhados
3. ✅ Validar arquivos gerados
4. ✅ Testar com mensagens reais da Evolution API
5. ✅ Monitorar em produção