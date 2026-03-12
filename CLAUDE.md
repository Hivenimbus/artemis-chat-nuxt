# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# communication language
Portuguese BR


## Project Overview

This is a Nuxt 3 application that provides a multi-tenant customer service platform (similar to Chatwoot/Zendesk) integrated with WhatsApp via Evolution API. The application manages customer conversations (atendimentos), contacts (contatos), inboxes (caixas de entrada), and teams across multiple companies (empresas).

## Key Technologies

- **Nuxt 4.1.2** - Vue 3 framework with file-based routing
- **PostgreSQL** - Database (via Drizzle ORM + `postgres` driver)
- **Drizzle ORM** - Type-safe query builder, schema in `server/db/schema.ts`
- **Minio / S3-compatible** - Object storage for media files
- **JWT + bcrypt** - Custom authentication (tokens stored in cookies)
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

The application uses PostgreSQL with Drizzle ORM. Schema is defined in `server/db/schema.ts`. Core tables:

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

- Custom JWT-based auth with bcrypt password hashing
- Tokens stored in HTTP-only cookies, validated on each request via `server/utils/auth.ts`
- Session persists for 8 hours
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
  - Uploading media to Minio storage
- **Instance management**: Each inbox has an Evolution API instance ID
- **Environment variables**:
  - `EVOLUTION_API_URL` - Evolution API server URL
  - `EVOLUTION_API_KEY` - API key for Evolution API

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

All API routes use `db` from `~/server/database` (Drizzle ORM) and validate the user via JWT.

### Composables

- `useInboxes.ts` - Manages inbox state and operations
- `useEmpresas.ts` - Manages company state (superadmin)
- `useUser.ts` - User profile and authentication helpers
- `useAuth.ts` - Login/logout, JWT token management

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
2. Uploaded to Minio (S3-compatible) bucket in `{empresa_id}/{filename}` structure via `server/lib/storage.ts`
3. Public URLs stored in `mensagens.metadata`
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
- Real-time updates are done via polling or page refresh (no WebSocket subscription)

### When Working with the Database

- All server routes import `db` and `schema` from `~/server/database`
- Always check user's empresa_id for data isolation
- Drizzle ORM provides type-safe queries via `db.query.*`, `db.select()`, `db.insert()`, `db.update()`
- Schema definitions live in `server/db/schema.ts`

### Environment Variables

Required variables (see `.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `EVOLUTION_API_URL` - Evolution API endpoint
- `EVOLUTION_API_KEY` - Evolution API authentication
- `MINIO_ENDPOINT` - Minio/S3 endpoint URL
- `MINIO_ACCESS_KEY` - Minio access key
- `MINIO_SECRET_KEY` - Minio secret key
- `MINIO_BUCKET_NAME` - Minio bucket name
- `SITE_URL` - Application URL (for callbacks)

## Common Development Patterns

### Adding a New API Route

1. Create file in `server/api/` following Nuxt conventions
2. Use `defineEventHandler(async (event) => { ... })`
3. Validate user via auth utils, get empresa_id from token
4. Use `db` from `~/server/database` for queries
5. Return structured responses with error handling

### Adding a New Page

1. Create `.vue` file in `pages/` directory
2. Use `definePageMeta({ middleware: ['auth'] })` for protected routes
3. Layout is automatically applied (default.vue for authenticated pages)
4. Use composables for data fetching

### Media Upload Pattern

1. Receive base64 from Evolution API webhook
2. Extract MIME type and generate unique filename
3. Upload to Minio via `uploadMediaToMinio()` in `server/lib/evolution.ts`
4. Store the public URL in the message record
