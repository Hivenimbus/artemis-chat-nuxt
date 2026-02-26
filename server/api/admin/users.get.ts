import { db } from '~/server/db'
import { users, empresas } from '~/server/db/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    if (user.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Apenas superadmins podem acessar este recurso.'
      })
    }

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        empresa_id: users.empresa_id,
        empresaNome: empresas.nome,
        empresaVencimento: empresas.vencimento
      })
      .from(users)
      .leftJoin(empresas, eq(users.empresa_id, empresas.id))
      .orderBy(asc(users.name))

    const usersFormatados = result.map(usuario => ({
      id: usuario.id,
      nome: usuario.name || 'Sem nome',
      email: usuario.email,
      role: usuario.role,
      status: usuario.status || 'pending',
      empresaId: usuario.empresa_id,
      empresaNome: usuario.empresaNome || null,
      empresaVencimento: usuario.empresaVencimento || null,
      hasEmpresa: !!usuario.empresa_id,
      empresaStatus: calculateEmpresaStatus(usuario.empresaVencimento)
    }))

    return {
      success: true,
      data: usersFormatados
    }

  } catch (error: any) {
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
