<<<<<<< Updated upstream
import { db } from '~/server/db'
import { empresas } from '~/server/db/schema'
=======
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
    // Obter dados do corpo da requisição
=======
>>>>>>> Stashed changes
    const body = await readBody(event)
    const { nome, vencimento, max_usuarios } = body

    if (!nome || nome.trim().length < 2) {
      throw createError({ statusCode: 400, statusMessage: 'Nome da empresa é obrigatório e deve ter pelo menos 2 caracteres' })
    }

    if (!vencimento) {
      throw createError({ statusCode: 400, statusMessage: 'Data de vencimento é obrigatória' })
    }

    const maxUsers = max_usuarios ? parseInt(max_usuarios) : 5
    if (isNaN(maxUsers) || maxUsers < 1) {
      throw createError({ statusCode: 400, statusMessage: 'Número máximo de usuários deve ser pelo menos 1' })
    }

    const dataVenc = new Date(vencimento)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (dataVenc < hoje) {
      throw createError({ statusCode: 400, statusMessage: 'Data de vencimento não pode ser anterior a hoje' })
    }

<<<<<<< Updated upstream
    // Criar nova empresa
    const empresa = await db
      .insert(empresas)
      .values({
        nome: nome.trim(),
        vencimento: dataVenc.toISOString().split('T')[0],
        max_usuarios: maxUsers
      })
      .returning()
      .then(r => r[0])

    if (!empresa) {
      console.error('Erro ao criar empresa: nenhum registro retornado')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar empresa'
      })
=======
    const [empresa] = await db.insert(schema.empresas).values({
      nome: nome.trim(),
      vencimento: dataVenc.toISOString().split('T')[0],
      max_usuarios: maxUsers
    }).returning()

    if (!empresa) {
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar empresa' })
>>>>>>> Stashed changes
    }

    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    let statusVencimento = 'normal'
    if (diffDias < 0) statusVencimento = 'vencido'
    else if (diffDias <= 7) statusVencimento = 'urgente'
    else if (diffDias <= 30) statusVencimento = 'atencao'

    return {
      success: true,
      data: {
        id: empresa.id,
        nome: empresa.nome,
        vencimento: empresa.vencimento,
        maxUsuarios: empresa.max_usuarios,
        diasParaVencimento: diffDias,
        statusVencimento,
        totalUsuarios: 0,
        usuarios: [],
        criadaEm: empresa.created_at,
        atualizadaEm: empresa.updated_at
      },
      message: 'Empresa criada com sucesso!'
    }

  } catch (error: any) {
<<<<<<< Updated upstream
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
=======
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
