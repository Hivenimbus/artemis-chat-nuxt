import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getStorageClient, MINIO_BUCKET } from '~/server/lib/storage'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

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

    // Buscar mensagens com mídia para exclusão do storage
    const mensagensComMidia = await db.select({ metadata: schema.mensagens.metadata })
      .from(schema.mensagens)
      .where(eq(schema.mensagens.atendimento_id, atendimentoId))

    const mediaUrls = mensagensComMidia
      .map(m => (m.metadata as any)?.media_url)
      .filter(Boolean) as string[]

    if (mediaUrls.length > 0) {
      const s3 = getStorageClient()
      for (const url of mediaUrls) {
        try {
          const urlObj = new URL(url)
          const key = urlObj.pathname.replace(/^\/[^/]+\//, '')
          await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: key }))
        } catch (e) {
          console.error('Erro ao excluir arquivo do Minio:', e)
        }
      }
    }

    // Excluir mensagens
    await db.delete(schema.mensagens).where(eq(schema.mensagens.atendimento_id, atendimentoId))

    // Excluir atendimento
    await db.delete(schema.atendimentos).where(eq(schema.atendimentos.id, atendimentoId))

    return { success: true, message: 'Atendimento excluído com sucesso' }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
