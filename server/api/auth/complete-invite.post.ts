<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes
import { verifyInviteToken, signUserToken } from '~/server/utils/jwt'
import { hashPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, password } = body

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Token e senha são obrigatórios' })
  }

  const payload = verifyInviteToken(token)
  if (!payload) {
    throw createError({ statusCode: 400, statusMessage: 'Convite inválido ou expirado' })
  }

<<<<<<< Updated upstream
  // Buscar usuário pelo email para garantir que existe e está pendente
  const user = await db.select().from(users).where(eq(users.email, payload.email)).limit(1).then(r => r[0])
=======
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, payload.email)).limit(1)
>>>>>>> Stashed changes

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  if (user.status === 'active') {
    throw createError({ statusCode: 400, statusMessage: 'Esta conta já foi ativada. Por favor, faça login.' })
  }

  const hashedPassword = await hashPassword(password)

<<<<<<< Updated upstream
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
=======
  await db.update(schema.users)
    .set({
      password: hashedPassword,
      status: 'active',
      updated_at: new Date()
    })
    .where(eq(schema.users.id, user.id))

>>>>>>> Stashed changes
  const authToken = signUserToken({
    id: user.id,
    email: user.email!,
    role: user.role
  })

  setCookie(event, 'auth_token', authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
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
