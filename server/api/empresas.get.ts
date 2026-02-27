import { eq, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (user.role !== 'superadmin') {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem acessar este recurso.' })
    }

    const empresasList = await db.query.empresas.findMany({
      with: {
        users: { columns: { id: true, name: true, email: true, role: true } }
      },
      orderBy: [asc(schema.empresas.nome)]
    })

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const empresasFormatadas = empresasList.map(empresa => {
      const usuarios = empresa.users || []
      const dataVencimento = new Date(empresa.vencimento)
      dataVencimento.setHours(0, 0, 0, 0)
      const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      let statusVencimento = 'normal'
      if (diffDias < 0) statusVencimento = 'vencido'
      else if (diffDias <= 7) statusVencimento = 'urgente'
      else if (diffDias <= 30) statusVencimento = 'atencao'

      return {
        id: empresa.id,
        nome: empresa.nome,
        vencimento: empresa.vencimento,
        maxUsuarios: empresa.max_usuarios,
        diasParaVencimento: diffDias,
        statusVencimento,
        totalUsuarios: usuarios.length,
        usuarios: usuarios.map(u => ({ id: u.id, nome: u.name || 'Sem nome', email: u.email, role: u.role })),
        criadaEm: empresa.created_at,
        atualizadaEm: empresa.updated_at
      }
    })

    return { success: true, data: empresasFormatadas }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
