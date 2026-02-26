<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes
import { verifyPassword } from '~/server/utils/password'
import { signUserToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email e senha são obrigatórios'
    })
  }

<<<<<<< Updated upstream
  // Buscar usuário
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0])
=======
  // Find user by email
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
>>>>>>> Stashed changes

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciais inválidas'
    })
  }

  if (!user.password) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuário não configurado para este tipo de login'
    })
  }

  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciais inválidas'
    })
  }

  const token = signUserToken({
    id: user.id,
    email: user.email!,
    role: user.role
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax'
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  }
})
