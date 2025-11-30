import { serverSupabaseServiceRole } from '#supabase/server'
import { hashPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)
    const { name, email, role, password } = body

    if (!name || !email || !role) {
      throw createError({ statusCode: 400, statusMessage: 'Dados incompletos' })
    }

    const client = serverSupabaseServiceRole(event)

    // Buscar empresa do usuário criador
    const { data: creatorData } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!creatorData?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa' })
    }

    // Verificar se email já existe
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw createError({ statusCode: 400, statusMessage: 'Email já cadastrado' })
    }

    // Senha padrão se não fornecida (poderia ser gerada aleatoriamente)
    const defaultPassword = password || 'Mudar123!'
    const hashedPassword = await hashPassword(defaultPassword)

    // Criar usuário
    const { data: newUser, error } = await client
      .from('users')
      .insert({
        name,
        email,
        role,
        password: hashedPassword,
        empresa_id: creatorData.empresa_id,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar agente:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar agente' })
    }

    return { success: true, data: newUser }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})

