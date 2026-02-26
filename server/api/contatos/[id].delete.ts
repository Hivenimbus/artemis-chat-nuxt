import { db } from '~/server/db'
import { users, contatos } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos/[id] (DELETE): Iniciando requisição')

    const contatoId = getRouterParam(event, 'id')

    if (!contatoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato não fornecido'
      })
    }

    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(contatoId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato inválido'
      })
    }

    console.log('API /api/contatos/[id] (DELETE): Excluindo contato:', contatoId)

    const user = event.context.user

    if (!user) {
      console.error('API /api/contatos/[id] (DELETE): Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Buscar dados completos do usuário na tabela users
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData || !userData.empresa_id) {
      console.error('API /api/contatos/[id] (DELETE): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se o contato existe e pertence à empresa do usuário
    const contatoExistente = await db
      .select({ id: contatos.id, nome: contatos.nome })
      .from(contatos)
      .where(and(eq(contatos.id, contatoId), eq(contatos.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!contatoExistente) {
      console.error('API /api/contatos/[id] (DELETE): Contato não encontrado')
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado'
      })
    }

    console.log('API /api/contatos/[id] (DELETE): Contato encontrado, iniciando exclusão:', contatoExistente.nome)

    // Excluir o contato (as associações com etiquetas serão excluídas em cascata via ON DELETE CASCADE)
    await db
      .delete(contatos)
      .where(and(eq(contatos.id, contatoId), eq(contatos.empresa_id, userData.empresa_id)))

    console.log('API /api/contatos/[id] (DELETE): Contato excluído com sucesso:', contatoId)

    return {
      success: true,
      message: 'Contato excluído com sucesso',
      data: {
        id: contatoId,
        nome: contatoExistente.nome
      }
    }

  } catch (error: any) {
    console.error('API /api/contatos/[id] (DELETE): Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
