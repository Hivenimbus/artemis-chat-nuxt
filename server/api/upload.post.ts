import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getStorageClient, getPublicUrl } from '~/server/lib/storage'
import { db, schema } from '~/server/database'
import { MINIO_BUCKET } from '~/server/lib/storage' // Added this line to re-import MINIO_BUCKET

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

    const file = files[0]
    if (!file.filename) {
      throw createError({ statusCode: 400, statusMessage: 'Arquivo inválido' })
    }

    const fileExt = file.filename.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt} `
    const objectKey = `campaigns / ${user.id}/${fileName}`

    // Upload to Minio
    const s3 = getStorageClient()
    await s3.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: objectKey,
      Body: file.data,
      ContentType: file.type || 'application/octet-stream',
    }))

    const publicUrl = getPublicUrl(objectKey)

    // Store media record in DB
    await db.insert(schema.midias).values({
      url: publicUrl,
      path: objectKey,
      filename: file.filename,
      size: file.data.length,
      mime_type: file.type || null,
      user_id: user.id,
    })

    return {
      success: true,
      publicUrl,
      fileName: file.filename,
      fileType: file.type,
      filePath: objectKey
    }

  } catch (error: any) {
    console.error('API upload error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno no upload'
    })
  }
})
