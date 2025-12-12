import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo enviado' })
    }

    const file = files[0] // Assuming single file upload
    if (!file.filename) {
        throw createError({ statusCode: 400, statusMessage: 'Arquivo inválido' })
    }

    const fileExt = file.filename.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `campaigns/${user.id}/${fileName}`

    const client = serverSupabaseServiceRole(event)

    const { error: uploadError } = await client
      .storage
      .from('midias')
      .upload(filePath, file.data, {
        contentType: file.type
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao fazer upload do arquivo' })
    }

    const { data: { publicUrl } } = client
      .storage
      .from('midias')
      .getPublicUrl(filePath)

    return {
      success: true,
      publicUrl,
      fileName: file.filename,
      fileType: file.type,
      filePath
    }

  } catch (error: any) {
    console.error('API upload error:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno no upload' 
    })
  }
})

