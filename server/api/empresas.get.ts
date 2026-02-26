<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, empresas } from '~/server/db/schema'
import { eq, asc } from 'drizzle-orm'
=======
import { eq, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (user.role !== 'superadmin') {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem acessar este recurso.' })
    }

<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        totalUsuarios,
        usuarios: usuariosDaEmpresa.map(usuario => ({
          id: usuario.id,
          nome: usuario.name || 'Sem nome',
          email: usuario.email,
          role: usuario.role
        })),
=======
        totalUsuarios: usuarios.length,
        usuarios: usuarios.map(u => ({ id: u.id, nome: u.name || 'Sem nome', email: u.email, role: u.role })),
>>>>>>> Stashed changes
        criadaEm: empresa.created_at,
        atualizadaEm: empresa.updated_at
      }
    })

    return { success: true, data: empresasFormatadas }

  } catch (error: any) {
<<<<<<< Updated upstream
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
=======
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
