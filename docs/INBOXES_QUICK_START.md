# 🚀 Quick Start - Caixas de Entrada

## ✅ Implementação Completa

O back-end das Caixas de Entrada foi **100% implementado** no Supabase via MCP server.

## 📋 O que foi criado?

### 1. Banco de Dados (Supabase)
```sql
-- Tabela: public.inboxes
-- 11 colunas | 3 índices | 4 políticas RLS | 1 trigger
```

### 2. Arquivos do Projeto

```
artemis-chat-nuxt/
├── types/
│   └── database.types.ts          ✅ Tipos TypeScript
├── composables/
│   └── useInboxes.ts              ✅ Composable Vue
└── docs/
    ├── INBOXES_BACKEND.md         ✅ Documentação completa
    └── INBOXES_QUICK_START.md     ✅ Este arquivo
```

## 🎯 Como Usar

### Importar o composable

```vue
<script setup>
import { useInboxes } from '~/composables/useInboxes'

const { 
  fetchInboxes,
  createInbox,
  updateInbox,
  deleteInbox
} = useInboxes()
</script>
```

### Buscar todas as caixas

```typescript
const inboxes = ref([])

const loadInboxes = async () => {
  inboxes.value = await fetchInboxes()
}

onMounted(() => loadInboxes())
```

### Criar nova caixa

```typescript
const createNew = async () => {
  const inbox = await createInbox({
    name: 'Minha Caixa',
    description: 'Descrição opcional'
  })
  console.log('Criada:', inbox)
}
```

### Atualizar caixa

```typescript
const update = async (id: string) => {
  await updateInbox(id, {
    name: 'Novo nome'
  })
}
```

### Deletar caixa

```typescript
const remove = async (id: string) => {
  await deleteInbox(id)
}
```

## 🔧 Funções Disponíveis

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `fetchInboxes()` | Lista todas as caixas | `Promise<Inbox[]>` |
| `fetchInboxById(id)` | Busca uma caixa | `Promise<Inbox>` |
| `createInbox(data)` | Cria nova caixa | `Promise<Inbox>` |
| `updateInbox(id, data)` | Atualiza caixa | `Promise<Inbox>` |
| `deleteInbox(id)` | Remove caixa | `Promise<boolean>` |
| `connectInbox(id, phone)` | Conecta WhatsApp | `Promise<Inbox>` |
| `disconnectInbox(id)` | Desconecta WhatsApp | `Promise<Inbox>` |
| `generateQRCode(id)` | Gera QR Code | `Promise<Inbox>` |
| `subscribeToInboxChanges(cb)` | Realtime | `RealtimeChannel` |

## 🔒 Segurança

- ✅ **RLS Ativo**: Cada usuário só vê suas próprias caixas
- ✅ **Validação**: Formato de telefone validado no banco
- ✅ **Auth Check**: Todas as funções verificam autenticação

## 📊 Estrutura da Tabela

```typescript
type Inbox = {
  id: string                    // UUID
  name: string                  // Nome da caixa
  description: string | null    // Descrição (opcional)
  status: 'connected' | 'disconnected'
  phone_number: string | null   // Formato: apenas dígitos
  qr_code: string | null        // QR Code base64
  session_data: Json | null     // Dados da sessão WhatsApp
  created_at: string | null     // ISO timestamp
  updated_at: string | null     // ISO timestamp
  connected_at: string | null   // ISO timestamp
  user_id: string | null        // UUID do usuário
}
```

## 🚧 Próximos Passos

### Para integrar WhatsApp real:

1. **Escolher biblioteca**
   - whatsapp-web.js
   - baileys
   - venom-bot

2. **Implementar no composable**
   - Substituir placeholders em `connectInbox()`
   - Substituir placeholder em `generateQRCode()`
   - Implementar lógica real de sessão

3. **Criar API/Webhooks**
   - Endpoint para receber mensagens
   - Sincronizar status de conexão

## 📚 Documentação Completa

Para mais detalhes, veja `docs/INBOXES_BACKEND.md`

## 🐛 Troubleshooting

**Erro: "Usuário não autenticado"**
- Verifique se `useSupabaseUser()` retorna um usuário

**Erro ao criar/atualizar**
- Verifique se os campos obrigatórios estão preenchidos
- Confirme formato do telefone (apenas dígitos, 10-15 caracteres)

**RLS bloqueando acesso**
- Confirme que `user_id` está sendo passado corretamente
- Verifique políticas no Supabase Dashboard

## 💡 Dicas

1. **Realtime**: Use `subscribeToInboxChanges()` para atualizar UI automaticamente
2. **Validação**: O campo `phone_number` aceita apenas dígitos (10-15)
3. **Status**: Sempre começa como 'disconnected' ao criar
4. **Trigger**: O campo `updated_at` é atualizado automaticamente

---

**Pronto para usar! 🎊**

*Última atualização: 09/10/2025 20:32 UTC*
