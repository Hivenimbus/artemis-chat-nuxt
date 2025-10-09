# Back-end da Página Caixas de Entrada

## Resumo

Este documento descreve a implementação do back-end para a funcionalidade de Caixas de Entrada do WhatsApp no sistema Artemis Chat.

## Estrutura do Banco de Dados

### Tabela: `inboxes`

Tabela criada no Supabase para armazenar as caixas de entrada do WhatsApp.

#### Campos

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único (PK) | Primary Key, auto-gerado |
| `name` | TEXT | Nome da caixa de entrada | NOT NULL |
| `description` | TEXT | Descrição opcional | NULL |
| `status` | TEXT | Status da conexão | 'connected' ou 'disconnected' |
| `phone_number` | TEXT | Número conectado | NULL, formato: apenas dígitos (10-15) |
| `qr_code` | TEXT | QR Code para conexão | NULL |
| `session_data` | JSONB | Dados da sessão WhatsApp | NULL |
| `created_at` | TIMESTAMPTZ | Data de criação | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Data da última atualização | DEFAULT NOW() |
| `connected_at` | TIMESTAMPTZ | Data da última conexão | NULL |
| `user_id` | UUID | ID do usuário proprietário | FK para auth.users(id) |

#### Índices

- `idx_inboxes_user_id` - Índice no campo `user_id` para otimizar consultas
- `idx_inboxes_status` - Índice no campo `status` para filtros rápidos
- `idx_inboxes_created_at` - Índice no campo `created_at` (DESC) para ordenação

#### Segurança (RLS - Row Level Security)

**Políticas implementadas:**

1. **SELECT**: Usuários podem visualizar apenas suas próprias caixas de entrada
   ```sql
   USING (auth.uid() = user_id)
   ```

2. **INSERT**: Usuários podem criar suas próprias caixas de entrada
   ```sql
   WITH CHECK (auth.uid() = user_id)
   ```

3. **UPDATE**: Usuários podem atualizar suas próprias caixas de entrada
   ```sql
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id)
   ```

4. **DELETE**: Usuários podem deletar suas próprias caixas de entrada
   ```sql
   USING (auth.uid() = user_id)
   ```

#### Triggers

- **update_inboxes_updated_at**: Atualiza automaticamente o campo `updated_at` antes de cada UPDATE

## Arquivos Criados

### 1. Types (`types/database.types.ts`)

Tipos TypeScript gerados automaticamente pelo Supabase contendo:

```typescript
// Tipos principais
export type Inbox = Tables<'inboxes'>
export type InboxInsert = TablesInsert<'inboxes'>
export type InboxUpdate = TablesUpdate<'inboxes'>
export type InboxStatus = 'connected' | 'disconnected'
```

### 2. Composable (`composables/useInboxes.ts`)

Composable Vue/Nuxt com todas as operações CRUD e funcionalidades adicionais:

#### Funções Disponíveis

##### CRUD Básico

- **`fetchInboxes()`**: Busca todas as caixas de entrada do usuário
  - Retorna: `Promise<Inbox[]>`
  - Ordena por: `created_at DESC`

- **`fetchInboxById(id: string)`**: Busca uma caixa específica
  - Parâmetros: `id` - UUID da caixa de entrada
  - Retorna: `Promise<Inbox>`

- **`createInbox(inboxData)`**: Cria uma nova caixa de entrada
  - Parâmetros: `inboxData` - Dados da caixa (nome, descrição)
  - Retorna: `Promise<Inbox>`
  - Auto-preenche: `user_id`, `status: 'disconnected'`

- **`updateInbox(id, inboxData)`**: Atualiza uma caixa existente
  - Parâmetros: 
    - `id` - UUID da caixa
    - `inboxData` - Campos para atualizar
  - Retorna: `Promise<Inbox>`

- **`deleteInbox(id)`**: Remove uma caixa de entrada
  - Parâmetros: `id` - UUID da caixa
  - Retorna: `Promise<boolean>`

##### Funcionalidades WhatsApp

- **`connectInbox(id, phoneNumber)`**: Conecta uma caixa ao WhatsApp
  - Parâmetros:
    - `id` - UUID da caixa
    - `phoneNumber` - Número do WhatsApp
  - Atualiza: `status`, `phone_number`, `connected_at`
  - Retorna: `Promise<Inbox>`
  - **TODO**: Implementar lógica real de conexão

- **`disconnectInbox(id)`**: Desconecta uma caixa do WhatsApp
  - Parâmetros: `id` - UUID da caixa
  - Limpa: `phone_number`, `qr_code`, `session_data`
  - Atualiza: `status` para 'disconnected'
  - Retorna: `Promise<Inbox>`
  - **TODO**: Implementar lógica real de desconexão

- **`generateQRCode(id)`**: Gera QR Code para conexão
  - Parâmetros: `id` - UUID da caixa
  - Retorna: `Promise<Inbox>`
  - **TODO**: Implementar geração real de QR Code

##### Realtime

- **`subscribeToInboxChanges(callback)`**: Subscreve a mudanças nas caixas
  - Parâmetros: `callback` - Função chamada em mudanças
  - Retorna: `RealtimeChannel`
  - Monitora: INSERT, UPDATE, DELETE na tabela `inboxes`

## Exemplo de Uso

```vue
<script setup>
import { useInboxes } from '~/composables/useInboxes'

const { 
  fetchInboxes, 
  createInbox, 
  updateInbox, 
  deleteInbox,
  connectInbox,
  disconnectInbox
} = useInboxes()

// Buscar todas as caixas
const inboxes = ref([])
const loadInboxes = async () => {
  try {
    inboxes.value = await fetchInboxes()
  } catch (error) {
    console.error('Erro ao carregar caixas:', error)
  }
}

// Criar nova caixa
const createNewInbox = async () => {
  try {
    const newInbox = await createInbox({
      name: 'Minha Caixa',
      description: 'Descrição da caixa'
    })
    console.log('Caixa criada:', newInbox)
  } catch (error) {
    console.error('Erro ao criar caixa:', error)
  }
}

// Conectar caixa
const handleConnect = async (inboxId) => {
  try {
    const connected = await connectInbox(inboxId, '5511999999999')
    console.log('Caixa conectada:', connected)
  } catch (error) {
    console.error('Erro ao conectar:', error)
  }
}

onMounted(() => {
  loadInboxes()
})
</script>
```

## Próximos Passos

### Integração WhatsApp

1. **Escolher biblioteca**: Avaliar opções como:
   - `whatsapp-web.js`
   - `baileys`
   - `venom-bot`

2. **Implementar conexão real**:
   - Geração de QR Code real
   - Gestão de sessões
   - Armazenamento de `session_data`

3. **Webhook/API**:
   - Endpoint para receber mensagens
   - Processamento de eventos do WhatsApp
   - Sincronização de status

### Features Adicionais

1. **Mensagens**:
   - Criar tabela `messages`
   - Relacionar com `inboxes`
   - Implementar envio/recebimento

2. **Contatos**:
   - Criar tabela `contacts`
   - Sincronizar contatos do WhatsApp
   - Gestão de conversas

3. **Analytics**:
   - Métricas de uso
   - Estatísticas de mensagens
   - Relatórios

## Troubleshooting

### Erros Comuns

1. **"Usuário não autenticado"**
   - Verificar se há sessão ativa
   - Confirmar middleware de autenticação

2. **Políticas RLS bloqueando acesso**
   - Verificar se `user_id` está correto
   - Confirmar políticas no Supabase Dashboard

3. **Erro ao criar/atualizar**
   - Verificar tipos dos campos
   - Confirmar constraints (ex: formato do telefone)

## Documentação Adicional

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)

## Migration Script

A migration SQL pode ser encontrada nos logs do Supabase MCP ou pode ser regenerada executando:

```bash
# No terminal do projeto
supabase db diff -f create_inboxes_table
```

---

## Status da Implementação

✅ **IMPLEMENTADO COM SUCESSO** - 09/10/2025

### Verificação da Implementação

Todos os componentes foram implementados e verificados via Supabase MCP:

#### Tabela `inboxes`
- ✅ 11 colunas criadas corretamente
- ✅ Tipos de dados corretos (UUID, TEXT, JSONB, TIMESTAMPTZ)
- ✅ Constraints de validação aplicados
- ✅ Valores padrão configurados
- ✅ Comentários de documentação adicionados

#### Índices
- ✅ `idx_inboxes_user_id` - Índice no user_id
- ✅ `idx_inboxes_status` - Índice no status
- ✅ `idx_inboxes_created_at` - Índice no created_at (DESC)
- ✅ `inboxes_pkey` - Primary key no id

#### Row Level Security (RLS)
- ✅ RLS habilitado na tabela
- ✅ 4 políticas implementadas:
  - SELECT: "Users can view their own inboxes"
  - INSERT: "Users can create their own inboxes"
  - UPDATE: "Users can update their own inboxes"
  - DELETE: "Users can delete their own inboxes"

#### Triggers
- ✅ Função `update_inboxes_updated_at()` criada
- ✅ Trigger `update_inboxes_updated_at_trigger` ativo

#### Foreign Keys
- ✅ `inboxes_user_id_fkey` → auth.users(id) com ON DELETE CASCADE

### Arquivos do Projeto
- ✅ `types/database.types.ts` - Tipos TypeScript atualizados
- ✅ `composables/useInboxes.ts` - Composable com todas as operações
- ✅ `docs/INBOXES_BACKEND.md` - Documentação completa

---

**Data de Criação**: 2025-10-09  
**Autor**: Artemis Chat Team  
**Versão**: 1.0.0  
**Última Atualização**: 2025-10-09 20:32 UTC
