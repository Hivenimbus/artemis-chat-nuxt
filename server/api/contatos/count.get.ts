import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)

    // Get user data to find empresa_id
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    const query = getQuery(event)
    const type = query.type as string
    const tags = query.tags ? (Array.isArray(query.tags) ? query.tags : [query.tags]) : []

    let count = 0

    if (type === 'all') {
      const { count: total, error } = await client
        .from('contatos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', userData.empresa_id)
      
      if (error) throw error
      count = total || 0
    } else if (type === 'tags' && tags.length > 0) {
      // For tags, we need to join with contato_etiquetas
      // Since supabase client doesn't support complex joins easily for count distinct in one go cleanly with filters on joined table for count only,
      // we can try a different approach or use RPC if performance is critical.
      // For now, let's use the standard approach: 
      // Select contacts where id is in (select contact_id from contato_etiquetas where etiqueta_id in tags)
      
      const { count: filteredCount, error } = await client
        .from('contatos')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', userData.empresa_id)
        .in('id', (
          await client
            .from('contato_etiquetas')
            .select('contato_id')
            .in('etiqueta_id', tags)
        ).data?.map(c => c.contato_id) || [])
        
       if (error) throw error
       count = filteredCount || 0
    }

    return {
      success: true,
      count
    }

  } catch (error: any) {
    console.error('API contatos/count.get:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno ao contar contatos' 
    })
  }
})

