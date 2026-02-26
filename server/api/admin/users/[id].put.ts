<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID do usuário é obrigatório' })

  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    if (user.role !== 'superadmin') throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem editar usuários.' })

<<<<<<< Updated upstream
    if (user.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Apenas superadmins podem editar usuários.'
      })
    }

    const updateData: Record<string, any> = {}
=======
    const updateData: any = { updated_at: new Date() }
>>>>>>> Stashed changes
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.role !== undefined) updateData.role = body.role
<<<<<<< Updated upstream
    if (body.status !== undefined) updateData.status = body.status
    if (body.empresa_id !== undefined) updateData.empresa_id = body.empresa_id

    if (Object.keys(updateData).length === 0) {
      return { success: true, message: 'Nenhum dado para atualizar' }
    }

    updateData.updated_at = new Date()

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuário não encontrado'
      })
    }

    return {
      success: true,
      data: updatedUser
    }
=======
    if (body.empresa_id !== undefined) updateData.empresa_id = body.empresa_id
    if (body.email !== undefined) updateData.email = body.email

    if (Object.keys(updateData).length <= 1) return { success: true, message: 'Nenhum dado para atualizar' }

    const [updatedUser] = await db.update(schema.users).set(updateData).where(eq(schema.users.id, id)).returning()

    return { success: true, data: updatedUser }
>>>>>>> Stashed changes

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno do servidor' })
  }
})
