<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes
import { hashPassword, verifyPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const body = await readBody(event)
    const { name, currentPassword, newPassword } = body

    if (!name || name.trim() === '') {
      throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório' })
    }

    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      throw createError({ statusCode: 400, statusMessage: 'ID de usuário inválido' })
    }

<<<<<<< Updated upstream
    const updateData: Record<string, any> = {
=======
    const updateData: Partial<typeof schema.users.$inferInsert> = {
>>>>>>> Stashed changes
      name: name.trim(),
      updated_at: new Date()
    }

    if (currentPassword && newPassword) {
<<<<<<< Updated upstream
      // Buscar usuário completo para validar senha atual
      const userData = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
        .then(r => r[0])

      if (!userData) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao validar usuário'
        })
=======
      const [userData] = await db.select({ password: schema.users.password }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

      if (!userData) {
        throw createError({ statusCode: 500, statusMessage: 'Erro ao validar usuário' })
>>>>>>> Stashed changes
      }

      if (!userData.password) {
        throw createError({ statusCode: 400, statusMessage: 'Usuário não possui senha configurada' })
      }

      const isValid = await verifyPassword(currentPassword, userData.password)
      if (!isValid) {
        throw createError({ statusCode: 400, statusMessage: 'Senha atual incorreta' })
      }

      if (newPassword.length < 6) {
        throw createError({ statusCode: 400, statusMessage: 'A nova senha deve ter no mínimo 6 caracteres' })
      }

<<<<<<< Updated upstream
      const hashedPassword = await hashPassword(newPassword)
      updateData.password = hashedPassword
    } else if (newPassword && !currentPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Informe a senha atual para alterar a senha'
      })
    }

    // Atualizar dados do usuário na tabela users
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning()
      .then(r => r[0])

    if (!updatedUser) {
      console.error('API /api/user.put: Erro ao atualizar dados do usuário no banco, userId:', user.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar dados do usuário'
      })
=======
      updateData.password = await hashPassword(newPassword)
    } else if (newPassword && !currentPassword) {
      throw createError({ statusCode: 400, statusMessage: 'Informe a senha atual para alterar a senha' })
    }

    const [updatedUser] = await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, user.id))
      .returning()

    if (!updatedUser) {
      throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar dados do usuário' })
>>>>>>> Stashed changes
    }

    return { success: true, data: updatedUser }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
