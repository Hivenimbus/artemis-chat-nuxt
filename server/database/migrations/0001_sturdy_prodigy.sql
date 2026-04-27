CREATE TABLE "agendamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid,
	"campanha_id" uuid,
	"contato_id" uuid,
	"user_id" uuid,
	"inbox_id" uuid,
	"title" varchar(255),
	"description" text,
	"message_text" text,
	"type" varchar(50) DEFAULT 'message_schedule',
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "atendimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contato_id" uuid,
	"inbox_id" uuid,
	"empresa_id" uuid,
	"assignee_id" uuid,
	"equipe_id" uuid,
	"etiqueta_id" uuid,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campanhas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255),
	"descricao" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"empresa_id" uuid,
	"inbox_id" uuid,
	"created_by" uuid,
	"template_id" uuid,
	"message" text,
	"media_url" text,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"total_contacts" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contatos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255),
	"telefone" varchar(50),
	"email" varchar(255),
	"avatar_url" text,
	"empresa_id" uuid,
	"etiqueta_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"vencimento" date NOT NULL,
	"max_usuarios" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"empresa_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipes_agentes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "etiquetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cor" varchar(50),
	"empresa_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inbox_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inbox_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inbox_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inbox_id" uuid NOT NULL,
	"equipe_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inboxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"empresa_id" uuid,
	"status" varchar(50) DEFAULT 'disconnected' NOT NULL,
	"phone_number" varchar(50),
	"hive_instance_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanban_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coluna_id" uuid NOT NULL,
	"atendimento_id" uuid,
	"titulo" varchar(255),
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanban_colunas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kanban_id" uuid NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cor" varchar(50) DEFAULT 'blue',
	"icone" varchar(50) DEFAULT 'clipboard',
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanbans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"empresa_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mensagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"atendimento_id" uuid NOT NULL,
	"contato_id" uuid,
	"sender_id" uuid,
	"external_id" text,
	"content" text,
	"type" varchar(50) DEFAULT 'text',
	"direction" varchar(10) DEFAULT 'inbound',
	"status" varchar(50) DEFAULT 'sent',
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'text',
	"empresa_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "midias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mensagem_id" uuid,
	"url" text NOT NULL,
	"path" text,
	"type" varchar(50),
	"filename" text,
	"size" integer,
	"mime_type" varchar(100),
	"empresa_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"empresa_id" uuid,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'system',
	"link" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text,
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"empresa_id" uuid,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_inbox_id_inboxes_id_fk" FOREIGN KEY ("inbox_id") REFERENCES "public"."inboxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_inbox_id_inboxes_id_fk" FOREIGN KEY ("inbox_id") REFERENCES "public"."inboxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_etiqueta_id_etiquetas_id_fk" FOREIGN KEY ("etiqueta_id") REFERENCES "public"."etiquetas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_inbox_id_inboxes_id_fk" FOREIGN KEY ("inbox_id") REFERENCES "public"."inboxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contatos" ADD CONSTRAINT "contatos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contatos" ADD CONSTRAINT "contatos_etiqueta_id_etiquetas_id_fk" FOREIGN KEY ("etiqueta_id") REFERENCES "public"."etiquetas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipes_agentes" ADD CONSTRAINT "equipes_agentes_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipes_agentes" ADD CONSTRAINT "equipes_agentes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_agents" ADD CONSTRAINT "inbox_agents_inbox_id_inboxes_id_fk" FOREIGN KEY ("inbox_id") REFERENCES "public"."inboxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_agents" ADD CONSTRAINT "inbox_agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_teams" ADD CONSTRAINT "inbox_teams_inbox_id_inboxes_id_fk" FOREIGN KEY ("inbox_id") REFERENCES "public"."inboxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_teams" ADD CONSTRAINT "inbox_teams_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inboxes" ADD CONSTRAINT "inboxes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_coluna_id_kanban_colunas_id_fk" FOREIGN KEY ("coluna_id") REFERENCES "public"."kanban_colunas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_atendimento_id_atendimentos_id_fk" FOREIGN KEY ("atendimento_id") REFERENCES "public"."atendimentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_colunas" ADD CONSTRAINT "kanban_colunas_kanban_id_kanbans_id_fk" FOREIGN KEY ("kanban_id") REFERENCES "public"."kanbans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanbans" ADD CONSTRAINT "kanbans_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_atendimento_id_atendimentos_id_fk" FOREIGN KEY ("atendimento_id") REFERENCES "public"."atendimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midias" ADD CONSTRAINT "midias_mensagem_id_mensagens_id_fk" FOREIGN KEY ("mensagem_id") REFERENCES "public"."mensagens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midias" ADD CONSTRAINT "midias_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midias" ADD CONSTRAINT "midias_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE set null ON UPDATE no action;