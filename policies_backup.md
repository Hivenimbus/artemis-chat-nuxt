# Database Policies Backup

## Table: public.atendimentos

### Policy: Usuários só podem ver atendimentos da própria empresa
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(inbox_id IN ( SELECT inboxes.id
   FROM inboxes
  WHERE (inboxes.empresa_id = ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`
- **With Check**: `N/A`

## Table: public.contato_etiquetas

### Policy: Users can manage contact tags from their company
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(contato_id IN ( SELECT contatos.id
   FROM contatos
  WHERE (contatos.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`
- **With Check**: `N/A`

## Table: public.contatos

### Policy: Users can delete contacts from their company
- **Command**: DELETE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

### Policy: Users can insert contacts for their company
- **Command**: INSERT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `N/A`
- **With Check**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`

### Policy: Users can update contacts from their company
- **Command**: UPDATE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

### Policy: Users can view contacts from their company
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

## Table: public.empresas

### Policy: Allow insert/update based on user metadata
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.empresa_id = empresas.id) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))`
- **With Check**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.empresa_id = empresas.id) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))`

### Policy: Users can view their empresa
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.empresa_id = empresas.id)))))`
- **With Check**: `N/A`

## Table: public.equipes

### Policy: Admins podem gerenciar equipes
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (empresa_id = ( SELECT users.empresa_id
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))`
- **With Check**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (empresa_id = ( SELECT users.empresa_id
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))`

### Policy: Usuários podem ver equipes
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (empresa_id = ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid()))))`
- **With Check**: `N/A`

## Table: public.equipes_agentes

### Policy: Admins podem gerenciar relacionamentos de equipes
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (equipe_id IN ( SELECT equipes.id
   FROM equipes
  WHERE (equipes.empresa_id = ( SELECT users.empresa_id
           FROM users
          WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))))`
- **With Check**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (equipe_id IN ( SELECT equipes.id
   FROM equipes
  WHERE (equipes.empresa_id = ( SELECT users.empresa_id
           FROM users
          WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))))`

### Policy: Usuários podem ver relacionamentos de equipes
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((get_user_role(auth.uid()) = 'superadmin'::text) OR (agente_id = auth.uid()) OR (equipe_id IN ( SELECT equipes.id
   FROM equipes
  WHERE (equipes.empresa_id = ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid()))))))`
- **With Check**: `N/A`

## Table: public.etiquetas

### Policy: Usuarios podem atualizar etiquetas da propria empresa
- **Command**: UPDATE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

### Policy: Usuarios podem excluir etiquetas da propria empresa
- **Command**: DELETE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

### Policy: Usuarios podem inserir etiquetas da propria empresa
- **Command**: INSERT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `N/A`
- **With Check**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`

### Policy: Usuarios podem ver etiquetas da propria empresa
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

## Table: public.inboxes

### Policy: Superadmin full access inboxes
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(get_user_role(auth.uid()) = 'superadmin'::text)`
- **With Check**: `(get_user_role(auth.uid()) = 'superadmin'::text)`

### Policy: Users can update company inboxes
- **Command**: UPDATE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id = ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

### Policy: Users can view company inboxes
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id = ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

## Table: public.kanban_cards

### Policy: Dono ou admin pode deletar cartoes
- **Command**: DELETE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE ((kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid()))) AND ((kanbans.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text])))))))))`
- **With Check**: `N/A`

### Policy: Usuarios podem atualizar cartoes de kanbans da empresa
- **Command**: UPDATE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE (kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`
- **With Check**: `N/A`

### Policy: Usuarios podem criar cartoes para kanbans da empresa
- **Command**: INSERT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `N/A`
- **With Check**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE (kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`

### Policy: Usuarios podem ver cartoes de kanbans da empresa
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE (kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`
- **With Check**: `N/A`

## Table: public.kanban_columns

### Policy: Dono ou admin pode deletar colunas
- **Command**: DELETE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE ((kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid()))) AND ((kanbans.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text])))))))))`
- **With Check**: `N/A`

### Policy: Usuarios podem atualizar colunas de kanbans da empresa
- **Command**: UPDATE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE (kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`
- **With Check**: `N/A`

### Policy: Usuarios podem criar colunas para kanbans da empresa
- **Command**: INSERT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `N/A`
- **With Check**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE (kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`

### Policy: Usuarios podem ver colunas de kanbans da empresa
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(kanban_id IN ( SELECT kanbans.id
   FROM kanbans
  WHERE (kanbans.empresa_id IN ( SELECT users.empresa_id
           FROM users
          WHERE (users.id = auth.uid())))))`
- **With Check**: `N/A`

## Table: public.kanbans

### Policy: Dono ou admin pode atualizar kanbans
- **Command**: UPDATE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid()))) AND ((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))`
- **With Check**: `N/A`

### Policy: Dono ou admin pode deletar kanbans
- **Command**: DELETE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid()))) AND ((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))`
- **With Check**: `N/A`

### Policy: Usuarios podem criar kanbans da empresa
- **Command**: INSERT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `N/A`
- **With Check**: `((empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid()))) AND (created_by = auth.uid()))`

### Policy: Usuarios podem ver kanbans da empresa
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(empresa_id IN ( SELECT users.empresa_id
   FROM users
  WHERE (users.id = auth.uid())))`
- **With Check**: `N/A`

## Table: public.mensagens

### Policy: Usuários só podem ver mensagens de atendimentos da própria e
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(atendimento_id IN ( SELECT atendimentos.id
   FROM atendimentos
  WHERE (atendimentos.inbox_id IN ( SELECT inboxes.id
           FROM inboxes
          WHERE (inboxes.empresa_id = ( SELECT users.empresa_id
                   FROM users
                  WHERE (users.id = auth.uid())))))))`
- **With Check**: `N/A`

## Table: public.users

### Policy: Admins full access users
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(get_user_role_safe(auth.uid()) = 'admin'::text)`
- **With Check**: `(get_user_role_safe(auth.uid()) = 'admin'::text)`

### Policy: Superadmins full access users
- **Command**: ALL
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(get_user_role_safe(auth.uid()) = 'superadmin'::text)`
- **With Check**: `(get_user_role_safe(auth.uid()) = 'superadmin'::text)`

### Policy: Users can insert own data
- **Command**: INSERT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `N/A`
- **With Check**: `((get_user_role(auth.uid()) = 'user'::text) AND (id IS NOT NULL) AND ((id)::text ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'::text) AND (auth.uid() = id))`

### Policy: Users can read own data
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((auth.uid() IS NOT NULL) AND ((auth.uid())::text ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'::text) AND (id IS NOT NULL) AND ((id)::text ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'::text) AND (auth.uid() = id) AND (get_user_role(auth.uid()) = 'user'::text))`
- **With Check**: `N/A`

### Policy: Users can update own data
- **Command**: UPDATE
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `((auth.uid() IS NOT NULL) AND ((auth.uid())::text ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'::text) AND (id IS NOT NULL) AND ((id)::text ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'::text) AND (auth.uid() = id) AND (get_user_role(auth.uid()) = 'user'::text))`
- **With Check**: `((auth.uid() IS NOT NULL) AND ((auth.uid())::text ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'::text) AND (id IS NOT NULL) AND ((id)::text ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'::text) AND (auth.uid() = id) AND (get_user_role(auth.uid()) = 'user'::text))`

## Table: storage.objects

### Policy: Qualquer um pode ler midias
- **Command**: SELECT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `(bucket_id = 'midias'::text)`
- **With Check**: `N/A`

### Policy: Usuarios podem fazer upload de midias
- **Command**: INSERT
- **Roles**: {public}
- **Permissive**: PERMISSIVE
- **Using**: `N/A`
- **With Check**: `((bucket_id = 'midias'::text) AND (auth.role() = 'authenticated'::text))`

