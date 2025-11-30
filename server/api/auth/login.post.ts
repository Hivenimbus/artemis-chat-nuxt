import { serverSupabaseServiceRole } from '#supabase/server'
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

  const client = serverSupabaseServiceRole(event)

  // Buscar usuário
  const { data: user, error } = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciais inválidas'
    })
  }

  // Verificar senha
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

  // Gerar Token
  const token = signUserToken({
    id: user.id,
    email: user.email,
    role: user.role
  })

  // Definir cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/'
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

