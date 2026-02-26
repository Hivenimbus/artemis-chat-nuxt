import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
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

  // Verificar se usuário já existe
  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1).then(r => r[0])

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email já cadastrado'
    })
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password)

  // Criar usuário
  let newUser
  try {
    newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      status: 'active'
    }).returning().then(r => r[0])
  } catch (e: any) {
    if (e?.code === '23505') {
      throw createError({ statusCode: 400, statusMessage: 'Email já cadastrado' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Erro ao criar usuário' })
  }

  // Gerar Token
  const token = signUserToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role
  })

  // Definir cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
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
