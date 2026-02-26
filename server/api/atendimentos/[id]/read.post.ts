<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, atendimentos, inboxes, mensagens } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) throw createError({ statusCode: 400, statusMessage: 'ID do atendimento é obrigatório' })

<<<<<<< Updated upstream
    // Obter dados do usuário
    const [userData] = await db.select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!userData?.empresa_id) {
      console.error('API /api/atendimentos/[id]/read: Usuário sem empresa')
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se atendimento existe e pertence à empresa (via inbox)
    const [atendimento] = await db
      .select({ id: atendimentos.id, empresa_id: inboxes.empresa_id })
      .from(atendimentos)
      .innerJoin(inboxes, eq(atendimentos.inbox_id, inboxes.id))
      .where(eq(atendimentos.id, atendimentoId))
      .limit(1)

    if (!atendimento || atendimento.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa'
      })
    }

    // Marcar mensagens não lidas como lidas (remetente 'contact')
    await db.update(mensagens)
      .set({ lida: true })
      .where(and(
        eq(mensagens.atendimento_id, atendimentoId),
        eq(mensagens.lida, false),
        eq(mensagens.remetente, 'contact')
      ))

    // Atualizar contador de mensagens não lidas no atendimento
    await db.update(atendimentos)
      .set({ unread_count: 0 })
      .where(eq(atendimentos.id, atendimentoId))

    console.log('API /api/atendimentos/[id]/read: Mensagens marcadas como lidas com sucesso')

    return {
      success: true,
      message: 'Mensagens marcadas como lidas'
    }

  } catch (error: any) {
    console.error('API /api/atendimentos/[id]/read: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    // Verificar se atendimento existe e pertence à empresa
    const atendimento = await db.query.atendimentos.findFirst({
      where: eq(schema.atendimentos.id, atendimentoId),
      with: { inbox: true }
>>>>>>> Stashed changes
    })

    if (!atendimento || atendimento.inbox?.empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa' })
    }

    // Marcar mensagens como lidas (apenas recebidas)
    await db.update(schema.mensagens)
      .set({ lida: true })
      .where(and(
        eq(schema.mensagens.atendimento_id, atendimentoId),
        eq(schema.mensagens.lida, false),
        eq(schema.mensagens.remetente, 'contact')
      ))

    // Zerar unread_count no atendimento
    await db.update(schema.atendimentos)
      .set({ unread_count: 0 })
      .where(eq(schema.atendimentos.id, atendimentoId))

    return { success: true, message: 'Mensagens marcadas como lidas' }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
