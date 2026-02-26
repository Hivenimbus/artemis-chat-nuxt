import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    integer,
    timestamp,
    jsonb,
    date,
} from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'

// ─── Empresas ─────────────────────────────────────────────────────────────────
export const empresas = pgTable('empresas', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar('nome', { length: 255 }).notNull(),
    vencimento: date('vencimento').notNull(),
    max_usuarios: integer('max_usuarios').default(5).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: text('password'),
    name: varchar('name', { length: 255 }),
    role: varchar('role', { length: 50 }).default('user').notNull(), // 'user' | 'admin' | 'superadmin'
    status: varchar('status', { length: 50 }).default('active').notNull(), // 'active' | 'pending' | 'invited'
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'set null' }),
    avatar_url: text('avatar_url'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Equipes ──────────────────────────────────────────────────────────────────
export const equipes = pgTable('equipes', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar('nome', { length: 255 }).notNull(),
    descricao: text('descricao'),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Equipes Agentes ────────────────────────────────────────────────────────
export const equipesAgentes = pgTable('equipes_agentes', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    equipe_id: uuid('equipe_id').notNull().references(() => equipes.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Inboxes ──────────────────────────────────────────────────────────────────
export const inboxes = pgTable('inboxes', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).default('disconnected').notNull(), // 'disconnected' | 'connected' | 'connecting'
    phone_number: varchar('phone_number', { length: 50 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Inbox Agents ─────────────────────────────────────────────────────────────
export const inboxAgents = pgTable('inbox_agents', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    inbox_id: uuid('inbox_id').notNull().references(() => inboxes.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Inbox Teams ──────────────────────────────────────────────────────────────
export const inboxTeams = pgTable('inbox_teams', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    inbox_id: uuid('inbox_id').notNull().references(() => inboxes.id, { onDelete: 'cascade' }),
    equipe_id: uuid('equipe_id').notNull().references(() => equipes.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Etiquetas (Labels) ───────────────────────────────────────────────────────
export const etiquetas = pgTable('etiquetas', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar('nome', { length: 255 }).notNull(),
    cor: varchar('cor', { length: 50 }),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Contatos ─────────────────────────────────────────────────────────────────
export const contatos = pgTable('contatos', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar('nome', { length: 255 }),
    telefone: varchar('telefone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    avatar_url: text('avatar_url'),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    etiqueta_id: uuid('etiqueta_id').references(() => etiquetas.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Atendimentos ─────────────────────────────────────────────────────────────
export const atendimentos = pgTable('atendimentos', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    contato_id: uuid('contato_id').references(() => contatos.id, { onDelete: 'set null' }),
    inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'set null' }),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    assignee_id: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    equipe_id: uuid('equipe_id').references(() => equipes.id, { onDelete: 'set null' }),
    etiqueta_id: uuid('etiqueta_id').references(() => etiquetas.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).default('open').notNull(), // 'open' | 'closed' | 'pending'
    unread_count: integer('unread_count').default(0).notNull(),
    last_message_at: timestamp('last_message_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Mensagens ────────────────────────────────────────────────────────────────
export const mensagens = pgTable('mensagens', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    atendimento_id: uuid('atendimento_id').notNull().references(() => atendimentos.id, { onDelete: 'cascade' }),
    contato_id: uuid('contato_id').references(() => contatos.id, { onDelete: 'set null' }),
    sender_id: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
    external_id: text('external_id'),
    content: text('content'),
    type: varchar('type', { length: 50 }).default('text'), // 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'template'
    direction: varchar('direction', { length: 10 }).default('inbound'), // 'inbound' | 'outbound'
    status: varchar('status', { length: 50 }).default('sent'), // 'sent' | 'delivered' | 'read' | 'failed'
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Midias (Media Files) ─────────────────────────────────────────────────────
export const midias = pgTable('midias', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    mensagem_id: uuid('mensagem_id').references(() => mensagens.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    path: text('path'),
    type: varchar('type', { length: 50 }), // 'image' | 'audio' | 'video' | 'document'
    filename: text('filename'),
    size: integer('size'),
    mime_type: varchar('mime_type', { length: 100 }),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Message Templates ────────────────────────────────────────────────────────
export const messageTemplates = pgTable('message_templates', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    content: text('content').notNull(),
    type: varchar('type', { length: 50 }).default('text'),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).default('system'), // 'reminder' | 'campaign' | 'system'
    link: text('link'),
    metadata: jsonb('metadata').default({}),
    read: boolean('read').default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Campanhas ────────────────────────────────────────────────────────────────
export const campanhas = pgTable('campanhas', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar('nome', { length: 255 }),
    descricao: text('descricao'),
    status: varchar('status', { length: 50 }).default('draft').notNull(), // 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled'
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'set null' }),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    template_id: uuid('template_id').references(() => messageTemplates.id, { onDelete: 'set null' }),
    message: text('message'),
    media_url: text('media_url'),
    scheduled_at: timestamp('scheduled_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    total_contacts: integer('total_contacts').default(0),
    sent_count: integer('sent_count').default(0),
    failed_count: integer('failed_count').default(0),
    settings: jsonb('settings').default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Agendamentos ─────────────────────────────────────────────────────────────
export const agendamentos = pgTable('agendamentos', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    campanha_id: uuid('campanha_id').references(() => campanhas.id, { onDelete: 'set null' }),
    contato_id: uuid('contato_id').references(() => contatos.id, { onDelete: 'set null' }),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    inbox_id: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    message_text: text('message_text'),
    type: varchar('type', { length: 50 }).default('message_schedule'), // 'message_schedule' | 'reminder'
    status: varchar('status', { length: 50 }).default('scheduled').notNull(),
    start_time: timestamp('start_time', { withTimezone: true }),
    end_time: timestamp('end_time', { withTimezone: true }),
    scheduled_at: timestamp('scheduled_at', { withTimezone: true }),
    sent_at: timestamp('sent_at', { withTimezone: true }),
    error_message: text('error_message'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Kanbans ──────────────────────────────────────────────────────────────────
export const kanbans = pgTable('kanbans', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar('nome', { length: 255 }).notNull(),
    empresa_id: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const kanbanColunas = pgTable('kanban_colunas', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    kanban_id: uuid('kanban_id').notNull().references(() => kanbans.id, { onDelete: 'cascade' }),
    nome: varchar('nome', { length: 255 }).notNull(),
    ordem: integer('ordem').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const kanbanCards = pgTable('kanban_cards', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    coluna_id: uuid('coluna_id').notNull().references(() => kanbanColunas.id, { onDelete: 'cascade' }),
    atendimento_id: uuid('atendimento_id').references(() => atendimentos.id, { onDelete: 'set null' }),
    titulo: varchar('titulo', { length: 255 }),
    ordem: integer('ordem').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const empresasRelations = relations(empresas, ({ many }) => ({
    users: many(users),
    equipes: many(equipes),
    inboxes: many(inboxes),
    etiquetas: many(etiquetas),
    contatos: many(contatos),
    notifications: many(notifications),
    campanhas: many(campanhas),
    messageTemplates: many(messageTemplates),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
    empresa: one(empresas, { fields: [users.empresa_id], references: [empresas.id] }),
    equipesAgentes: many(equipesAgentes),
    inboxAgents: many(inboxAgents),
    notifications: many(notifications),
}))

export const equipesRelations = relations(equipes, ({ one, many }) => ({
    empresas: one(empresas, { fields: [equipes.empresa_id], references: [empresas.id] }),
    equipes_agentes: many(equipesAgentes),
    inbox_teams: many(inboxTeams),
}))

export const equipesAgentesRelations = relations(equipesAgentes, ({ one }) => ({
    equipe: one(equipes, { fields: [equipesAgentes.equipe_id], references: [equipes.id] }),
    user: one(users, { fields: [equipesAgentes.user_id], references: [users.id] }),
}))

export const inboxesRelations = relations(inboxes, ({ one, many }) => ({
    empresa: one(empresas, { fields: [inboxes.empresa_id], references: [empresas.id] }),
    inbox_agents: many(inboxAgents),
    inbox_teams: many(inboxTeams),
    atendimentos: many(atendimentos),
}))

export const inboxAgentsRelations = relations(inboxAgents, ({ one }) => ({
    inbox: one(inboxes, { fields: [inboxAgents.inbox_id], references: [inboxes.id] }),
    user: one(users, { fields: [inboxAgents.user_id], references: [users.id] }),
}))

export const inboxTeamsRelations = relations(inboxTeams, ({ one }) => ({
    inbox: one(inboxes, { fields: [inboxTeams.inbox_id], references: [inboxes.id] }),
    equipe: one(equipes, { fields: [inboxTeams.equipe_id], references: [equipes.id] }),
}))

export const etiquetasRelations = relations(etiquetas, ({ one }) => ({
    empresa: one(empresas, { fields: [etiquetas.empresa_id], references: [empresas.id] }),
}))

export const contatosRelations = relations(contatos, ({ one, many }) => ({
    empresa: one(empresas, { fields: [contatos.empresa_id], references: [empresas.id] }),
    etiqueta: one(etiquetas, { fields: [contatos.etiqueta_id], references: [etiquetas.id] }),
    atendimentos: many(atendimentos),
    mensagens: many(mensagens),
}))

export const atendimentosRelations = relations(atendimentos, ({ one, many }) => ({
    contato: one(contatos, { fields: [atendimentos.contato_id], references: [contatos.id] }),
    inbox: one(inboxes, { fields: [atendimentos.inbox_id], references: [inboxes.id] }),
    empresa: one(empresas, { fields: [atendimentos.empresa_id], references: [empresas.id] }),
    assignee: one(users, { fields: [atendimentos.assignee_id], references: [users.id] }),
    equipe: one(equipes, { fields: [atendimentos.equipe_id], references: [equipes.id] }),
    mensagens: many(mensagens),
}))

export const mensagensRelations = relations(mensagens, ({ one }) => ({
    atendimento: one(atendimentos, { fields: [mensagens.atendimento_id], references: [atendimentos.id] }),
    sender: one(users, { fields: [mensagens.sender_id], references: [users.id] }),
    contato: one(contatos, { fields: [mensagens.contato_id], references: [contatos.id] }),
}))

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
    empresa: one(empresas, { fields: [messageTemplates.empresa_id], references: [empresas.id] }),
    createdBy: one(users, { fields: [messageTemplates.created_by], references: [users.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.user_id], references: [users.id] }),
    empresa: one(empresas, { fields: [notifications.empresa_id], references: [empresas.id] }),
}))

export const campanhasRelations = relations(campanhas, ({ one }) => ({
    empresa: one(empresas, { fields: [campanhas.empresa_id], references: [empresas.id] }),
    inbox: one(inboxes, { fields: [campanhas.inbox_id], references: [inboxes.id] }),
    createdBy: one(users, { fields: [campanhas.created_by], references: [users.id] }),
}))

export const agendamentosRelations = relations(agendamentos, ({ one }) => ({
    campanha: one(campanhas, { fields: [agendamentos.campanha_id], references: [campanhas.id] }),
    contato: one(contatos, { fields: [agendamentos.contato_id], references: [contatos.id] }),
}))

export const kanbansRelations = relations(kanbans, ({ one, many }) => ({
    empresa: one(empresas, { fields: [kanbans.empresa_id], references: [empresas.id] }),
    colunas: many(kanbanColunas),
}))

export const kanbanColunasRelations = relations(kanbanColunas, ({ one, many }) => ({
    kanban: one(kanbans, { fields: [kanbanColunas.kanban_id], references: [kanbans.id] }),
    cards: many(kanbanCards),
}))

export const kanbanCardsRelations = relations(kanbanCards, ({ one }) => ({
    coluna: one(kanbanColunas, { fields: [kanbanCards.coluna_id], references: [kanbanColunas.id] }),
    atendimento: one(atendimentos, { fields: [kanbanCards.atendimento_id], references: [atendimentos.id] }),
}))
