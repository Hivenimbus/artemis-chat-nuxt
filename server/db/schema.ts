import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────
// empresas
// ─────────────────────────────────────────────
export const empresas = pgTable('empresas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  vencimento: text('vencimento'),
  max_usuarios: integer('max_usuarios').default(10),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// users
// ─────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull(),
  password: text('password'),
  role: text('role').default('user'), // superadmin | admin | agent | user
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'set null' }),
  status: text('status').default('pending'), // active | pending | inactive
  invited_by: uuid('invited_by'),
  invited_at: timestamp('invited_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  emailUnique: uniqueIndex('users_email_unique').on(t.email)
}))

// ─────────────────────────────────────────────
// contatos
// ─────────────────────────────────────────────
export const contatos = pgTable('contatos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome'),
  sobrenome: text('sobrenome'),
  email: text('email'),
  telefone: text('telefone'),
  cidade: text('cidade'),
  pais: text('pais'),
  biografia: text('biografia'),
  empresa: text('empresa'),
  endereco: text('endereco'),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  profile_picture_url: text('profile_picture_url'),
  ultimo_atendimento_id: uuid('ultimo_atendimento_id'),
  data_ultimo_contato: timestamp('data_ultimo_contato', { withTimezone: true }),
  total_mensagens: integer('total_mensagens').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  telefoneEmpresaIdx: uniqueIndex('contatos_telefone_empresa_id_unique').on(t.telefone, t.empresa_id)
}))

// ─────────────────────────────────────────────
// inboxes
// ─────────────────────────────────────────────
export const inboxes = pgTable('inboxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('disconnected'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// atendimentos
// ─────────────────────────────────────────────
export const atendimentos = pgTable('atendimentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  contato_id: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }),
  inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'cascade' }),
  usuario_responsavel_id: uuid('usuario_responsavel_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').default('aguardando'), // aguardando | ativo | resolvido | concluido
  ultimo_mensagem: text('ultimo_mensagem'),
  ultimo_mensagem_time: timestamp('ultimo_mensagem_time', { withTimezone: true }),
  unread_count: integer('unread_count').default(0),
  data_atribuicao: timestamp('data_atribuicao', { withTimezone: true }),
  data_conclusao: timestamp('data_conclusao', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  contatoInboxIdx: index('atendimentos_contato_inbox_idx').on(t.contato_id, t.inbox_id)
}))
// NOTE: The partial unique index (contato_id, inbox_id) WHERE status IN ('aguardando', 'ativo')
// must be managed via raw SQL migration (Drizzle does not support partial unique indexes natively).
// SQL: CREATE UNIQUE INDEX IF NOT EXISTS atendimentos_open_unique ON atendimentos(contato_id, inbox_id)
//      WHERE status IN ('aguardando', 'ativo');

// ─────────────────────────────────────────────
// mensagens
// ─────────────────────────────────────────────
export const mensagens = pgTable('mensagens', {
  id: uuid('id').primaryKey().defaultRandom(),
  atendimento_id: uuid('atendimento_id').references(() => atendimentos.id, { onDelete: 'cascade' }),
  usuario_id: uuid('usuario_id').references(() => users.id, { onDelete: 'set null' }),
  texto: text('texto'),
  remetente: text('remetente'), // contact | user
  lida: boolean('lida').default(false),
  timestamp: timestamp('timestamp', { withTimezone: true }),
  message_type: text('message_type').default('text'), // text | image | video | audio | document
  media_url: text('media_url'),
  media_type: text('media_type'),
  media_name: text('media_name'),
  evolution_message_id: text('evolution_message_id'),
  evolution_status: text('evolution_status'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// etiquetas
// ─────────────────────────────────────────────
export const etiquetas = pgTable('etiquetas', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  cor: text('cor'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// contato_etiquetas (M:N)
// ─────────────────────────────────────────────
export const contatoEtiquetas = pgTable('contato_etiquetas', {
  contato_id: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }).notNull(),
  etiqueta_id: uuid('etiqueta_id').references(() => etiquetas.id, { onDelete: 'cascade' }).notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.contato_id, t.etiqueta_id] })
}))

// ─────────────────────────────────────────────
// equipes
// ─────────────────────────────────────────────
export const equipes = pgTable('equipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// equipes_agentes (M:N)
// ─────────────────────────────────────────────
export const equipesAgentes = pgTable('equipes_agentes', {
  equipe_id: uuid('equipe_id').references(() => equipes.id, { onDelete: 'cascade' }).notNull(),
  agente_id: uuid('agente_id').references(() => users.id, { onDelete: 'cascade' }).notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.equipe_id, t.agente_id] })
}))

// ─────────────────────────────────────────────
// inbox_agents (M:N)
// ─────────────────────────────────────────────
export const inboxAgents = pgTable('inbox_agents', {
  inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.inbox_id, t.user_id] })
}))

// ─────────────────────────────────────────────
// inbox_teams (M:N)
// ─────────────────────────────────────────────
export const inboxTeams = pgTable('inbox_teams', {
  inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'cascade' }).notNull(),
  equipe_id: uuid('equipe_id').references(() => equipes.id, { onDelete: 'cascade' }).notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.inbox_id, t.equipe_id] })
}))

// ─────────────────────────────────────────────
// agendamentos
// ─────────────────────────────────────────────
export const agendamentos = pgTable('agendamentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title'),
  description: text('description'),
  start_time: timestamp('start_time', { withTimezone: true }),
  end_time: timestamp('end_time', { withTimezone: true }),
  type: text('type'), // message_schedule | reminder | event | etc.
  status: text('status').default('scheduled'), // scheduled | completed | failed | cancelled
  message_text: text('message_text'),
  inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'set null' }),
  color: text('color'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// agendamento_contatos (M:N)
// ─────────────────────────────────────────────
export const agendamentoContatos = pgTable('agendamento_contatos', {
  agendamento_id: uuid('agendamento_id').references(() => agendamentos.id, { onDelete: 'cascade' }).notNull(),
  contato_id: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }).notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.agendamento_id, t.contato_id] })
}))

// ─────────────────────────────────────────────
// campanhas
// ─────────────────────────────────────────────
export const campanhas = pgTable('campanhas', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'set null' }),
  message_text: text('message_text'),
  attachment_url: text('attachment_url'),
  attachment_type: text('attachment_type'),
  attachments: jsonb('attachments').default([]),
  recipient_type: text('recipient_type').default('all'), // all | tags
  target_tags: jsonb('target_tags').default([]),
  scheduled_at: timestamp('scheduled_at', { withTimezone: true }),
  status: text('status').default('draft'), // draft | scheduled | processing | sending | completed | failed
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// campaign_attachments
// ─────────────────────────────────────────────
export const campaignAttachments = pgTable('campaign_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  file_url: text('file_url'),
  file_type: text('file_type'),
  file_name: text('file_name'),
  caption: text('caption'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// notifications
// ─────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  title: text('title'),
  message: text('message'),
  type: text('type'), // reminder | campaign | system
  link: text('link'),
  metadata: jsonb('metadata').default({}),
  read: boolean('read').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// message_templates
// ─────────────────────────────────────────────
export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// kanbans
// ─────────────────────────────────────────────
export const kanbans = pgTable('kanbans', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// kanban_columns
// ─────────────────────────────────────────────
export const kanbanColumns = pgTable('kanban_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  kanban_id: uuid('kanban_id').references(() => kanbans.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  icon: text('icon'),
  color: text('color'),
  position: integer('position').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ─────────────────────────────────────────────
// kanban_cards
// ─────────────────────────────────────────────
export const kanbanCards = pgTable('kanban_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  kanban_id: uuid('kanban_id').references(() => kanbans.id, { onDelete: 'cascade' }),
  column_id: uuid('column_id').references(() => kanbanColumns.id, { onDelete: 'cascade' }),
  title: text('title'),
  description: text('description'),
  is_urgent: boolean('is_urgent').default(false),
  position: integer('position').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
})
