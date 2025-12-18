import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Verificar se o usuário é superadmin
    if (user.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Apenas superadmins podem acessar este recurso.'
      })
    }

    // Usar Service Role já que não estamos usando Supabase Auth
    const client = serverSupabaseServiceRole(event)

    // Buscar empresas com usuários vinculados
    const { data: empresas, error } = await client
      .from('empresas')
      .select(`
        id,
        nome,
        vencimento,
        max_usuarios,
        created_at,
        updated_at,
        users (
          id,
          name,
          email,
          role
        )
      `)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar empresas:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar empresas'
      })
    }

    // Formatar dados para retorno
    const empresasFormatadas = empresas.map(empresa => {
      const usuarios = empresa.users || []
      const totalUsuarios = usuarios.length

      // Calcular dias até o vencimento
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0) // Zerar horas para comparação correta
      const dataVencimento = new Date(empresa.vencimento)
      dataVencimento.setHours(0, 0, 0, 0) // Zerar horas para comparação correta
      const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      // Determinar status do vencimento
      let statusVencimento = 'normal'
      if (diffDias < 0) {
        statusVencimento = 'vencido'
      } else if (diffDias <= 7) {
        statusVencimento = 'urgente'
      } else if (diffDias <= 30) {
        statusVencimento = 'atencao'
      }

      return {
        id: empresa.id,
        nome: empresa.nome,
        vencimento: empresa.vencimento,
        maxUsuarios: empresa.max_usuarios,
        diasParaVencimento: diffDias,
        statusVencimento,
        totalUsuarios,
        usuarios: usuarios.map(usuario => ({
          id: usuario.id,
          nome: usuario.name || 'Sem nome',
          email: usuario.email,
          role: usuario.role
        })),
        criadaEm: empresa.created_at,
        atualizadaEm: empresa.updated_at
      }
    })

    return {
      success: true,
      data: empresasFormatadas
    }

  } catch (error) {
    console.error('Erro no handler de empresas:', error)

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