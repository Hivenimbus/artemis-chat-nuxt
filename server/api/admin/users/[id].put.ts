import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID do usuário é obrigatório' })

  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    if (user.role !== 'superadmin') throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem editar usuários.' })

    const updateData: any = { updated_at: new Date() }
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.role !== undefined) updateData.role = body.role
    if (body.empresa_id !== undefined) updateData.empresa_id = body.empresa_id
    if (body.email !== undefined) updateData.email = body.email

    if (Object.keys(updateData).length <= 1) return { success: true, message: 'Nenhum dado para atualizar' }

    const [updatedUser] = await db.update(schema.users).set(updateData).where(eq(schema.users.id, id)).returning()

    return { success: true, data: updatedUser }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno do servidor' })
  }
})
