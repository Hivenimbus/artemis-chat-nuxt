import { S3Client } from '@aws-sdk/client-s3'

function createStorageClient(): S3Client {
    const endpoint = process.env.MINIO_ENDPOINT
    const accessKeyId = process.env.MINIO_ACCESS_KEY
    const secretAccessKey = process.env.MINIO_SECRET_KEY
    const region = process.env.MINIO_REGION || 'us-east-1'

    if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('Minio/S3 environment variables are not configured (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)')
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

export const MINIO_BUCKET = process.env.MINIO_BUCKET_NAME || 'artemis-media'

export function getStorageClient(): S3Client {
    return createStorageClient()
}

/**
 * Get the public URL for a stored file object key
 */
export function getPublicUrl(objectKey: string): string {
    const endpoint = process.env.MINIO_ENDPOINT || ''
    const bucket = MINIO_BUCKET
    // Remove trailing slash from endpoint
    const base = endpoint.replace(/\/$/, '')
    return `${base}/${bucket}/${objectKey}`
}
