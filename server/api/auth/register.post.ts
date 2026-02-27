import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { hashPassword } from '~/server/utils/password'
import { signUserToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name } = body

  if (!email || !password || !name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos os campos são obrigatórios'
    })
  }

  // Check if user already exists
  const [existingUser] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1)

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email já cadastrado'
    })
  }

  const hashedPassword = await hashPassword(password)

  const [newUser] = await db.insert(schema.users).values({
    email,
    password: hashedPassword,
    name,
    role: 'user',
    status: 'active'
  }).returning()

  if (!newUser) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar usuário'
    })
  }

  const token = signUserToken({
    id: newUser.id,
    email: newUser.email!,
    role: newUser.role
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
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    },
    token
  }
})
