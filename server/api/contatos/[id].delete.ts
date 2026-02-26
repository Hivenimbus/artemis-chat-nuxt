<<<<<<< Updated upstream
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

=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
>>>>>>> Stashed changes
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const contatoId = getRouterParam(event, 'id')
    if (!contatoId) throw createError({ statusCode: 400, statusMessage: 'ID do contato não fornecido' })

<<<<<<< Updated upstream
    // Buscar dados completos do usuário na tabela users
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    const [contatoExistente] = await db.select({ id: schema.contatos.id, nome: schema.contatos.nome })
      .from(schema.contatos)
      .where(and(eq(schema.contatos.id, contatoId), eq(schema.contatos.empresa_id, userData.empresa_id)))
      .limit(1)
>>>>>>> Stashed changes

    if (!contatoExistente) throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' })

<<<<<<< Updated upstream
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
=======
    await db.delete(schema.contatos).where(eq(schema.contatos.id, contatoId))

    return { success: true, message: 'Contato excluído com sucesso', data: { id: contatoId, nome: contatoExistente.nome } }
>>>>>>> Stashed changes

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
