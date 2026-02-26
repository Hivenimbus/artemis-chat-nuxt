import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/user.put: Iniciando requisição')

    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/user.put: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Ler corpo da requisição
    const body = await readBody(event)
    const { name, currentPassword, newPassword } = body

    if (!name || name.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome é obrigatório'
      })
    }

    console.log('API /api/user.put: Atualizando usuário:', user.id)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      console.error('API /api/user.put: ID de usuário inválido:', user.id)
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de usuário inválido'
      })
    }

    const updateData: Record<string, any> = {
      name: name.trim(),
      updated_at: new Date()
    }

    // Lógica para troca de senha
    if (currentPassword && newPassword) {
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
      }

      // Validar senha atual
      if (!userData.password) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Usuário não possui senha configurada'
        })
      }

      const isValid = await verifyPassword(currentPassword, userData.password)
      if (!isValid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Senha atual incorreta'
        })
      }

      // Hash nova senha
      if (newPassword.length < 6) {
        throw createError({
          statusCode: 400,
          statusMessage: 'A nova senha deve ter no mínimo 6 caracteres'
        })
      }

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
    }

    console.log('API /api/user.put: Usuário atualizado com sucesso:', updatedUser.id)

    return {
      success: true,
      data: updatedUser
    }

  } catch (error: any) {
    console.error('API /api/user.put: Erro no handler:', {
      error: error,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      stack: error.stack
    })

    // Se já for um erro criado, retornar como está
    if (error.statusCode) {
      throw error
    }

    // Erro genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
