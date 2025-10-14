import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  try {
    const body = await readBody(event)
    const { title, description } = body

    // Validação dos campos obrigatórios
    if (!title || !title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'O título é obrigatório'
      })
    }

    // Obter o empresa_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Criar novo kanban
    const { data: kanban, error } = await supabase
      .from('kanbans')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        empresa_id: userData.empresa_id,
        criado_por: user.id
      })
      .select(`
        id,
        title,
        description,
        created_at,
        updated_at,
        criado_por,
        users (
          id,
          name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar kanban:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar kanban'
      })
    }

    // Criar colunas padrão para o novo kanban
    const defaultColumns = [
      { title: 'Para Fazer', icon: 'clipboard', color: 'blue', position: 0 },
      { title: 'Fazendo', icon: 'clock', color: 'yellow', position: 1 },
      { title: 'Concluído', icon: 'check', color: 'green', position: 2 }
    ]

    for (const column of defaultColumns) {
      const { error: columnError } = await supabase
        .from('kanban_columns')
        .insert({
          kanban_id: kanban.id,
          title: column.title,
          icon: column.icon,
          color: column.color,
          position: column.position
        })

      if (columnError) {
        console.error('Erro ao criar coluna padrão:', columnError)
        // Não falhar completamente se uma coluna não for criada
      }
    }

    return {
      success: true,
      data: {
        ...kanban,
        columns_count: 3,
        cards_count: 0,
        createdAt: kanban.created_at,
        updatedAt: kanban.updated_at,
        createdBy: kanban.users
      }
    }
  } catch (error) {
    console.error('Erro no handler de kanbans POST:', error)
    throw error
  }
})