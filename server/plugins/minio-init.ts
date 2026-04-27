import { HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3'
import { getStorageClient, MINIO_BUCKET } from '~/server/lib/storage'

export default defineNitroPlugin(async () => {
  try {
    // Se for R2, não tentamos gerenciar permissões via API, pois o R2 não suporta PutBucketPolicy via S3 SDK
    if (process.env.R2_ACCOUNT_ID) {
        console.log('☁️ Usando Cloudflare R2. Certifique-se de ativar o Public Access no painel da Cloudflare.')
        return
    }

    const s3 = getStorageClient()

    // Criar bucket se não existir
    try {
      await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }))
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }))
      console.log(`✅ Bucket '${MINIO_BUCKET}' criado`)
    }

    // Nota: Pulando PutBucketPolicy pois muitos provedores S3 (como R2) 
    // ou configurações restritas de Minio não permitem isso via IAM User simples.
    // É melhor configurar a regra de leitura pública diretamente no painel do storage.
    
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('Access Denied')) {
        console.warn('⚠️ Storage: Erro de autenticação. Verifique suas chaves no .env')
        return
    }
    console.error('❌ Erro ao configurar storage:', error?.message || error)
  }
})
