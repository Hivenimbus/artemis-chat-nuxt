<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, atendimentos, inboxes, contatos, mensagens } from '~/server/db/schema'
import { eq, isNotNull } from 'drizzle-orm'
import { deleteFile } from '~/server/lib/storage'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id].delete: Iniciando exclusão de atendimento')

=======
import { eq, isNotNull } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getStorageClient } from '~/server/lib/storage'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  try {
>>>>>>> Stashed changes
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

<<<<<<< Updated upstream
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

=======
>>>>>>> Stashed changes
    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) throw createError({ statusCode: 400, statusMessage: 'ID do atendimento é obrigatório' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    const atendimento = await db.query.atendimentos.findFirst({
      where: eq(schema.atendimentos.id, atendimentoId),
      with: { inbox: true }
    })

    if (!atendimento || atendimento.inbox?.empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa' })
    }

<<<<<<< Updated upstream
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
=======
    // Buscar mensagens com mídia para exclusão do storage
    const mensagensComMidia = await db.select({ media_url: schema.mensagens.media_url })
      .from(schema.mensagens)
      .where(eq(schema.mensagens.atendimento_id, atendimentoId))

    const mediaUrls = mensagensComMidia.map(m => m.media_url).filter(Boolean) as string[]

    if (mediaUrls.length > 0) {
      const config = useRuntimeConfig()
      const s3 = getStorageClient()
      for (const url of mediaUrls) {
        try {
          // Extract key from URL
          const urlObj = new URL(url)
          const key = urlObj.pathname.replace(/^\/[^/]+\//, '') // Remove bucket prefix
          await s3.send(new DeleteObjectCommand({ Bucket: config.minioBucket as string, Key: key }))
        } catch (e) {
          console.error('Erro ao excluir arquivo do Minio:', e)
>>>>>>> Stashed changes
        }
      }
    }

<<<<<<< Updated upstream
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
=======
    // Excluir mensagens
    await db.delete(schema.mensagens).where(eq(schema.mensagens.atendimento_id, atendimentoId))

    // Excluir atendimento
    await db.delete(schema.atendimentos).where(eq(schema.atendimentos.id, atendimentoId))

    return { success: true, message: 'Atendimento excluído com sucesso' }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
