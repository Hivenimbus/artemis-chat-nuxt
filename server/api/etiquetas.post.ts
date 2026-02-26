import { db } from '~/server/db'
import { users, etiquetas } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas POST: Iniciando requisição')

    const user = event.context.user
    console.log('API /api/etiquetas POST: Usuário do contexto:', user?.id)

    if (!user) {
      console.error('API /api/etiquetas POST: Usuário não autenticado')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas POST: Usuário autenticado confirmado:', user.id)

    const body = await readBody(event)
    const { nome, descricao, cor } = body

    if (!nome || !cor) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome e cor são obrigatórios'
      })
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cor deve estar em formato hexadecimal válido (ex: #FF0000)'
      })
    }

    // Buscar dados completos do usuário na tabela users
    console.log('API /api/etiquetas POST: Buscando dados na tabela users para ID:', user.id)
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/etiquetas POST: Usuário não encontrado no banco:', user.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    console.log('API /api/etiquetas POST: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    if (!userData.empresa_id) {
      console.error('API /api/etiquetas POST: Usuário não possui empresa vinculada:', {
        userId: userData.id
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/etiquetas POST: Dados do usuário validados:', {
      userId: userData.id,
      empresaId: userData.empresa_id,
      role: userData.role
    })

    // Verificar se já existe uma etiqueta com o mesmo nome na empresa
    console.log('API /api/etiquetas POST: Verificando etiqueta duplicada:', nome.trim())
    const existingEtiqueta = await db
      .select({ id: etiquetas.id })
      .from(etiquetas)
      .where(and(
        eq(etiquetas.empresa_id, userData.empresa_id),
        eq(etiquetas.nome, nome.trim())
      ))
      .limit(1)
      .then(r => r[0])

    if (existingEtiqueta) {
      console.error('API /api/etiquetas POST: Etiqueta duplicada encontrada:', existingEtiqueta.id)
      throw createError({
        statusCode: 400,
        statusMessage: 'Já existe uma etiqueta com este nome'
      })
    }

    // Criar nova etiqueta
    console.log('API /api/etiquetas POST: Criando nova etiqueta:', {
      nome: nome.trim(),
      empresaId: userData.empresa_id
    })
    const etiqueta = await db
      .insert(etiquetas)
      .values({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        cor: cor.toUpperCase(),
        empresa_id: userData.empresa_id
      })
      .returning()
      .then(r => r[0])

    if (!etiqueta) {
      console.error('API /api/etiquetas POST: Erro ao criar etiqueta')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar etiqueta'
      })
    }

    console.log('API /api/etiquetas POST: Etiqueta criada com sucesso:', etiqueta.id)

    console.log('API /api/etiquetas POST: Retornando dados com sucesso')
    return {
      success: true,
      data: {
        ...etiqueta,
        usageCount: 0,
        createdAt: etiqueta.created_at,
        updatedAt: etiqueta.updated_at
      }
    }

  } catch (error: any) {
    console.error('API /api/etiquetas POST: Erro no handler:', {
      error: error,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      stack: error.stack
    })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
