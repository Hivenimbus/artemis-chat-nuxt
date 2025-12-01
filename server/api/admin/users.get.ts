import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Verificar se o usuário é superadmin
    const { data: userData, error: roleError } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Apenas superadmins podem acessar este recurso.'
      })
    }

    // Buscar todos os usuários e suas empresas
    const { data: users, error } = await client
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        status,
        empresa_id,
        empresas (
          id,
          nome,
          vencimento
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar usuários'
      })
    }

    // Formatar dados para retorno
    const usersFormatados = users.map(usuario => ({
      id: usuario.id,
      nome: usuario.name || 'Sem nome',
      email: usuario.email,
      role: usuario.role,
      status: usuario.status || 'pending',
      empresaId: usuario.empresa_id,
      // Dados da empresa (pode ser null se for órfão)
      empresaNome: usuario.empresas?.nome || null,
      empresaVencimento: usuario.empresas?.vencimento || null,
      
      // Propriedades derivadas para facilitar exibição no frontend
      hasEmpresa: !!usuario.empresa_id,
      empresaStatus: calculateEmpresaStatus(usuario.empresas?.vencimento)
    }))

    return {
      success: true,
      data: usersFormatados
    }

  } catch (error) {
    console.error('Erro no handler de admin/users:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})

// Função auxiliar para calcular status (reutilizada lógica de empresas.get.ts simplificada)
function calculateEmpresaStatus(vencimento: string | null): string {
  if (!vencimento) return 'unknown'

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataVencimento = new Date(vencimento)
  dataVencimento.setHours(0, 0, 0, 0)
  const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias < 0) return 'vencido'
  if (diffDias <= 7) return 'urgente'
  if (diffDias <= 30) return 'atencao'
  return 'normal'
}

