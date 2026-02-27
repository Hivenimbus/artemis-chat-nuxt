export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)
    if (!body.fileUrl) throw createError({ statusCode: 400, statusMessage: 'URL do arquivo é obrigatória' })

    // campaign_attachments not yet in Drizzle schema — return the data as-is
    return { success: true, data: { id: body.id, file_url: body.fileUrl, file_type: body.fileType, file_name: body.fileName, caption: body.caption } }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao salvar anexo' })
  }
})
