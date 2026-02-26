import { db } from '~/server/db'
import { users, empresas } from '~/server/db/schema'
import { eq, asc } from 'drizzle-orm'

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

    // Buscar todas as empresas ordenadas por nome
    const empresasList = await db
      .select()
      .from(empresas)
      .orderBy(asc(empresas.nome))

    // Buscar todos os usuários (para associar às empresas)
    const usuariosList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        empresa_id: users.empresa_id
      })
      .from(users)

    // Formatar dados para retorno
    const empresasFormatadas = empresasList.map(empresa => {
      const usuariosDaEmpresa = usuariosList.filter(u => u.empresa_id === empresa.id)
      const totalUsuarios = usuariosDaEmpresa.length

      // Calcular dias até o vencimento
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const dataVencimento = new Date(empresa.vencimento)
      dataVencimento.setHours(0, 0, 0, 0)
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
        usuarios: usuariosDaEmpresa.map(usuario => ({
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

  } catch (error: any) {
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
