import { db } from '~/server/db'
import { users, atendimentos, inboxes, contatos, mensagens } from '~/server/db/schema'
import { eq, isNotNull } from 'drizzle-orm'
import { deleteFile } from '~/server/lib/storage'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id].delete: Iniciando exclusão de atendimento')

    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do atendimento é obrigatório'
      })
    }

    // Obter dados do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se atendimento existe e pertence à empresa
    const atendimento = await db
      .select({
        id: atendimentos.id,
        inbox_empresa_id: inboxes.empresa_id
      })
      .from(atendimentos)
      .leftJoin(inboxes, eq(atendimentos.inbox_id, inboxes.id))
      .where(eq(atendimentos.id, atendimentoId))
      .limit(1)
      .then(r => r[0])

    if (!atendimento || atendimento.inbox_empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa'
      })
    }

    // 1. Buscar mensagens com mídia para exclusão do storage
    const mensagensComMidia = await db
      .select({ media_url: mensagens.media_url })
      .from(mensagens)
      .where(eq(mensagens.atendimento_id, atendimentoId))

    const mensagensComMidiaFiltradas = mensagensComMidia.filter(m => m.media_url)

    // 2. Excluir arquivos do Storage
    if (mensagensComMidiaFiltradas.length > 0) {
      const pathsToDelete: string[] = []

      for (const msg of mensagensComMidiaFiltradas) {
        if (msg.media_url) {
          try {
            const urlParts = msg.media_url.split('/midias/')
            if (urlParts.length > 1) {
              const path = decodeURIComponent(urlParts[1])
              pathsToDelete.push(path)
              console.log(`Path identificado para exclusão: ${path}`)
            } else {
              console.warn(`Não foi possível extrair path da URL: ${msg.media_url}`)
            }
          } catch (e) {
            console.error('Erro ao extrair path da mídia:', msg.media_url, e)
          }
        }
      }

      if (pathsToDelete.length > 0) {
        console.log(`Tentando excluir ${pathsToDelete.length} arquivos do storage midias`)
        for (const path of pathsToDelete) {
          try {
            await deleteFile(path)
          } catch (e) {
            console.error('Erro ao excluir arquivo do storage:', path, e)
          }
        }
      }
    }

    // 3. Desvincular contato (limpar ultimo_atendimento_id)
    await db
      .update(contatos)
      .set({ ultimo_atendimento_id: null })
      .where(eq(contatos.ultimo_atendimento_id, atendimentoId))

    // 4. Excluir mensagens vinculadas
    await db
      .delete(mensagens)
      .where(eq(mensagens.atendimento_id, atendimentoId))

    // 5. Excluir o atendimento
    await db
      .delete(atendimentos)
      .where(eq(atendimentos.id, atendimentoId))

    console.log(`Atendimento ${atendimentoId} excluído com sucesso`)

    return {
      success: true,
      message: 'Atendimento excluído com sucesso'
    }

  } catch (error: any) {
    console.error('API /api/atendimentos/[id].delete: Erro:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
