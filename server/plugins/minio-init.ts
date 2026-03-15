import { PutBucketPolicyCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3'
import { getStorageClient, MINIO_BUCKET } from '~/server/lib/storage'

export default defineNitroPlugin(async () => {
  try {
    const s3 = getStorageClient()

    // Criar bucket se não existir
    try {
      await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }))
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }))
      console.log(`✅ Bucket '${MINIO_BUCKET}' criado`)
    }

    // Definir política public-read para todos os objetos
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`]
      }]
    })

    await s3.send(new PutBucketPolicyCommand({ Bucket: MINIO_BUCKET, Policy: policy }))
    console.log(`✅ Bucket '${MINIO_BUCKET}' configurado como public-read`)
  } catch (error: any) {
    console.error('❌ Erro ao configurar bucket Minio:', error?.message || error)
  }
})
