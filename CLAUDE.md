# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# communication language
Portuguese BR


## Project Overview

This is a Nuxt 3 application that provides a multi-tenant customer service platform (similar to Chatwoot/Zendesk) integrated with WhatsApp via Evolution API. The application manages customer conversations (atendimentos), contacts (contatos), inboxes (caixas de entrada), and teams across multiple companies (empresas).

## Key Technologies

- **Nuxt 4.1.2** - Vue 3 framework with file-based routing
- **Supabase** - Backend (PostgreSQL database, authentication, storage, real-time)
- **TailwindCSS** - Styling with @tailwindcss/forms and @tailwindcss/typography
- **Evolution API** - WhatsApp integration for sending/receiving messages
- **VueUse** - Composable utilities

## Development Commands


```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Prepare Nuxt (runs automatically after install)
npm run postinstall
```

## Architecture

### Database Structure

The application uses Supabase PostgreSQL with the following core tables:

- **empresas** - Multi-tenant companies
- **users** - Users with role-based access (superadmin, admin, agent)
- **contatos** - Contacts with phone numbers and metadata
- **inboxes** - WhatsApp instances/channels (one per Evolution API instance)
- **atendimentos** - Customer service sessions linking contacts and inboxes
- **mensagens** - Messages within atendimentos (text, images, videos, documents, audio)
- **etiquetas** - Tags/labels for organizing contacts
- **contato_etiquetas** - Many-to-many relationship between contacts and tags

### Key Relationships

- Atendimentos belong to a contato and inbox
- Mensagens belong to an atendimento
- Users and inboxes belong to an empresa
- Contatos can have multiple etiquetas via contato_etiquetas

### Authentication & Authorization

- Uses Supabase Auth with PKCE flow
- Session persists for 8 hours (configurable in nuxt.config.ts)
- Middleware:
  - `auth.ts` - Ensures user is authenticated
  - `admin.ts` - Requires admin or superadmin role
  - `superadmin.ts` - Requires superadmin role
- Layouts:
  - `auth.vue` - For login page
  - `default.vue` - For authenticated pages with Sidebar and AppHeader

### WhatsApp Integration (Evolution API)

The application integrates with Evolution API for WhatsApp messaging:

- **Webhook endpoint**: `server/api/webhook/whatsapp.post.ts` receives messages from Evolution API
- **Message processing**: `server/lib/evolution.ts` contains core logic for:
  - Finding/creating contacts from phone numbers
  - Finding/creating atendimentos (service sessions)
  - Storing messages with media support (images, videos, audio, documents)
  - Uploading media to Supabase Storage (`midias` bucket)
- **Instance management**: Each inbox has an Evolution API instance ID
- **Environment variables**:
  - `EVOLUTION_API_URL` - Evolution API server URL
  - `EVOLUTION_API_KEY` - API key for Evolution API
  - `SUPABASE_SERVICE_ROLE_KEY` - Required for webhook processing (bypasses RLS)

### Server API Routes

Server routes follow Nuxt conventions in `server/api/`:

- `atendimentos.get.ts` - List atendimentos with filters (inbox, status, responsavel)
- `atendimentos.post.ts` - Create new atendimento
- `atendimentos/[id]/mensagens.get.ts` - Get messages for atendimento
- `atendimentos/[id]/mensagens.post.ts` - Send message via Evolution API
- `atendimentos/[id]/assign.patch.ts` - Assign atendimento to user
- `atendimentos/[id]/resolve.patch.ts` - Mark atendimento as resolved
- `contatos.{get,post}.ts` - CRUD operations for contacts
- `etiquetas.{get,post}.ts` - CRUD operations for tags
- `inboxes.{get,post}.ts` - Manage WhatsApp inboxes
- `inboxes/[id]/qrcode.get.ts` - Get QR code for WhatsApp connection
- `inboxes/[id]/connection-status.get.ts` - Check WhatsApp connection status
- `empresas.{get,post}.ts` - Manage companies (superadmin only)
- `user.get.ts` - Get current user data

All API routes use `serverSupabaseClient(event)` to access the database with user context.

### Composables

- `useInboxes.ts` - Manages inbox state and operations
- `useEmpresas.ts` - Manages company state (superadmin)
- `useUser.ts` - User profile and authentication helpers

### Pages & Routing

- `/` (index.vue) - Login page
- `/atendimentos` - Main customer service interface with chat
- `/contatos` - Contact management
- `/contato/[id]` - Individual contact details
- `/agendamentos` - Appointments/scheduling
- `/kanbans` - Kanban board view
- `/kanbans/[id]` - Individual kanban board
- `/configuracoes/agentes` - User/agent management
- `/configuracoes/equipes` - Team management
- `/configuracoes/etiquetas` - Tag management
- `/configuracoes/caixas-de-entrada` - Inbox configuration
- `/painel-superadmin` - Superadmin dashboard

### Components

Key components for understanding the UI:

- **ContactList.vue** - Sidebar showing atendimentos with filters
- **ChatArea.vue** - Main chat interface for messaging
- **MediaPreview.vue** - Preview and display images/videos/documents
- **Sidebar.vue** - Navigation sidebar
- **AppHeader.vue** - Top navigation bar
- **TagEditor.vue** - Manage contact tags
- **EmpresaCard/ListItem/CreateModal/EditModal** - Company management
- **KanbanCard/Column** - Kanban board components

### Media Handling

Media files (images, videos, documents, audio) are:
1. Received from Evolution API webhook as base64
2. Uploaded to Supabase Storage bucket `midias` in `{empresa_id}/{filename}` structure
3. Public URLs stored in `mensagens.media_url`
4. Types: image, video, audio, document
5. Previewed in ChatArea via MediaPreview component

### Logging

Custom logging system in `server/lib/logger.ts`:
- `webhookLogger` - Webhook processing events
- `contatoLogger` - Contact operations
- `atendimentoLogger` - Atendimento operations
- `messageLogger` - Message processing
- Structured JSON logs with levels: debug, info, warn, error

## Important Implementation Notes

### When Working with Messages

- Message types: 'text', 'image', 'video', 'audio', 'document'
- Messages have `remetente` field: 'contact' or 'user'
- Unread count is tracked at the atendimento level
- Always update `atendimentos.ultimo_mensagem` and `ultimo_mensagem_time` when creating messages
- Media requires base64 data and proper MIME type handling

### When Working with Atendimentos

- Status values: 'aguardando', 'ativo', 'resolvido'
- Only one open atendimento per contact+inbox combination
- Always filter by empresa_id for multi-tenancy
- Real-time updates should use Supabase real-time subscriptions

### When Working with Supabase

- Server routes use `serverSupabaseClient(event)` for RLS context
- Webhooks use `createServiceSupabaseClient()` with service role key (bypasses RLS)
- Always check user's empresa_id for data isolation
- Storage bucket `midias` is public for media access

### Environment Variables

Required variables (see `.env`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `EVOLUTION_API_URL` - Evolution API endpoint
- `EVOLUTION_API_KEY` - Evolution API authentication
- `SITE_URL` - Application URL (for callbacks)

## Common Development Patterns

### Adding a New API Route

1. Create file in `server/api/` following Nuxt conventions
2. Use `defineEventHandler(async (event) => { ... })`
3. Get authenticated user: `const client = await serverSupabaseClient(event)`
4. Validate user and empresa_id
5. Return structured responses with error handling

### Adding a New Page

1. Create `.vue` file in `pages/` directory
2. Use `definePageMeta({ middleware: ['auth'] })` for protected routes
3. Layout is automatically applied (default.vue for authenticated pages)
4. Use composables for data fetching

### Working with Real-time

Supabase real-time subscriptions for live updates:
```javascript
const channel = supabase
  .channel('atendimentos')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens' }, callback)
  .subscribe()
```

### Media Upload Pattern

1. Receive base64 from Evolution API webhook
2. Extract MIME type and generate unique filename
3. Upload to Supabase Storage: `supabase.storage.from('midias').upload(path, buffer)`
4. Get public URL: `supabase.storage.from('midias').getPublicUrl(path)`
5. Store URL in `mensagens.media_url`
