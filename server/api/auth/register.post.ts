import { serverSupabaseServiceRole } from '#supabase/server'
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

  const client = serverSupabaseServiceRole(event)

  // Verificar se usuário já existe
  const { data: existingUser } = await client
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email já cadastrado'
    })
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password)

  // Criar usuário
  const { data: newUser, error } = await client
    .from('users')
    .insert({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      status: 'active' // Ou pending se quiser confirmação
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar usuário'
    })
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
    path: '/'
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

