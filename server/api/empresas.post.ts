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

    // Obter dados do corpo da requisição
    const body = await readBody(event)
    const { nome, vencimento } = body

    // Validar dados obrigatórios
    if (!nome || nome.trim().length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome da empresa é obrigatório e deve ter pelo menos 2 caracteres'
      })
    }

    if (!vencimento) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data de vencimento é obrigatória'
      })
    }

    // Validar data de vencimento
    const dataVenc = new Date(vencimento)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (dataVenc < hoje) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data de vencimento não pode ser anterior a hoje'
      })
    }

    // Criar nova empresa
    const { data: empresa, error } = await client
      .from('empresas')
      .insert({
        nome: nome.trim(),
        vencimento: dataVenc.toISOString().split('T')[0]
      })
      .select(`
        id,
        nome,
        vencimento,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Erro ao criar empresa:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar empresa'
      })
    }

    // Calcular dias até o vencimento
    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    // Determinar status do vencimento (mesma lógica do GET)
    let statusVencimento = 'normal'
    if (diffDias < 0) {
      statusVencimento = 'vencido'
    } else if (diffDias <= 7) {
      statusVencimento = 'urgente'
    } else if (diffDias <= 30) {
      statusVencimento = 'atencao'
    }

    // Formatar dados para retorno
    const empresaFormatada = {
      id: empresa.id,
      nome: empresa.nome,
      vencimento: empresa.vencimento,
      diasParaVencimento: diffDias,
      statusVencimento,
      totalUsuarios: 0,
      usuarios: [],
      criadaEm: empresa.created_at,
      atualizadaEm: empresa.updated_at
    }

    return {
      success: true,
      data: empresaFormatada,
      message: 'Empresa criada com sucesso!'
    }

  } catch (error) {
    console.error('Erro no handler de criação de empresa:', error)

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