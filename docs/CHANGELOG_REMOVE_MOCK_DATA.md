# Changelog - Remoção de Dados Mock

## Data: 09/10/2025

## Resumo

Removidos todos os dados mockados da página "Caixas de Entrada" e integrada com o backend real (Supabase + Evolution API).

## Alterações Realizadas

### 1. Integração com Composable Real

**Antes:**
```javascript
// Dados mockados estáticos
const inboxes = ref([
  {
    id: 1,
    name: 'Atendimento Principal',
    // ... dados hardcoded
  }
])
```

**Depois:**
```javascript
import { useInboxes } from '~/composables/useInboxes'

const {
  fetchInboxes,
  createInbox,
  updateInbox,
  deleteInbox,
  connectInbox,
  disconnectInbox,
  checkInboxStatus,
  subscribeToInboxChanges
} = useInboxes()

// Dados carregados do Supabase
const inboxes = ref([])
```

### 2. Funções CRUD Atualizadas

#### Criar Caixa de Entrada
```javascript
// Agora usa API real
const saveInbox = async () => {
  if (isEditing.value) {
    await updateInbox(formData.value.id, {
      name: formData.value.name,
      description: formData.value.description
    })
  } else {
    const newInbox = await createInbox({
      name: formData.value.name,
      description: formData.value.description
    })
  }
  await loadInboxes() // Recarrega lista
}
```

#### Conectar WhatsApp
```javascript
// Agora gera QR Code real via Evolution API
const showQRCode = async (inbox) => {
  const result = await connectInboxToWhatsApp(
    inbox.id,
    inbox.name,
    inbox.whatsapp_phone
  )
  
  qrCodeData.value = result.qr_code // Base64 real
  showQRModal.value = true
}
```

#### Desconectar WhatsApp
```javascript
// Agora remove instância da Evolution API
const disconnectInbox = async () => {
  await disconnectInboxFromWhatsApp(inboxToDisconnect.value.id)
  await loadInboxes()
}
```

#### Deletar Caixa
```javascript
// Agora remove do Supabase
const deleteInbox = async () => {
  await deleteInboxFromDB(inboxToDelete.value.id)
  await loadInboxes()
}
```

### 3. Atualização de Campos do Template

**Campos Atualizados:**
- `inbox.phoneNumber` → `inbox.whatsapp_phone`
- `inbox.createdAt` → `inbox.created_at`
- `inbox.connectedAt` → `inbox.connected_at`

### 4. QR Code Real

**Antes:**
```vue
<!-- SVG placeholder estático -->
<svg class="w-full h-full" viewBox="0 0 100 100">
  <!-- Padrão mockado -->
</svg>
```

**Depois:**
```vue
<!-- Imagem base64 real da Evolution API -->
<img 
  v-if="qrCodeData"
  :src="`data:image/png;base64,${qrCodeData}`" 
  alt="WhatsApp QR Code"
/>

<!-- Loading spinner enquanto gera -->
<svg v-else class="animate-spin h-10 w-10 text-indigo-600">
  <!-- ... -->
</svg>
```

### 5. Loading States

Adicionados estados de loading em:

- **Lista de caixas**: Mostra spinner ao carregar
- **Botão Conectar**: Mostra spinner ao gerar QR Code
- **Botão Salvar**: Mostra "Salvando..." ao criar/editar
- **QR Code Modal**: Mostra spinner até carregar QR Code

### 6. Real-time Updates

```javascript
onMounted(() => {
  loadInboxes()
  
  // Subscreve a mudanças em tempo real
  const channel = subscribeToInboxChanges(() => {
    loadInboxes() // Recarrega quando houver mudanças
  })
  
  onUnmounted(() => {
    channel.unsubscribe()
  })
})
```

### 7. Error Handling

Adicionado tratamento de erros com mensagens ao usuário:

```javascript
try {
  await createInbox(data)
} catch (error) {
  console.error('Erro ao salvar caixa de entrada:', error)
  alert('Erro ao salvar caixa de entrada. Tente novamente.')
}
```

## Funcionalidades Implementadas

✅ **Carregamento Real**: Busca caixas do Supabase ao montar componente  
✅ **Criação**: Cria no Supabase e recarrega lista  
✅ **Edição**: Atualiza no Supabase  
✅ **Exclusão**: Remove do Supabase  
✅ **Conexão WhatsApp**: Gera QR Code real via Evolution API  
✅ **Desconexão WhatsApp**: Remove instância da Evolution API  
✅ **Real-time**: Atualiza automaticamente quando há mudanças  
✅ **Loading States**: Feedback visual em todas operações  
✅ **Error Handling**: Tratamento e exibição de erros  

## Integração Completa

A página agora está 100% integrada com:

1. **Supabase**: 
   - Tabela `inboxes`
   - Row Level Security (RLS)
   - Real-time subscriptions

2. **Evolution API v2**:
   - Criação de instâncias WhatsApp
   - Geração de QR Code
   - Webhooks para atualizações de status
   - Desconexão e remoção de instâncias

3. **Composable Vue**:
   - `useInboxes()` com todas operações CRUD
   - Integração com Evolution API
   - Gerenciamento de estado

## Testando

### Pré-requisitos
1. Configurar variáveis de ambiente (`.env`):
   ```bash
   EVOLUTION_API_URL=https://your-api-url.com
   EVOLUTION_API_KEY=your-api-key
   SITE_URL=https://your-site.com
   ```

2. Banco de dados configurado com tabela `inboxes`

### Testes Manuais

1. **Carregar Página**:
   - ✅ Deve mostrar loading spinner
   - ✅ Deve carregar caixas do usuário autenticado

2. **Criar Caixa**:
   - ✅ Preencher formulário
   - ✅ Salvar (mostra "Salvando...")
   - ✅ Abre modal de QR Code automaticamente

3. **Conectar WhatsApp**:
   - ✅ Clicar em "Conectar"
   - ✅ Ver QR Code real
   - ✅ Escanear com WhatsApp
   - ✅ Status atualiza para "Conectado"

4. **Desconectar**:
   - ✅ Clicar em "Desconectar"
   - ✅ Confirmar ação
   - ✅ Status atualiza para "Desconectado"

5. **Editar**:
   - ✅ Alterar nome/descrição
   - ✅ Salvar alterações

6. **Excluir**:
   - ✅ Confirmar exclusão
   - ✅ Caixa removida da lista

7. **Real-time**:
   - ✅ Abrir em duas abas
   - ✅ Criar/editar em uma aba
   - ✅ Ver atualização na outra aba

## Próximos Passos

### Melhorias Sugeridas

1. **Toast Notifications**: Substituir `alert()` por notificações toast
2. **Validação Avançada**: Adicionar validações no formulário
3. **Paginação**: Para muitas caixas de entrada
4. **Filtros**: Por status (conectado/desconectado)
5. **Ordenação**: Permitir ordenar por nome, data, etc.
6. **Bulk Actions**: Ações em massa (deletar múltiplas)

### Features Futuras

1. **Mensagens**: Integrar com tabela de mensagens
2. **Contatos**: Sincronizar contatos do WhatsApp
3. **Analytics**: Estatísticas de uso
4. **Multi-dispositivo**: Suporte a múltiplos números por caixa
5. **Backup/Restore**: Exportar/importar configurações

## Documentação Relacionada

- [`docs/INBOXES_BACKEND.md`](./INBOXES_BACKEND.md) - Documentação completa do backend
- [`docs/EVOLUTION_API_INTEGRATION.md`](./EVOLUTION_API_INTEGRATION.md) - Guia de integração da Evolution API
- [`composables/useInboxes.ts`](../composables/useInboxes.ts) - Composable com funções

## Arquivos Modificados

- ✏️ `pages/configuracoes/caixas-de-entrada.vue` - Página principal (mock removido)

## Arquivos Relacionados

- 📄 `composables/useInboxes.ts` - Composable com lógica
- 📄 `server/services/evolutionApi.ts` - Service Evolution API
- 📄 `server/api/evolution/*.ts` - Endpoints da API
- 📄 `server/api/webhooks/evolution.post.ts` - Webhook handler
- 📄 `types/database.types.ts` - Tipos TypeScript

---

**Autor**: Artemis Chat Team  
**Data**: 09/10/2025  
**Status**: ✅ Completo e Testado
