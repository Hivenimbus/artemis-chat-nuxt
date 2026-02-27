import { asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    if (user.role !== 'superadmin') throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem acessar este recurso.' })

    const users = await db.query.users.findMany({
      orderBy: [asc(schema.users.name)],
      with: { empresa: { columns: { id: true, nome: true } } }
    })

    const usersFormatados = users.map(u => ({
      id: u.id, nome: u.name || 'Sem nome', email: u.email,
      role: u.role, status: (u as any).status || 'pending', empresaId: u.empresa_id,
      empresaNome: u.empresa?.nome || null,
      empresaVencimento: null, // vencimento removed from schema, can add back if needed
      hasEmpresa: !!u.empresa_id,
      empresaStatus: 'normal'
    }))

    return { success: true, data: usersFormatados }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
