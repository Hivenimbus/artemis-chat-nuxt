import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { verifyInviteToken, signUserToken } from '~/server/utils/jwt'
import { hashPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, password } = body

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Token e senha são obrigatórios' })
  }

  // Verificar token
  const payload = verifyInviteToken(token)
  if (!payload) {
    throw createError({ statusCode: 400, statusMessage: 'Convite inválido ou expirado' })
  }

  // Buscar usuário pelo email para garantir que existe e está pendente
  const user = await db.select().from(users).where(eq(users.email, payload.email)).limit(1).then(r => r[0])

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  // Se já estiver ativo, pode ser que clicou duas vezes, mas se já tem senha...
  // Vamos permitir apenas se status for pending ou invited
  if (user.status === 'active') {
    throw createError({ statusCode: 400, statusMessage: 'Esta conta já foi ativada. Por favor, faça login.' })
  }

  // Hash senha
  const hashedPassword = await hashPassword(password)

  // Atualizar usuário
  try {
    await db.update(users).set({
      password: hashedPassword,
      status: 'active',
      updated_at: new Date()
    }).where(eq(users.id, user.id))
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: 'Erro ao ativar conta' })
  }

  // Gerar token de autenticação
  const authToken = signUserToken({
    id: user.id,
    email: user.email,
    role: user.role
  })

  // Setar cookie
  setCookie(event, 'auth_token', authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
    sameSite: 'lax'
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token: authToken
  }
})
