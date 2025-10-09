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

## Integração com Evolution API v2

### Visão Geral

A integração do WhatsApp foi implementada usando a **Evolution API v2**, uma API REST completa para WhatsApp Web baseada em Baileys.

### Arquivos da Integração

#### 1. Service Layer (`server/services/evolutionApi.ts`)

Serviço server-side que encapsula todas as interações com a Evolution API:

**Classes e Tipos:**
- `EvolutionApiClient` - Cliente HTTP para Evolution API
- `EvolutionInstance` - Configuração de instância
- `EvolutionInstanceStatus` - Status da instância
- `EvolutionConnectionState` - Estado da conexão
- `EvolutionWebhookEvent` - Evento de webhook

**Métodos Principais:**
- `createInstance(config)` - Cria nova instância do WhatsApp
- `fetchInstance(instanceName)` - Busca status da conexão
- `deleteInstance(instanceName)` - Remove instância
- `logoutInstance(instanceName)` - Desconecta do WhatsApp
- `setWebhook(instanceName, url, events)` - Configura webhook
- `sendTextMessage(instanceName, message)` - Envia mensagem de texto
- `getQRCode(instanceName)` - Obtém QR Code

#### 2. API Endpoints

##### `POST /api/evolution/create-instance`
Cria uma nova instância do WhatsApp e retorna o QR Code:

```typescript
// Request
{
  inboxId: string,
  name: string,
  phone?: string  // Opcional para pairing code
}

// Response
{
  success: true,
  inbox: Inbox,
  instance: {
    name: string,
    status: string,
    qrCode: string,  // Base64 do QR Code
    pairingCode?: string
  }
}
```

##### `GET /api/evolution/status/:inboxId`
Verifica o status atual de uma instância:

```typescript
// Response
{
  success: true,
  status: 'open' | 'close' | 'connecting' | 'not_connected',
  inbox: Inbox
}
```

##### `POST /api/evolution/disconnect`
Desconecta e remove uma instância:

```typescript
// Request
{
  inboxId: string
}

// Response
{
  success: true,
  inbox: Inbox,
  message: string
}
```

#### 3. Webhook Handler (`server/api/webhooks/evolution.post.ts`)

Endpoint que recebe eventos da Evolution API:

**Eventos Tratados:**
- `QRCODE_UPDATED` - Atualiza QR Code no banco
- `CONNECTION_UPDATE` - Atualiza status da conexão
- `MESSAGES_UPSERT` - Nova mensagem recebida
- `MESSAGES_UPDATE` - Atualização de mensagem
- `MESSAGES_DELETE` - Mensagem deletada

**Funções Handler:**
- `handleQRCodeUpdate()` - Processa atualização de QR Code
- `handleConnectionUpdate()` - Processa mudança de status
- `handleNewMessage()` - Processa nova mensagem
- `handleMessageUpdate()` - Processa atualização de mensagem
- `handleMessageDelete()` - Processa deleção de mensagem

### Fluxo de Conexão

1. **Usuário solicita conexão**:
   - Frontend chama `connectInbox(id, name, phone?)`
   - Composable faz POST para `/api/evolution/create-instance`

2. **Backend cria instância**:
   - API endpoint chama Evolution API para criar instância
   - Gera nome único: `inbox_{inboxId}_{timestamp}`
   - Configura webhook para eventos
   - Retorna QR Code em base64

3. **Banco é atualizado**:
   - `session_data` armazena: `{ instanceName, status, pairingCode }`
   - `qr_code` armazena base64 do QR Code
   - `status` muda para 'connecting'

4. **Usuário escaneia QR Code**:
   - Evolution API detecta conexão
   - Envia webhook `CONNECTION_UPDATE` com `state: 'open'`

5. **Webhook processa evento**:
   - Atualiza `status` para 'connected'
   - Limpa `qr_code`
   - Atualiza `session_data` com novo estado

### Configuração

#### Variáveis de Ambiente (`.env`)

```bash
# Evolution API
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key

# Site URL (para webhooks)
SITE_URL=https://your-site.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Runtime Config (`nuxt.config.ts`)

```typescript
runtimeConfig: {
  // Server-only
  evolutionApiKey: process.env.EVOLUTION_API_KEY,
  
  // Public
  public: {
    evolutionApiUrl: process.env.EVOLUTION_API_URL,
    siteUrl: process.env.SITE_URL
  }
}
```

### Segurança

1. **API Key**: Mantida apenas no server (nunca exposta ao client)
2. **Autenticação**: Endpoints verificam sessão do usuário
3. **RLS**: Garante acesso apenas às próprias inboxes
4. **Webhook**: Usa Supabase Service Role para evitar RLS

### Uso Atualizado do Composable

```vue
<script setup>
const { connectInbox, disconnectInbox, checkInboxStatus } = useInboxes()

// Conectar caixa
const handleConnect = async (inboxId: string) => {
  try {
    const inbox = await connectInbox(
      inboxId,
      'Minha Caixa',
      '5511999999999'  // Opcional
    )
    
    // QR Code disponível em: inbox.qr_code
    // Exibir para o usuário escanear
  } catch (error) {
    console.error('Erro:', error)
  }
}

// Verificar status
const checkStatus = async (inboxId: string) => {
  const inbox = await checkInboxStatus(inboxId)
  // inbox.status: 'connected' | 'disconnected' | 'connecting'
}

// Desconectar
const handleDisconnect = async (inboxId: string) => {
  await disconnectInbox(inboxId)
}
</script>
```

### Próximos Passos

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

✅ **IMPLEMENTADO COM SUCESSO**

**Última Atualização**: 09/10/2025 - Integração com Evolution API v2

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
