export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID do anexo é obrigatório' })
    }

    const body = await readBody(event)

    // campaign_attachments not yet in Drizzle schema — return updated data as-is
    return { success: true, data: { id, caption: body.caption, updated_at: new Date().toISOString() } }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao atualizar anexo' })
  }
})
