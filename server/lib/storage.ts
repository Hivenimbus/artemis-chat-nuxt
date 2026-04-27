import { S3Client } from '@aws-sdk/client-s3'

function normalizeEndpoint(endpoint: string): string {
    if (!endpoint) return endpoint
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint
    return 'https://' + endpoint
}

function createStorageClient(): S3Client {
    // Tenta primeiro o padrão R2 Cloudflare
    const r2AccountId = process.env.R2_ACCOUNT_ID
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
    const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY

    if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
        return new S3Client({
            region: 'auto',
            endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: r2AccessKeyId,
                secretAccessKey: r2SecretAccessKey
            }
        })
    }

    // Fallback para Minio/S3 Genérico
    const endpoint = normalizeEndpoint(process.env.MINIO_ENDPOINT || '')
    const accessKeyId = process.env.MINIO_ACCESS_KEY
    const secretAccessKey = process.env.MINIO_SECRET_KEY
    const region = process.env.MINIO_REGION || 'us-east-1'

    if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('Storage environment variables are not configured (R2 or Minio)')
    }

    return new S3Client({
        endpoint,
        region,
        credentials: {
            accessKeyId,
            secretAccessKey
        },
        forcePathStyle: true // Required for Minio
    })
}

export const MINIO_BUCKET = process.env.R2_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || 'artemis-media'

export function getStorageClient(): S3Client {
    return createStorageClient()
}

/**
 * Get the public URL for a stored file object key
 */
export function getPublicUrl(objectKey: string): string {
    // Se tiver URL pública do R2 configurada, usa ela
    const r2PublicUrl = process.env.R2_PUBLIC_URL
    if (r2PublicUrl) {
        const base = r2PublicUrl.replace(/\/$/, '')
        return `${base}/${objectKey}`
    }

    // Fallback para o endpoint de storage direto (padrão S3/Minio)
    const endpoint = normalizeEndpoint(process.env.MINIO_ENDPOINT || process.env.R2_ENDPOINT || '')
    const bucket = MINIO_BUCKET
    const base = endpoint.replace(/\/$/, '')
    return `${base}/${bucket}/${objectKey}`
}
